import type { ConexaoSqlite } from '../../../database/conexao-sqlite'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import {
  STATUS_AGRUPAMENTO_MESA,
  STATUS_MESA,
  TIPO_MOVIMENTACAO_MESA,
  type Mesa,
  type MesaAgrupada,
  type MesaAgrupamento,
  type PedidoMesaMovimentacao,
  type TipoMovimentacaoMesa,
} from '@shared/types/mesa'
import { randomUUID } from 'node:crypto'

export function snapshotMesa(mesa: Mesa) {
  return {
    id: mesa.id,
    numero: mesa.numero,
    status: mesa.status,
    ativo: mesa.ativo,
  }
}

export function atualizarStatusMesaNaConexao(
  conexao: ConexaoSqlite,
  mesaId: string,
  status: Mesa['status'],
  atualizadoEm = agoraEmIsoUtc(),
): void {
  conexao.instancia.run(
    `UPDATE mesa SET status = ?, atualizado_em = ? WHERE id = ?`,
    [status, atualizadoEm, mesaId],
  )
}

export function atualizarPedidoMesaNaConexao(
  conexao: ConexaoSqlite,
  pedidoId: string,
  dados: {
    mesaId?: string | null
    mesaAgrupamentoId?: string | null
  },
  atualizadoEm = agoraEmIsoUtc(),
): void {
  const sets: string[] = ['atualizado_em = ?']
  const params: (string | null)[] = [atualizadoEm]

  if (dados.mesaId !== undefined) {
    sets.push('mesa_id = ?')
    params.push(dados.mesaId)
  }

  if (dados.mesaAgrupamentoId !== undefined) {
    sets.push('mesa_agrupamento_id = ?')
    params.push(dados.mesaAgrupamentoId)
  }

  params.push(pedidoId)

  conexao.instancia.run(
    `UPDATE pedido SET ${sets.join(', ')} WHERE id = ?`,
    params,
  )
}

