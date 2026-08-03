import {
  confirmarTransacao,
  iniciarTransacaoImediata,
  persistirConexaoBanco,
  reverterTransacao,
  type ConexaoSqlite,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import {
  MOTIVO_ENCERRAMENTO_AGRUPAMENTO,
  type EncerrarAgrupamentoMesaEntrada,
  type MesaAgrupamento,
  type ObterAgrupamentoPedidoEntrada,
  type ResumoMesaAgrupamento,
} from '@shared/types/mesa'
import { STATUS_PEDIDO, TIPO_PEDIDO } from '@shared/types/pedido'
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
  buscarAgrupamentoAtivoPorPedido,
  encerrarAgrupamentoAtivoNaConexao,
  listarMesasAgrupadasAtivas,
} from '../services/mesa-movimentacao.sql'

export function criarEncerrarAgrupamentoMesa(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  obterConexao: () => ConexaoSqlite = obterConexaoBancoLocal,
) {
  return function encerrarAgrupamentoMesa(
    entrada: EncerrarAgrupamentoMesaEntrada,
  ): MesaAgrupamento {
    const pedido = repositorioPedido.buscarPorId(entrada.pedidoId)
    if (!pedido) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.PEDIDO_NAO_ENCONTRADO,
        'Pedido nao encontrado.',
      )
    }

    const conexao = obterConexao()
    const agrupamento = buscarAgrupamentoAtivoPorPedido(conexao, entrada.pedidoId)

    if (!agrupamento) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.AGRUPAMENTO_NAO_ENCONTRADO,
        'Agrupamento ativo nao encontrado para o pedido.',
      )
    }

    if (
      entrada.motivo === MOTIVO_ENCERRAMENTO_AGRUPAMENTO.ENCERRAMENTO_MANUAL &&
      pedido.status !== STATUS_PEDIDO.ABERTO
    ) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.AGRUPAMENTO_NAO_ESTA_ATIVO,
        'Encerramento manual so e permitido com pedido aberto.',
      )
    }

    const liberarMesaPrincipal =
      entrada.motivo !== MOTIVO_ENCERRAMENTO_AGRUPAMENTO.ENCERRAMENTO_MANUAL

    iniciarTransacaoImediata(conexao)
    try {
      const encerrado = encerrarAgrupamentoAtivoNaConexao(conexao, {
        pedidoId: entrada.pedidoId,
        motivo: entrada.motivo,
        observacao: entrada.observacao ?? null,
        liberarMesaPrincipal,
      })

      if (!encerrado) {
        throw new ErroMesas(
          CODIGOS_ERRO_MESAS.AGRUPAMENTO_NAO_ESTA_ATIVO,
          'Agrupamento nao esta ativo.',
        )
      }

      confirmarTransacao(conexao)
      persistirConexaoBanco(conexao)
      return encerrado
    } catch (erro) {
      reverterTransacao(conexao)
      throw erro
    }
  }
}

export const encerrarAgrupamentoMesa = criarEncerrarAgrupamentoMesa()

