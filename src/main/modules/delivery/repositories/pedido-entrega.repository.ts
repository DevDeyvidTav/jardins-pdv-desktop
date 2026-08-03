import { randomUUID } from 'node:crypto'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import type { PedidoEntrega, StatusEntrega } from '@shared/types/pedido'
import {
  persistirConexaoBanco,
  type ConexaoSqlite,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'

interface LinhaPedidoEntregaSql {
  id: string
  pedido_id: string
  cliente_nome: string
  telefone: string | null
  observacao: string | null
  status: string
  saiu_para_entrega_em: string | null
  entregue_em: string | null
  cancelado_em: string | null
  motivo_cancelamento: string | null
  criado_em: string
  atualizado_em: string
}

function mapear(linha: LinhaPedidoEntregaSql): PedidoEntrega {
  return {
    id: linha.id,
    pedidoId: linha.pedido_id,
    clienteNome: linha.cliente_nome,
    telefone: linha.telefone ?? null,
    observacao: linha.observacao ?? null,
    status: linha.status as StatusEntrega,
    saiuParaEntregaEm: linha.saiu_para_entrega_em,
    entregueEm: linha.entregue_em,
    canceladoEm: linha.cancelado_em,
    motivoCancelamento: linha.motivo_cancelamento,
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
  }
}

const COLUNAS = `
  id, pedido_id, cliente_nome, telefone, observacao, status,
  saiu_para_entrega_em, entregue_em, cancelado_em, motivo_cancelamento,
  criado_em, atualizado_em
`.trim()

export class PedidoEntregaRepository {
  constructor(private readonly obterConexao = obterConexaoBancoLocal) {}

  buscarPorPedidoId(pedidoId: string): PedidoEntrega | null {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT ${COLUNAS} FROM pedido_entrega WHERE pedido_id = ? LIMIT 1`,
    )
    consulta.bind([pedidoId])
    if (!consulta.step()) {
      consulta.free()
      return null
    }
    const linha = consulta.getAsObject() as unknown as LinhaPedidoEntregaSql
    consulta.free()
    return mapear(linha)
  }

  listarAbertos(statusFiltro?: StatusEntrega): PedidoEntrega[] {
    const conexao = this.obterConexao()
    const usarFiltroStatus = statusFiltro !== undefined

    const sql = usarFiltroStatus
      ? `SELECT ${COLUNAS} FROM pedido_entrega
         WHERE status = ?
           AND cancelado_em IS NULL
         ORDER BY criado_em ASC`
      : `SELECT ${COLUNAS} FROM pedido_entrega
         WHERE status NOT IN ('ENTREGUE', 'CANCELADA')
         ORDER BY criado_em ASC`

    const consulta = conexao.instancia.prepare(sql)
    if (usarFiltroStatus) consulta.bind([statusFiltro])

    const entregas: PedidoEntrega[] = []
    while (consulta.step()) {
      entregas.push(mapear(consulta.getAsObject() as unknown as LinhaPedidoEntregaSql))
    }
    consulta.free()
    return entregas
  }

  inserir(dados: {
    pedidoId: string
    clienteNome: string
    telefone?: string | null
    observacao?: string | null
  }): PedidoEntrega {
    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()
    const entrega: PedidoEntrega = {
      id: randomUUID(),
      pedidoId: dados.pedidoId,
      clienteNome: dados.clienteNome,
      telefone: dados.telefone?.trim() ? dados.telefone.trim() : null,
      observacao: dados.observacao?.trim() ? dados.observacao.trim() : null,
      status: 'AGUARDANDO_PREPARO',
      saiuParaEntregaEm: null,
      entregueEm: null,
      canceladoEm: null,
      motivoCancelamento: null,
      criadoEm: agora,
      atualizadoEm: agora,
    }

    conexao.instancia.run(
      `INSERT INTO pedido_entrega (
        id, pedido_id, cliente_nome, telefone, observacao, status,
        saiu_para_entrega_em, entregue_em, cancelado_em, motivo_cancelamento,
        criado_em, atualizado_em
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entrega.id,
        entrega.pedidoId,
        entrega.clienteNome,
        entrega.telefone,
        entrega.observacao,
        entrega.status,
        null,
        null,
        null,
        null,
        entrega.criadoEm,
        entrega.atualizadoEm,
      ],
    )

    persistirConexaoBanco(conexao)
    return entrega
  }

  atualizarDados(
    pedidoId: string,
    dados: {
      clienteNome?: string
      telefone?: string | null
      observacao?: string | null
    },
  ): PedidoEntrega {
    const existente = this.buscarPorPedidoId(pedidoId)
    if (!existente) throw new Error('Entrega nao encontrada.')

    const agora = agoraEmIsoUtc()
    const atualizado: PedidoEntrega = {
      ...existente,
      clienteNome: dados.clienteNome ?? existente.clienteNome,
      telefone:
        dados.telefone !== undefined
          ? dados.telefone?.trim()
            ? dados.telefone.trim()
            : null
          : existente.telefone,
      observacao:
        dados.observacao !== undefined
          ? dados.observacao?.trim()
            ? dados.observacao.trim()
            : null
          : existente.observacao,
      atualizadoEm: agora,
    }

    const conexao = this.obterConexao()
    conexao.instancia.run(
      `UPDATE pedido_entrega
       SET cliente_nome = ?, telefone = ?, observacao = ?, atualizado_em = ?
       WHERE pedido_id = ?`,
      [
        atualizado.clienteNome,
        atualizado.telefone,
        atualizado.observacao,
        agora,
        pedidoId,
      ],
    )

    persistirConexaoBanco(conexao)
    return atualizado
  }

  atualizarStatus(pedidoId: string, novoStatus: StatusEntrega, motivo?: string): PedidoEntrega {
    const existente = this.buscarPorPedidoId(pedidoId)
    if (!existente) throw new Error('Entrega nao encontrada.')

    const agora = agoraEmIsoUtc()
    const conexao = this.obterConexao()

    const saiuParaEntregaEm =
      novoStatus === 'SAIU_PARA_ENTREGA' ? agora : existente.saiuParaEntregaEm
    const entregueEm = novoStatus === 'ENTREGUE' ? agora : existente.entregueEm
    const canceladoEm = novoStatus === 'CANCELADA' ? agora : existente.canceladoEm
    const motivoCancelamento =
      novoStatus === 'CANCELADA' ? (motivo ?? null) : existente.motivoCancelamento

    conexao.instancia.run(
      `UPDATE pedido_entrega
       SET status = ?, saiu_para_entrega_em = ?, entregue_em = ?,
           cancelado_em = ?, motivo_cancelamento = ?, atualizado_em = ?
       WHERE pedido_id = ?`,
      [
        novoStatus,
        saiuParaEntregaEm,
        entregueEm,
        canceladoEm,
        motivoCancelamento,
        agora,
        pedidoId,
      ],
    )

    persistirConexaoBanco(conexao)

    return {
      ...existente,
      status: novoStatus,
      saiuParaEntregaEm,
      entregueEm,
      canceladoEm,
      motivoCancelamento,
      atualizadoEm: agora,
    }
  }
}

export function criarPedidoEntregaRepository(conexao?: ConexaoSqlite): PedidoEntregaRepository {
  return conexao
    ? new PedidoEntregaRepository(() => conexao)
    : new PedidoEntregaRepository()
}