export function inserirMovimentacaoNaConexao(
  conexao: ConexaoSqlite,
  dados: {
    pedidoId: string
    tipo: TipoMovimentacaoMesa
    mesaOrigemId?: string | null
    mesaDestinoId?: string | null
    mesaAgrupamentoId?: string | null
    dadosAntes: unknown
    dadosDepois: unknown
    motivo?: string | null
    operadorId?: string | null
    criadoEm?: string
  },
): PedidoMesaMovimentacao {
  const agora = dados.criadoEm ?? agoraEmIsoUtc()
  const registro: PedidoMesaMovimentacao = {
    id: randomUUID(),
    pedidoId: dados.pedidoId,
    tipo: dados.tipo,
    mesaOrigemId: dados.mesaOrigemId ?? null,
    mesaDestinoId: dados.mesaDestinoId ?? null,
    mesaAgrupamentoId: dados.mesaAgrupamentoId ?? null,
    dadosAntesJson: JSON.stringify(dados.dadosAntes),
    dadosDepoisJson: JSON.stringify(dados.dadosDepois),
    motivo: dados.motivo ?? null,
    operadorId: dados.operadorId ?? null,
    criadoEm: agora,
  }

  conexao.instancia.run(
    `INSERT INTO pedido_mesa_movimentacao (
       id, pedido_id, tipo, mesa_origem_id, mesa_destino_id, mesa_agrupamento_id,
       dados_antes_json, dados_depois_json, motivo, operador_id, criado_em
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      registro.id,
      registro.pedidoId,
      registro.tipo,
      registro.mesaOrigemId,
      registro.mesaDestinoId,
      registro.mesaAgrupamentoId,
      registro.dadosAntesJson,
      registro.dadosDepoisJson,
      registro.motivo,
      registro.operadorId,
      registro.criadoEm,
    ],
  )

  return registro
}

export function mesaPertenceAAgrupamentoAtivo(
  conexao: ConexaoSqlite,
  mesaId: string,
): boolean {
  const consulta = conexao.instancia.prepare(
    `SELECT 1
     FROM mesa_agrupada ma
     INNER JOIN mesa_agrupamento ag ON ag.id = ma.mesa_agrupamento_id
     WHERE ma.mesa_id = ?
       AND ma.removida_em IS NULL
       AND ag.status = ?
     LIMIT 1`,
  )
  consulta.bind([mesaId, STATUS_AGRUPAMENTO_MESA.ATIVO])
  const existe = consulta.step()
  consulta.free()
  return existe
}

export function buscarAgrupamentoAtivoPorPedido(
  conexao: ConexaoSqlite,
  pedidoId: string,
): MesaAgrupamento | null {
  const consulta = conexao.instancia.prepare(
    `SELECT id, pedido_id, mesa_principal_id, status, criado_em, encerrado_em, motivo_encerramento
     FROM mesa_agrupamento
     WHERE pedido_id = ? AND status = ?
     LIMIT 1`,
  )
  consulta.bind([pedidoId, STATUS_AGRUPAMENTO_MESA.ATIVO])

  if (!consulta.step()) {
    consulta.free()
    return null
  }

  const linha = consulta.getAsObject() as {
    id: string
    pedido_id: string
    mesa_principal_id: string
    status: string
    criado_em: string
    encerrado_em: string | null
    motivo_encerramento: string | null
  }
  consulta.free()

  return {
    id: linha.id,
    pedidoId: linha.pedido_id,
    mesaPrincipalId: linha.mesa_principal_id,
    status: linha.status as MesaAgrupamento['status'],
    criadoEm: linha.criado_em,
    encerradoEm: linha.encerrado_em,
    motivoEncerramento: linha.motivo_encerramento,
  }
}

export function listarMesasAgrupadasAtivas(
  conexao: ConexaoSqlite,
  agrupamentoId: string,
): MesaAgrupada[] {
  const consulta = conexao.instancia.prepare(
    `SELECT id, mesa_agrupamento_id, mesa_id, eh_principal, adicionada_em, removida_em
     FROM mesa_agrupada
     WHERE mesa_agrupamento_id = ?
       AND removida_em IS NULL
     ORDER BY eh_principal DESC, adicionada_em ASC`,
  )
  consulta.bind([agrupamentoId])

  const itens: MesaAgrupada[] = []
  while (consulta.step()) {
    const linha = consulta.getAsObject() as {
      id: string
      mesa_agrupamento_id: string
      mesa_id: string
      eh_principal: number
      adicionada_em: string
      removida_em: string | null
    }
    itens.push({
      id: linha.id,
      mesaAgrupamentoId: linha.mesa_agrupamento_id,
      mesaId: linha.mesa_id,
      ehPrincipal: Number(linha.eh_principal) === 1,
      adicionadaEm: linha.adicionada_em,
      removidaEm: linha.removida_em,
    })
  }
  consulta.free()
  return itens
}

/**
 * Encerra agrupamento ativo do pedido dentro da transacao atual.
 * - ENCERRAMENTO_MANUAL: libera apenas mesas secundarias; principal permanece OCUPADA.
 * - PEDIDO_FINALIZADO / PEDIDO_CANCELADO: libera todas as mesas.
 */
export function encerrarAgrupamentoAtivoNaConexao(
  conexao: ConexaoSqlite,
  dados: {
    pedidoId: string
    motivo: string
    observacao?: string | null
    liberarMesaPrincipal: boolean
    operadorId?: string | null
  },
): MesaAgrupamento | null {
  const agrupamento = buscarAgrupamentoAtivoPorPedido(conexao, dados.pedidoId)
  if (!agrupamento) {
    return null
  }

  const agora = agoraEmIsoUtc()
  const vinculos = listarMesasAgrupadasAtivas(conexao, agrupamento.id)
  const antes = {
    pedidoId: dados.pedidoId,
    agrupamentoId: agrupamento.id,
    status: agrupamento.status,
    mesas: vinculos.map((v) => ({
      mesaId: v.mesaId,
      ehPrincipal: v.ehPrincipal,
    })),
  }

  for (const vinculo of vinculos) {
    conexao.instancia.run(
      `UPDATE mesa_agrupada SET removida_em = ? WHERE id = ?`,
      [agora, vinculo.id],
    )

    const deveLiberar =
      dados.liberarMesaPrincipal || !vinculo.ehPrincipal

    if (deveLiberar) {
      atualizarStatusMesaNaConexao(
        conexao,
        vinculo.mesaId,
        STATUS_MESA.LIVRE,
        agora,
      )
    }
  }

  conexao.instancia.run(
    `UPDATE mesa_agrupamento
     SET status = ?, encerrado_em = ?, motivo_encerramento = ?
     WHERE id = ?`,
    [
      STATUS_AGRUPAMENTO_MESA.ENCERRADO,
      agora,
      dados.motivo,
      agrupamento.id,
    ],
  )

  atualizarPedidoMesaNaConexao(
    conexao,
    dados.pedidoId,
    { mesaAgrupamentoId: null },
    agora,
  )

  const depois = {
    pedidoId: dados.pedidoId,
    agrupamentoId: agrupamento.id,
    status: STATUS_AGRUPAMENTO_MESA.ENCERRADO,
    motivo: dados.motivo,
    liberarMesaPrincipal: dados.liberarMesaPrincipal,
  }

  inserirMovimentacaoNaConexao(conexao, {
    pedidoId: dados.pedidoId,
    tipo: TIPO_MOVIMENTACAO_MESA.AGRUPAMENTO_ENCERRADO,
    mesaAgrupamentoId: agrupamento.id,
    mesaOrigemId: agrupamento.mesaPrincipalId,
    dadosAntes: antes,
    dadosDepois: depois,
    motivo: dados.observacao ?? dados.motivo,
    operadorId: dados.operadorId,
    criadoEm: agora,
  })

  return {
    ...agrupamento,
    status: STATUS_AGRUPAMENTO_MESA.ENCERRADO,
    encerradoEm: agora,
    motivoEncerramento: dados.motivo,
  }
}
