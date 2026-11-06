import type { Pedido } from '@shared/types/pedido'
import { TIPO_PEDIDO } from '@shared/types/pedido'
import { STATUS_MESA, TIPO_MOVIMENTACAO_MESA, TIPO_USO_MESA } from '@shared/types/mesa'
import type { CriarPedidoMesaEntrada } from '@shared/types/pedido'
import {
  executarEmTransacaoImediata,
  persistirConexaoBanco,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import type { SessaoCaixaRepository } from '../../caixa/repositories/sessao-caixa.repository'
import { criarSessaoCaixaRepository } from '../../caixa/repositories/sessao-caixa.repository'
import type { MesaRepository } from '../../mesas/repositories/mesa.repository'
import { criarMesaRepository } from '../../mesas/repositories/mesa.repository'
import {
  inserirMovimentacaoNaConexao,
  mesaPertenceAAgrupamentoAtivo,
  snapshotMesa,
} from '../../mesas/services/mesa-movimentacao.sql'
import { criarPedidoEntregaRepository } from '../../delivery/repositories/pedido-entrega.repository'
import { obterTaxaEntregaPadraoCentavos } from '../../delivery/use-cases/taxa-entrega-padrao'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../errors/erros-pedidos'
import type { PedidoRepository } from '../repositories/pedido.repository'
import { criarPedidoRepository } from '../repositories/pedido.repository'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { registrarEventoPedidoSync } from '../../sincronizacao/services/registrar-evento-pedido'
import { registrarAcaoAuditoria } from '../../sincronizacao/services/registrar-acao-auditoria'

function tipoPedidoDeMesa(tipoUso: string): Pedido['tipo'] {
  if (tipoUso === TIPO_USO_MESA.BALCAO) {
    return TIPO_PEDIDO.BALCAO
  }
  if (tipoUso === TIPO_USO_MESA.DELIVERY) {
    return TIPO_PEDIDO.DELIVERY
  }
  return TIPO_PEDIDO.MESA
}

export function criarCriarPedidoMesa(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioMesa: MesaRepository = criarMesaRepository(),
  repositorioSessao: SessaoCaixaRepository = criarSessaoCaixaRepository(),
  obterConexao = obterConexaoBancoLocal,
  obterTaxaPadrao = obterTaxaEntregaPadraoCentavos,
) {
  return function criarPedidoMesa(entrada: CriarPedidoMesaEntrada): Pedido {
    const conexao = obterConexao()
    const pedido = executarEmTransacaoImediata(conexao, () => {
      const sessaoAberta = repositorioSessao.buscarSessaoAberta()

      if (!sessaoAberta) {
        throw new ErroPedidos(
          CODIGOS_ERRO_PEDIDOS.CAIXA_NAO_ABERTO,
          'Nao existe sessao de caixa aberta.',
        )
      }

      const mesa = repositorioMesa.buscarPorId(entrada.mesaId)

      if (!mesa) {
        throw new ErroPedidos(
          CODIGOS_ERRO_PEDIDOS.MESA_NAO_ENCONTRADA,
          'Mesa nao encontrada.',
        )
      }

      if (!mesa.ativo || mesa.status === STATUS_MESA.INATIVA) {
        throw new ErroPedidos(
          CODIGOS_ERRO_PEDIDOS.MESA_INATIVA,
          'Nao e permitido abrir pedido em mesa inativa.',
        )
      }

      if (mesa.status === STATUS_MESA.AGRUPADA || mesa.status === STATUS_MESA.OCUPADA) {
        throw new ErroPedidos(
          CODIGOS_ERRO_PEDIDOS.MESA_OCUPADA,
          'Mesa ja possui pedido aberto.',
        )
      }

      if (mesaPertenceAAgrupamentoAtivo(conexao, entrada.mesaId)) {
        throw new ErroPedidos(
          CODIGOS_ERRO_PEDIDOS.MESA_OCUPADA,
          'Mesa ja pertence a um agrupamento ativo.',
        )
      }

      const pedidoAberto = repositorioPedido.buscarPedidoAbertoPorMesa(entrada.mesaId)

      if (pedidoAberto) {
        throw new ErroPedidos(
          CODIGOS_ERRO_PEDIDOS.MESA_OCUPADA,
          'Mesa ja possui pedido aberto.',
        )
      }

      const tipoPedido = tipoPedidoDeMesa(mesa.tipoUso)
      const taxaEntregaCentavos =
        tipoPedido === TIPO_PEDIDO.DELIVERY ? obterTaxaPadrao() : 0

      const pedidoCriado = repositorioPedido.inserir({
        sessaoCaixaId: sessaoAberta.id,
        mesaId: entrada.mesaId,
        tipo: tipoPedido,
        taxaEntregaCentavos,
      })

      if (tipoPedido === TIPO_PEDIDO.DELIVERY) {
        const repositorioEntrega = criarPedidoEntregaRepository()
        repositorioEntrega.inserir({
          pedidoId: pedidoCriado.id,
          clienteNome: `Delivery ${mesa.numero}`,
          telefone: null,
          endereco: null,
          observacao: null,
        })
      }

      repositorioMesa.atualizarStatus(entrada.mesaId, STATUS_MESA.OCUPADA)

      if (tipoPedido === TIPO_PEDIDO.MESA) {
        inserirMovimentacaoNaConexao(conexao, {
          pedidoId: pedidoCriado.id,
          tipo: TIPO_MOVIMENTACAO_MESA.PEDIDO_ABERTO_NA_MESA,
          mesaDestinoId: mesa.id,
          dadosAntes: { mesa: snapshotMesa(mesa) },
          dadosDepois: {
            pedidoId: pedidoCriado.id,
            mesa: { ...snapshotMesa(mesa), status: STATUS_MESA.OCUPADA },
          },
        })
      }

      const rotuloTipo =
        tipoPedido === TIPO_PEDIDO.BALCAO
          ? 'balcão'
          : tipoPedido === TIPO_PEDIDO.DELIVERY
            ? 'delivery'
            : 'mesa'

      registrarEventoPedidoSync(pedidoCriado.id, OPERACAO_SYNC.CREATE, conexao)
      registrarAcaoAuditoria(
        {
          acao: 'PEDIDO_CRIAR',
          resumo: `Abriu pedido de ${rotuloTipo} ${mesa.numero}`,
          entidade: 'PEDIDO',
          entidadeId: pedidoCriado.id,
          detalhes: {
            tipo: tipoPedido,
            mesaId: mesa.id,
            mesaNumero: mesa.numero,
            tipoUso: mesa.tipoUso,
          },
        },
        conexao,
      )

      return pedidoCriado
    })

    persistirConexaoBanco(conexao)
    return pedido
  }
}

export const criarPedidoMesa = criarCriarPedidoMesa()