export function criarObterResumoAgrupamentoMesa(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioMesa: MesaRepository = criarMesaRepository(),
  obterConexao: () => ConexaoSqlite = obterConexaoBancoLocal,
) {
  return function obterResumoAgrupamentoMesa(
    entrada: ObterAgrupamentoPedidoEntrada,
  ): ResumoMesaAgrupamento | null {
    const pedido = repositorioPedido.buscarPorId(entrada.pedidoId)
    if (!pedido) {
      throw new ErroMesas(
        CODIGOS_ERRO_MESAS.PEDIDO_NAO_ENCONTRADO,
        'Pedido nao encontrado.',
      )
    }

    if (pedido.tipo !== TIPO_PEDIDO.MESA) {
      return null
    }

    const conexao = obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT id, pedido_id, mesa_principal_id, status, criado_em, encerrado_em, motivo_encerramento
       FROM mesa_agrupamento
       WHERE pedido_id = ?
       ORDER BY criado_em DESC
       LIMIT 1`,
    )
    consulta.bind([entrada.pedidoId])

    if (!consulta.step()) {
      consulta.free()
      return null
    }

    const linha = consulta.getAsObject() as {
      id: string
      pedido_id: string
      mesa_principal_id: string
      status: 'ATIVO' | 'ENCERRADO'
      criado_em: string
      encerrado_em: string | null
      motivo_encerramento: string | null
    }
    consulta.free()

    const vinculosConsulta = conexao.instancia.prepare(
      `SELECT id, mesa_agrupamento_id, mesa_id, eh_principal, adicionada_em, removida_em
       FROM mesa_agrupada
       WHERE mesa_agrupamento_id = ?
       ORDER BY eh_principal DESC, adicionada_em ASC`,
    )
    vinculosConsulta.bind([linha.id])

    const mesas: ResumoMesaAgrupamento['mesas'] = []
    while (vinculosConsulta.step()) {
      const vinculo = vinculosConsulta.getAsObject() as {
        mesa_id: string
        eh_principal: number
        adicionada_em: string
        removida_em: string | null
      }
      const mesa = repositorioMesa.buscarPorId(vinculo.mesa_id)
      if (!mesa) continue
      mesas.push({
        id: mesa.id,
        numero: mesa.numero,
        ehPrincipal: Number(vinculo.eh_principal) === 1,
        status: mesa.status,
        adicionadaEm: vinculo.adicionada_em,
        removidaEm: vinculo.removida_em,
      })
    }
    vinculosConsulta.free()

    const mesaPrincipal =
      mesas.find((m) => m.ehPrincipal) ??
      (() => {
        const m = repositorioMesa.buscarPorId(linha.mesa_principal_id)
        return m
          ? {
              id: m.id,
              numero: m.numero,
              ehPrincipal: true,
              status: m.status,
              adicionadaEm: linha.criado_em,
              removidaEm: null,
            }
          : null
      })()

    if (!mesaPrincipal) {
      return null
    }

    return {
      agrupamento: {
        id: linha.id,
        status: linha.status,
        criadoEm: linha.criado_em,
        encerradoEm: linha.encerrado_em,
      },
      pedidoId: linha.pedido_id,
      mesaPrincipal: {
        id: mesaPrincipal.id,
        numero: mesaPrincipal.numero,
      },
      mesas,
    }
  }
}

export const obterResumoAgrupamentoMesa = criarObterResumoAgrupamentoMesa()

export function criarListarHistoricoMesa(
  obterConexao: () => ConexaoSqlite = obterConexaoBancoLocal,
) {
  return function listarHistoricoMesa(entrada: { mesaId: string }) {
    const conexao = obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT
         id, pedido_id, tipo, mesa_origem_id, mesa_destino_id, mesa_agrupamento_id,
         dados_antes_json, dados_depois_json, motivo, operador_id, criado_em
       FROM pedido_mesa_movimentacao
       WHERE mesa_origem_id = ?
          OR mesa_destino_id = ?
          OR mesa_agrupamento_id IN (
               SELECT mesa_agrupamento_id FROM mesa_agrupada WHERE mesa_id = ?
             )
          OR dados_antes_json LIKE '%' || ? || '%'
          OR dados_depois_json LIKE '%' || ? || '%'
       ORDER BY criado_em ASC`,
    )
    consulta.bind([
      entrada.mesaId,
      entrada.mesaId,
      entrada.mesaId,
      entrada.mesaId,
      entrada.mesaId,
    ])

    const itens = []
    while (consulta.step()) {
      const linha = consulta.getAsObject() as {
        id: string
        pedido_id: string
        tipo: string
        mesa_origem_id: string | null
        mesa_destino_id: string | null
        mesa_agrupamento_id: string | null
        dados_antes_json: string
        dados_depois_json: string
        motivo: string | null
        operador_id: string | null
        criado_em: string
      }
      itens.push({
        id: linha.id,
        pedidoId: linha.pedido_id,
        tipo: linha.tipo,
        mesaOrigemId: linha.mesa_origem_id,
        mesaDestinoId: linha.mesa_destino_id,
        mesaAgrupamentoId: linha.mesa_agrupamento_id,
        dadosAntesJson: linha.dados_antes_json,
        dadosDepoisJson: linha.dados_depois_json,
        motivo: linha.motivo,
        operadorId: linha.operador_id,
        criadoEm: linha.criado_em,
      })
    }
    consulta.free()

    const vistos = new Set<string>()
    return itens.filter((item) => {
      if (vistos.has(item.id)) return false
      vistos.add(item.id)
      return true
    })
  }
}

export const listarHistoricoMesa = criarListarHistoricoMesa()

export function criarListarHistoricoPedidoMesa(
  obterConexao: () => ConexaoSqlite = obterConexaoBancoLocal,
) {
  return function listarHistoricoPedidoMesa(entrada: { pedidoId: string }) {
    const conexao = obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT
         id, pedido_id, tipo, mesa_origem_id, mesa_destino_id, mesa_agrupamento_id,
         dados_antes_json, dados_depois_json, motivo, operador_id, criado_em
       FROM pedido_mesa_movimentacao
       WHERE pedido_id = ?
       ORDER BY criado_em ASC`,
    )
    consulta.bind([entrada.pedidoId])

    const itens = []
    while (consulta.step()) {
      const linha = consulta.getAsObject() as {
        id: string
        pedido_id: string
        tipo: string
        mesa_origem_id: string | null
        mesa_destino_id: string | null
        mesa_agrupamento_id: string | null
        dados_antes_json: string
        dados_depois_json: string
        motivo: string | null
        operador_id: string | null
        criado_em: string
      }
      itens.push({
        id: linha.id,
        pedidoId: linha.pedido_id,
        tipo: linha.tipo,
        mesaOrigemId: linha.mesa_origem_id,
        mesaDestinoId: linha.mesa_destino_id,
        mesaAgrupamentoId: linha.mesa_agrupamento_id,
        dadosAntesJson: linha.dados_antes_json,
        dadosDepoisJson: linha.dados_depois_json,
        motivo: linha.motivo,
        operadorId: linha.operador_id,
        criadoEm: linha.criado_em,
      })
    }
    consulta.free()
    return itens
  }
}

export const listarHistoricoPedidoMesa = criarListarHistoricoPedidoMesa()

export { listarMesasAgrupadasAtivas }
