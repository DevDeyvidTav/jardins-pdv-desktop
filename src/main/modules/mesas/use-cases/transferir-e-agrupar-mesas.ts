import { randomUUID } from 'node:crypto'
import {
  confirmarTransacao,
  iniciarTransacaoImediata,
  persistirConexaoBanco,
  reverterTransacao,
  type ConexaoSqlite,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import {
  MOTIVO_ENCERRAMENTO_AGRUPAMENTO,
  STATUS_MESA,
  TIPO_MOVIMENTACAO_MESA,
  type AgruparMesasPedidoEntrada,
  type AgruparMesasPedidoResultado,
  type TransferirPedidoMesaEntrada,
  type TransferirPedidoMesaResultado,
} from '@shared/types/mesa'
import { STATUS_PEDIDO, TIPO_PEDIDO } from '@shared/types/pedido'
import { STATUS_SESSAO_CAIXA } from '@shared/types/sessao-caixa'
import {
  criarSessaoCaixaRepository,
  type SessaoCaixaRepository,
} from '../../caixa/repositories/sessao-caixa.repository'
import {
  criarPedidoRepository,
  type PedidoRepository,
} from '../../pedidos/repositories/pedido.repository'
import { CODIGOS_ERRO_MESAS, ErroMesas } from '../errors/erros-mesas'
import {
  criarMesaRepository,
  type MesaRepository,
} from '../repositories/mesa.repository'
import {
  atualizarPedidoMesaNaConexao,
  atualizarStatusMesaNaConexao,
  buscarAgrupamentoAtivoPorPedido,
  inserirMovimentacaoNaConexao,
  mesaPertenceAAgrupamentoAtivo,
  snapshotMesa,
} from '../services/mesa-movimentacao.sql'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { registrarEventoPedidoSync } from '../../sincronizacao/services/registrar-evento-pedido'
import { registrarAcaoAuditoria } from '../../sincronizacao/services/registrar-acao-auditoria'

function garantirCaixaAberto(repositorioSessao: SessaoCaixaRepository): void {
  const sessao = repositorioSessao.buscarSessaoAberta()
  if (!sessao || sessao.status !== STATUS_SESSAO_CAIXA.ABERTO) {
    throw new ErroMesas(
      CODIGOS_ERRO_MESAS.CAIXA_NAO_ABERTO,
      'Nao existe sessao de caixa aberta.',
    )
  }
}

export function criarTransferirPedidoMesa(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioMesa: MesaRepository = criarMesaRepository(),
  repositorioSessao: SessaoCaixaRepository = criarSessaoCaixaRepository(),
  obterConexao: () => ConexaoSqlite = obterConexaoBancoLocal,
) {
  return function transferirPedidoMesa(
    entrada: TransferirPedidoMesaEntrada,
  ): TransferirPedidoMesaResultado {
    garantirCaixaAberto(repositorioSessao)

    if (!entrada.motivo || entrada.motivo.trim().length === 0) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.ENTRADA_INVALIDA,
        'Motivo da transferencia e obrigatorio.',
      )
    }

    const pedido = repositorioPedido.buscarPorId(entrada.pedidoId)
    if (!pedido) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.PEDIDO_NAO_ENCONTRADO,
        'Pedido nao encontrado.',
      )
    }

    if (pedido.tipo !== TIPO_PEDIDO.MESA) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.PEDIDO_NAO_E_DE_MESA,
        'Somente pedidos de mesa podem ser transferidos.',
      )
    }

    if (pedido.status !== STATUS_PEDIDO.ABERTO) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.PEDIDO_NAO_ESTA_ABERTO,
        'Pedido nao esta aberto para transferencia.',
      )
    }

    if (pedido.mesaAgrupamentoId || !pedido.mesaId) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.TRANSFERENCIA_DE_PEDIDO_AGRUPADO_NAO_SUPORTADA,
        'Nao e permitido transferir pedido com agrupamento ativo.',
      )
    }

    if (pedido.mesaId === entrada.mesaDestinoId) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.MESA_DESTINO_IGUAL_ORIGEM,
        'Mesa destino deve ser diferente da mesa atual.',
      )
    }

    const mesaOrigem = repositorioMesa.buscarPorId(pedido.mesaId)
    if (!mesaOrigem) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.MESA_NAO_ENCONTRADA,
        'Mesa de origem nao encontrada.',
      )
    }

    if (mesaOrigem.status !== STATUS_MESA.OCUPADA) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.MESA_ORIGEM_NAO_OCUPADA,
        'Mesa de origem deve estar ocupada.',
      )
    }

    const mesaDestino = repositorioMesa.buscarPorId(entrada.mesaDestinoId)
    if (!mesaDestino) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.MESA_NAO_ENCONTRADA,
        'Mesa destino nao encontrada.',
      )
    }

    if (!mesaDestino.ativo || mesaDestino.status === STATUS_MESA.INATIVA) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.MESA_DESTINO_INATIVA,
        'Mesa destino esta inativa.',
      )
    }

    if (mesaDestino.status !== STATUS_MESA.LIVRE) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.MESA_DESTINO_NAO_ESTA_LIVRE,
        'Mesa destino precisa estar livre.',
      )
    }

    const conexao = obterConexao()

    if (mesaPertenceAAgrupamentoAtivo(conexao, mesaDestino.id)) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.MESA_JA_PERTENCE_A_AGRUPAMENTO,
        'Mesa destino ja pertence a um agrupamento ativo.',
      )
    }

    const pedidoNaDestino = repositorioPedido.buscarPedidoAbertoPorMesa(
      mesaDestino.id,
    )
    if (pedidoNaDestino) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.MESA_POSSUI_PEDIDO_ABERTO,
        'Mesa destino ja possui pedido aberto.',
      )
    }

    const agora = agoraEmIsoUtc()
    const dadosAntes = {
      pedidoId: pedido.id,
      mesaAntes: snapshotMesa(mesaOrigem),
      mesaDepois: snapshotMesa(mesaDestino),
    }

    iniciarTransacaoImediata(conexao)
    try {
      const pedidoAtual = repositorioPedido.buscarPorId(entrada.pedidoId)
      if (!pedidoAtual || pedidoAtual.status !== STATUS_PEDIDO.ABERTO) {
        throw new ErroMesas(
          CODIGOS_ERRO_MESAS.PEDIDO_NAO_ESTA_ABERTO,
          'Pedido nao esta aberto para transferencia.',
        )
      }

      const destinoAtual = repositorioMesa.buscarPorId(entrada.mesaDestinoId)
      if (!destinoAtual || destinoAtual.status !== STATUS_MESA.LIVRE) {
        throw new ErroMesas(
          CODIGOS_ERRO_MESAS.MESA_DESTINO_NAO_ESTA_LIVRE,
          'Mesa destino precisa estar livre.',
        )
      }

      atualizarPedidoMesaNaConexao(
        conexao,
        pedido.id,
        { mesaId: mesaDestino.id },
        agora,
      )
      atualizarStatusMesaNaConexao(conexao, mesaOrigem.id, STATUS_MESA.LIVRE, agora)
      atualizarStatusMesaNaConexao(
        conexao,
        mesaDestino.id,
        STATUS_MESA.OCUPADA,
        agora,
      )

      const dadosDepois = {
        pedidoId: pedido.id,
        mesaAntes: { ...snapshotMesa(mesaOrigem), status: STATUS_MESA.LIVRE },
        mesaDepois: { ...snapshotMesa(mesaDestino), status: STATUS_MESA.OCUPADA },
      }

      inserirMovimentacaoNaConexao(conexao, {
        pedidoId: pedido.id,
        tipo: TIPO_MOVIMENTACAO_MESA.PEDIDO_TRANSFERIDO,
        mesaOrigemId: mesaOrigem.id,
        mesaDestinoId: mesaDestino.id,
        dadosAntes,
        dadosDepois,
        motivo: entrada.motivo ?? null,
        criadoEm: agora,
      })

      registrarEventoPedidoSync(pedido.id, OPERACAO_SYNC.UPDATE, conexao)
      registrarAcaoAuditoria(
        {
          acao: 'MESA_TRANSFERIR',
          resumo: `Transferiu pedido da mesa ${mesaOrigem.numero} para ${mesaDestino.numero}`,
          entidade: 'PEDIDO',
          entidadeId: pedido.id,
          detalhes: {
            mesaOrigemId: mesaOrigem.id,
            mesaDestinoId: mesaDestino.id,
            motivo: entrada.motivo,
          },
        },
        conexao,
      )
      confirmarTransacao(conexao)
    } catch (erro) {
      reverterTransacao(conexao)
      throw erro
    }

    persistirConexaoBanco(conexao)

    return {
      pedidoId: pedido.id,
      mesaOrigem: { id: mesaOrigem.id, numero: mesaOrigem.numero },
      mesaDestino: { id: mesaDestino.id, numero: mesaDestino.numero },
    }
  }
}

