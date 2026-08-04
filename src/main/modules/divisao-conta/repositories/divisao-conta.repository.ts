import { randomUUID } from 'node:crypto'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import {
  STATUS_DIVISAO_CONTA,
  STATUS_PARTE_DIVISAO,
  type PedidoDivisaoConta,
  type PedidoDivisaoMovimentacao,
  type PedidoDivisaoParte,
  type StatusDivisaoConta,
  type StatusParteDivisao,
  type TipoMovimentacaoDivisao,
} from '@shared/types/divisao-conta'
import {
  persistirConexaoBanco,
  type ConexaoSqlite,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'

export class PedidoDivisaoContaRepository {
  constructor(private readonly obterConexao = obterConexaoBancoLocal) {}

  buscarAtivaPorPedido(pedidoId: string): PedidoDivisaoConta | null {
    return this.buscarPorPedidoEStatus(pedidoId, STATUS_DIVISAO_CONTA.ATIVA)
  }

  buscarPorPedido(pedidoId: string): PedidoDivisaoConta | null {
    const consulta = this.obterConexao().instancia.prepare(
      `SELECT id, pedido_id, status, valor_total_centavos, criado_em, atualizado_em,
              cancelado_em, motivo_cancelamento
       FROM pedido_divisao_conta
       WHERE pedido_id = ?
       ORDER BY criado_em DESC
       LIMIT 1`,
    )
    consulta.bind([pedidoId])
    if (!consulta.step()) {
      consulta.free()
      return null
    }
    const linha = consulta.getAsObject() as Record<string, unknown>
    consulta.free()
    return this.mapear(linha)
  }

  private buscarPorPedidoEStatus(
    pedidoId: string,
    status: StatusDivisaoConta,
  ): PedidoDivisaoConta | null {
    const consulta = this.obterConexao().instancia.prepare(
      `SELECT id, pedido_id, status, valor_total_centavos, criado_em, atualizado_em,
              cancelado_em, motivo_cancelamento
       FROM pedido_divisao_conta
       WHERE pedido_id = ? AND status = ?
       LIMIT 1`,
    )
    consulta.bind([pedidoId, status])
    if (!consulta.step()) {
      consulta.free()
      return null
    }
    const linha = consulta.getAsObject() as Record<string, unknown>
    consulta.free()
    return this.mapear(linha)
  }

  inserir(dados: {
    pedidoId: string
    valorTotalCentavos: number
  }): PedidoDivisaoConta {
    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()
    const registro: PedidoDivisaoConta = {
      id: randomUUID(),
      pedidoId: dados.pedidoId,
      status: STATUS_DIVISAO_CONTA.ATIVA,
      valorTotalCentavos: dados.valorTotalCentavos,
      criadoEm: agora,
      atualizadoEm: agora,
      canceladoEm: null,
      motivoCancelamento: null,
    }

    conexao.instancia.run(
      `INSERT INTO pedido_divisao_conta (
         id, pedido_id, status, valor_total_centavos, criado_em, atualizado_em,
         cancelado_em, motivo_cancelamento
       ) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL)`,
      [
        registro.id,
        registro.pedidoId,
        registro.status,
        registro.valorTotalCentavos,
        registro.criadoEm,
        registro.atualizadoEm,
      ],
    )
    persistirConexaoBanco(conexao)
    return registro
  }

  atualizarStatus(
    divisaoId: string,
    status: StatusDivisaoConta,
    extras?: { canceladoEm?: string | null; motivoCancelamento?: string | null },
  ): void {
    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()
    conexao.instancia.run(
      `UPDATE pedido_divisao_conta
       SET status = ?, atualizado_em = ?, cancelado_em = COALESCE(?, cancelado_em),
           motivo_cancelamento = COALESCE(?, motivo_cancelamento)
       WHERE id = ?`,
      [
        status,
        agora,
        extras?.canceladoEm ?? null,
        extras?.motivoCancelamento ?? null,
        divisaoId,
      ],
    )
    persistirConexaoBanco(conexao)
  }

  private mapear(linha: Record<string, unknown>): PedidoDivisaoConta {
    return {
      id: String(linha.id),
      pedidoId: String(linha.pedido_id),
      status: linha.status as StatusDivisaoConta,
      valorTotalCentavos: Number(linha.valor_total_centavos) || 0,
      criadoEm: String(linha.criado_em),
      atualizadoEm: String(linha.atualizado_em),
      canceladoEm: (linha.cancelado_em as string | null) ?? null,
      motivoCancelamento: (linha.motivo_cancelamento as string | null) ?? null,
    }
  }
}

export class PedidoDivisaoParteRepository {
  constructor(private readonly obterConexao = obterConexaoBancoLocal) {}

  listarPorDivisao(divisaoId: string): PedidoDivisaoParte[] {
    const consulta = this.obterConexao().instancia.prepare(
      `SELECT id, pedido_divisao_conta_id, identificacao, valor_definido_centavos, status,
              criado_em, atualizado_em, quitado_em
       FROM pedido_divisao_parte
       WHERE pedido_divisao_conta_id = ?
       ORDER BY criado_em ASC`,
    )
    consulta.bind([divisaoId])
    const partes: PedidoDivisaoParte[] = []
    while (consulta.step()) {
      partes.push(this.mapear(consulta.getAsObject() as Record<string, unknown>))
    }
    consulta.free()
    return partes
  }

  buscarPorId(parteId: string): PedidoDivisaoParte | null {
    const consulta = this.obterConexao().instancia.prepare(
      `SELECT id, pedido_divisao_conta_id, identificacao, valor_definido_centavos, status,
              criado_em, atualizado_em, quitado_em
       FROM pedido_divisao_parte
       WHERE id = ?
       LIMIT 1`,
    )
    consulta.bind([parteId])
    if (!consulta.step()) {
      consulta.free()
      return null
    }
    const linha = consulta.getAsObject() as Record<string, unknown>
    consulta.free()
    return this.mapear(linha)
  }

  inserir(dados: {
    divisaoId: string
    identificacao: string
    valorDefinidoCentavos: number
  }): PedidoDivisaoParte {
    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()
    const registro: PedidoDivisaoParte = {
      id: randomUUID(),
      pedidoDivisaoContaId: dados.divisaoId,
      identificacao: dados.identificacao,
      valorDefinidoCentavos: dados.valorDefinidoCentavos,
      status: STATUS_PARTE_DIVISAO.PENDENTE,
      criadoEm: agora,
      atualizadoEm: agora,
      quitadoEm: null,
    }

    conexao.instancia.run(
      `INSERT INTO pedido_divisao_parte (
         id, pedido_divisao_conta_id, identificacao, valor_definido_centavos, status,
         criado_em, atualizado_em, quitado_em
       ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        registro.id,
        registro.pedidoDivisaoContaId,
        registro.identificacao,
        registro.valorDefinidoCentavos,
        registro.status,
        registro.criadoEm,
        registro.atualizadoEm,
      ],
    )
    persistirConexaoBanco(conexao)
    return registro
  }

  atualizarStatus(
    parteId: string,
    status: StatusParteDivisao,
    quitadoEm: string | null = null,
  ): void {
    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()
    conexao.instancia.run(
      `UPDATE pedido_divisao_parte
       SET status = ?, atualizado_em = ?, quitado_em = ?
       WHERE id = ?`,
      [status, agora, quitadoEm, parteId],
    )
    persistirConexaoBanco(conexao)
  }

  private mapear(linha: Record<string, unknown>): PedidoDivisaoParte {
    return {
      id: String(linha.id),
      pedidoDivisaoContaId: String(linha.pedido_divisao_conta_id),
      identificacao: String(linha.identificacao),
      valorDefinidoCentavos: Number(linha.valor_definido_centavos) || 0,
      status: linha.status as StatusParteDivisao,
      criadoEm: String(linha.criado_em),
      atualizadoEm: String(linha.atualizado_em),
      quitadoEm: (linha.quitado_em as string | null) ?? null,
    }
  }
}

export class PedidoDivisaoMovimentacaoRepository {
  constructor(private readonly obterConexao = obterConexaoBancoLocal) {}

  inserir(dados: {
    pedidoId: string
    divisaoId: string
    parteId?: string | null
    tipo: TipoMovimentacaoDivisao
    dadosAntes: unknown
    dadosDepois: unknown
    motivo?: string | null
    operadorId?: string | null
  }): PedidoDivisaoMovimentacao {
    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()
    const registro: PedidoDivisaoMovimentacao = {
      id: randomUUID(),
      pedidoId: dados.pedidoId,
      pedidoDivisaoContaId: dados.divisaoId,
      pedidoDivisaoParteId: dados.parteId ?? null,
      tipo: dados.tipo,
      dadosAntesJson: JSON.stringify(dados.dadosAntes),
      dadosDepoisJson: JSON.stringify(dados.dadosDepois),
      motivo: dados.motivo ?? null,
      operadorId: dados.operadorId ?? null,
      criadoEm: agora,
    }

    conexao.instancia.run(
      `INSERT INTO pedido_divisao_movimentacao (
         id, pedido_id, pedido_divisao_conta_id, pedido_divisao_parte_id, tipo,
         dados_antes_json, dados_depois_json, motivo, operador_id, criado_em
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        registro.id,
        registro.pedidoId,
        registro.pedidoDivisaoContaId,
        registro.pedidoDivisaoParteId,
        registro.tipo,
        registro.dadosAntesJson,
        registro.dadosDepoisJson,
        registro.motivo,
        registro.operadorId,
        registro.criadoEm,
      ],
    )
    persistirConexaoBanco(conexao)
    return registro
  }

  listarPorPedido(pedidoId: string): PedidoDivisaoMovimentacao[] {
    const consulta = this.obterConexao().instancia.prepare(
      `SELECT id, pedido_id, pedido_divisao_conta_id, pedido_divisao_parte_id, tipo,
              dados_antes_json, dados_depois_json, motivo, operador_id, criado_em
       FROM pedido_divisao_movimentacao
       WHERE pedido_id = ?
       ORDER BY criado_em ASC`,
    )
    consulta.bind([pedidoId])
    const itens: PedidoDivisaoMovimentacao[] = []
    while (consulta.step()) {
      const linha = consulta.getAsObject() as Record<string, unknown>
      itens.push({
        id: String(linha.id),
        pedidoId: String(linha.pedido_id),
        pedidoDivisaoContaId: String(linha.pedido_divisao_conta_id),
        pedidoDivisaoParteId: (linha.pedido_divisao_parte_id as string | null) ?? null,
        tipo: linha.tipo as TipoMovimentacaoDivisao,
        dadosAntesJson: String(linha.dados_antes_json),
        dadosDepoisJson: String(linha.dados_depois_json),
        motivo: (linha.motivo as string | null) ?? null,
        operadorId: (linha.operador_id as string | null) ?? null,
        criadoEm: String(linha.criado_em),
      })
    }
    consulta.free()
    return itens
  }
}

export function criarPedidoDivisaoContaRepository(conexao?: ConexaoSqlite) {
  return new PedidoDivisaoContaRepository(conexao ? () => conexao : undefined)
}

export function criarPedidoDivisaoParteRepository(conexao?: ConexaoSqlite) {
  return new PedidoDivisaoParteRepository(conexao ? () => conexao : undefined)
}

export function criarPedidoDivisaoMovimentacaoRepository(conexao?: ConexaoSqlite) {
  return new PedidoDivisaoMovimentacaoRepository(conexao ? () => conexao : undefined)
}