export const transferirPedidoMesa = criarTransferirPedidoMesa()

export function criarAgruparMesasPedido(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioMesa: MesaRepository = criarMesaRepository(),
  repositorioSessao: SessaoCaixaRepository = criarSessaoCaixaRepository(),
  obterConexao: () => ConexaoSqlite = obterConexaoBancoLocal,
) {
  return function agruparMesasPedido(
    entrada: AgruparMesasPedidoEntrada,
  ): AgruparMesasPedidoResultado {
    garantirCaixaAberto(repositorioSessao)

    const idsUnicos = [...new Set(entrada.mesaIds)]
    if (idsUnicos.length !== entrada.mesaIds.length) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.ENTRADA_INVALIDA,
        'Nao e permitido informar mesas duplicadas no agrupamento.',
      )
    }

    if (idsUnicos.length < 2) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.QUANTIDADE_MESAS_AGRUPAMENTO_INVALIDA,
        'Agrupamento exige ao menos duas mesas.',
      )
    }

    const pedido = repositorioPedido.buscarPorId(entrada.pedidoId)
    if (!pedido) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.PEDIDO_NAO_ENCONTRADO,
        'Pedido nao encontrado.',
      )
    }

    if (pedido.tipo !== TIPO_PEDIDO.MESA) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.PEDIDO_NAO_E_DE_MESA,
        'Somente pedidos de mesa podem ser agrupados.',
      )
    }

    if (pedido.status !== STATUS_PEDIDO.ABERTO) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.PEDIDO_NAO_ESTA_ABERTO,
        'Pedido nao esta aberto para agrupamento.',
      )
    }

    if (!pedido.mesaId) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.MESA_PRINCIPAL_NAO_INFORMADA,
        'Pedido de mesa sem mesa vinculada.',
      )
    }

    if (pedido.mesaAgrupamentoId) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.PEDIDO_JA_POSSUI_AGRUPAMENTO,
        'Pedido ja possui agrupamento ativo.',
      )
    }

    if (!idsUnicos.includes(pedido.mesaId)) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.MESA_PRINCIPAL_NAO_INFORMADA,
        'A mesa atual do pedido deve estar na lista de agrupamento.',
      )
    }

    const mesas = idsUnicos.map((id) => {
      const mesa = repositorioMesa.buscarPorId(id)
      if (!mesa) {
        throw new ErroMesas(
          CODIGOS_ERRO_MESAS.MESA_NAO_ENCONTRADA,
          `Mesa nao encontrada: ${id}.`,
        )
      }
      return mesa
    })

    const mesaPrincipal = mesas.find((m) => m.id === pedido.mesaId)!
    const mesasSecundarias = mesas.filter((m) => m.id !== pedido.mesaId)

    if (!mesaPrincipal.ativo || mesaPrincipal.status === STATUS_MESA.INATIVA) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.MESA_DESTINO_INATIVA,
        'Mesa principal esta inativa.',
      )
    }

    if (mesaPrincipal.status !== STATUS_MESA.OCUPADA) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.MESA_ORIGEM_NAO_OCUPADA,
        'Mesa principal deve estar ocupada.',
      )
    }

    for (const secundaria of mesasSecundarias) {
      if (!secundaria.ativo || secundaria.status === STATUS_MESA.INATIVA) {
        throw new ErroMesas(
          CODIGOS_ERRO_MESAS.MESA_DESTINO_INATIVA,
          `Mesa ${secundaria.numero} esta inativa.`,
        )
      }

      if (secundaria.status !== STATUS_MESA.LIVRE) {
        if (secundaria.status === STATUS_MESA.OCUPADA) {
          throw new ErroMesas(
            CODIGOS_ERRO_MESAS.MESCLAGEM_DE_PEDIDOS_NAO_SUPORTADA,
            'Nao e permitido agrupar mesas com mais de um pedido aberto.',
          )
        }
        throw new ErroMesas(
          CODIGOS_ERRO_MESAS.MESA_DESTINO_NAO_ESTA_LIVRE,
          `Mesa ${secundaria.numero} precisa estar livre.`,
        )
      }
    }

    const conexao = obterConexao()

    if (buscarAgrupamentoAtivoPorPedido(conexao, pedido.id)) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.PEDIDO_JA_POSSUI_AGRUPAMENTO,
        'Pedido ja possui agrupamento ativo.',
      )
    }

    for (const mesa of mesas) {
      if (mesaPertenceAAgrupamentoAtivo(conexao, mesa.id)) {
        throw new ErroMesas(
          CODIGOS_ERRO_MESAS.MESA_JA_PERTENCE_A_AGRUPAMENTO,
          `Mesa ${mesa.numero} ja pertence a um agrupamento ativo.`,
        )
      }
    }

    const agora = agoraEmIsoUtc()
    const agrupamentoId = randomUUID()

    iniciarTransacaoImediata(conexao)
    try {
      conexao.instancia.run(
        `INSERT INTO mesa_agrupamento (
           id, pedido_id, mesa_principal_id, status, criado_em, encerrado_em, motivo_encerramento
         ) VALUES (?, ?, ?, 'ATIVO', ?, NULL, NULL)`,
        [agrupamentoId, pedido.id, mesaPrincipal.id, agora],
      )

      for (const mesa of mesas) {
        const ehPrincipal = mesa.id === mesaPrincipal.id ? 1 : 0
        conexao.instancia.run(
          `INSERT INTO mesa_agrupada (
             id, mesa_agrupamento_id, mesa_id, eh_principal, adicionada_em, removida_em
           ) VALUES (?, ?, ?, ?, ?, NULL)`,
          [randomUUID(), agrupamentoId, mesa.id, ehPrincipal, agora],
        )

        if (!ehPrincipal) {
          atualizarStatusMesaNaConexao(
            conexao,
            mesa.id,
            STATUS_MESA.AGRUPADA,
            agora,
          )
        }
      }

      atualizarPedidoMesaNaConexao(
        conexao,
        pedido.id,
        { mesaAgrupamentoId: agrupamentoId },
        agora,
      )

      const dadosAntes = {
        pedidoId: pedido.id,
        mesaPrincipal: snapshotMesa(mesaPrincipal),
        mesas: mesas.map(snapshotMesa),
      }
      const dadosDepois = {
        pedidoId: pedido.id,
        agrupamentoId,
        mesaPrincipal: snapshotMesa(mesaPrincipal),
        mesas: mesas.map((m) => ({
          ...snapshotMesa(m),
          status:
            m.id === mesaPrincipal.id ? STATUS_MESA.OCUPADA : STATUS_MESA.AGRUPADA,
          ehPrincipal: m.id === mesaPrincipal.id,
        })),
      }

      inserirMovimentacaoNaConexao(conexao, {
        pedidoId: pedido.id,
        tipo: TIPO_MOVIMENTACAO_MESA.MESAS_AGRUPADAS,
        mesaOrigemId: mesaPrincipal.id,
        mesaAgrupamentoId: agrupamentoId,
        dadosAntes,
        dadosDepois,
        motivo: entrada.motivo ?? null,
        criadoEm: agora,
      })

      registrarEventoPedidoSync(pedido.id, OPERACAO_SYNC.UPDATE, conexao)
      confirmarTransacao(conexao)
    } catch (erro) {
      reverterTransacao(conexao)
      throw erro
    }

    persistirConexaoBanco(conexao)

    return {
      pedidoId: pedido.id,
      agrupamentoId,
      mesaPrincipal: { id: mesaPrincipal.id, numero: mesaPrincipal.numero },
      mesas: mesas.map((m) => ({
        id: m.id,
        numero: m.numero,
        ehPrincipal: m.id === mesaPrincipal.id,
      })),
    }
  }
}

export const agruparMesasPedido = criarAgruparMesasPedido()

export { MOTIVO_ENCERRAMENTO_AGRUPAMENTO }
