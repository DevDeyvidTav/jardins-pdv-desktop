import { randomUUID } from 'node:crypto'
import { agoraEmIsoUtc, competenciaDeIsoUtc } from '@shared/utils/data-hora'
import type { FormaPagamento } from '@shared/types/pagamento-pedido'
import { FORMA_PAGAMENTO, totaisFormaPagamentoVazios } from '@shared/types/pagamento-pedido'
import type { LancamentoTalao, TalaoBaixa } from '@shared/types/talao'
import {
  resolverCamposTrocoDinheiro,
  SQL_VALOR_LIQUIDO_CAIXA,
} from '@shared/utils/troco-dinheiro'
import {
  persistirConexaoBanco,
  type ConexaoSqlite,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'

type LinhaBaixaSql = {
  id: string
  cliente_id: string
  sessao_caixa_id: string
  forma_pagamento: FormaPagamento
  valor_centavos: number
  valor_recebido_centavos: number | null
  troco_centavos: number
  competencia: string
  observacao: string | null
  criado_em: string
  atualizado_em: string
}

function mapearBaixa(linha: LinhaBaixaSql): TalaoBaixa {
  return {
    id: linha.id,
    clienteId: linha.cliente_id,
    sessaoCaixaId: linha.sessao_caixa_id,
    formaPagamento: linha.forma_pagamento,
    valorCentavos: Number(linha.valor_centavos) || 0,
    valorRecebidoCentavos:
      linha.valor_recebido_centavos == null ? null : Number(linha.valor_recebido_centavos),
    trocoCentavos: Number(linha.troco_centavos) || 0,
    competencia: linha.competencia,
    observacao: linha.observacao,
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
  }
}

export class TalaoRepository {
  constructor(private readonly obterConexao = obterConexaoBancoLocal) {}

  /** Competencia null consolida todos os meses. */
  listarLancamentos(clienteId: string, competencia: string | null): LancamentoTalao[] {
    const consulta = this.obterConexao().instancia.prepare(
      `SELECT
         pg.id AS pagamento_id,
         p.id AS pedido_id,
         p.referencia AS pedido_referencia,
         p.tipo AS tipo_pedido,
         pg.valor_centavos,
         pg.criado_em
       FROM pagamento_pedido pg
       INNER JOIN pedido p ON p.id = pg.pedido_id
       WHERE p.cliente_id = ?
         AND pg.forma_pagamento = ?
         AND pg.status = 'CONFIRMADO'
         AND pg.cancelado_em IS NULL
         ${competencia ? 'AND substr(pg.criado_em, 1, 7) = ?' : ''}
       ORDER BY pg.criado_em ASC`,
    )
    consulta.bind(
      competencia
        ? [clienteId, FORMA_PAGAMENTO.TALAO, competencia]
        : [clienteId, FORMA_PAGAMENTO.TALAO],
    )

    const itens: LancamentoTalao[] = []
    while (consulta.step()) {
      const linha = consulta.getAsObject() as {
        pagamento_id: string
        pedido_id: string
        pedido_referencia: number
        tipo_pedido: string
        valor_centavos: number
        criado_em: string
      }
      itens.push({
        pagamentoId: linha.pagamento_id,
        pedidoId: linha.pedido_id,
        pedidoReferencia: Number(linha.pedido_referencia) || 0,
        tipoPedido: linha.tipo_pedido,
        valorCentavos: Number(linha.valor_centavos) || 0,
        competencia: competenciaDeIsoUtc(linha.criado_em),
        criadoEm: linha.criado_em,
      })
    }
    consulta.free()
    return itens
  }

  /** Competencia null consolida todos os meses. */
  somarLancamentos(clienteId: string, competencia: string | null): number {
    const consulta = this.obterConexao().instancia.prepare(
      `SELECT COALESCE(SUM(pg.valor_centavos), 0) AS total
       FROM pagamento_pedido pg
       INNER JOIN pedido p ON p.id = pg.pedido_id
       WHERE p.cliente_id = ?
         AND pg.forma_pagamento = ?
         AND pg.status = 'CONFIRMADO'
         AND pg.cancelado_em IS NULL
         ${competencia ? 'AND substr(pg.criado_em, 1, 7) = ?' : ''}`,
    )
    consulta.bind(
      competencia
        ? [clienteId, FORMA_PAGAMENTO.TALAO, competencia]
        : [clienteId, FORMA_PAGAMENTO.TALAO],
    )
    consulta.step()
    const total = Number((consulta.getAsObject() as { total: number }).total ?? 0)
    consulta.free()
    return total
  }

  /** Competencia null consolida todos os meses. */
  listarBaixas(clienteId: string, competencia: string | null): TalaoBaixa[] {
    const consulta = this.obterConexao().instancia.prepare(
      `SELECT id, cliente_id, sessao_caixa_id, forma_pagamento, valor_centavos,
              valor_recebido_centavos, troco_centavos,
              competencia, observacao, criado_em, atualizado_em
       FROM talao_baixa
       WHERE cliente_id = ? ${competencia ? 'AND competencia = ?' : ''}
       ORDER BY criado_em ASC`,
    )
    consulta.bind(competencia ? [clienteId, competencia] : [clienteId])
    const itens: TalaoBaixa[] = []
    while (consulta.step()) {
      itens.push(mapearBaixa(consulta.getAsObject() as LinhaBaixaSql))
    }
    consulta.free()
    return itens
  }

  /** Competencia null consolida todos os meses. */
  somarBaixas(clienteId: string, competencia: string | null): number {
    const consulta = this.obterConexao().instancia.prepare(
      `SELECT COALESCE(SUM(valor_centavos), 0) AS total
       FROM talao_baixa
       WHERE cliente_id = ? ${competencia ? 'AND competencia = ?' : ''}`,
    )
    consulta.bind(competencia ? [clienteId, competencia] : [clienteId])
    consulta.step()
    const total = Number((consulta.getAsObject() as { total: number }).total ?? 0)
    consulta.free()
    return total
  }

  listarClienteIdsComMovimento(competencia: string): string[] {
    const consulta = this.obterConexao().instancia.prepare(
      `SELECT cliente_id FROM (
         SELECT p.cliente_id AS cliente_id
         FROM pagamento_pedido pg
         INNER JOIN pedido p ON p.id = pg.pedido_id
         WHERE p.cliente_id IS NOT NULL
           AND pg.forma_pagamento = ?
           AND pg.status = 'CONFIRMADO'
           AND pg.cancelado_em IS NULL
           AND substr(pg.criado_em, 1, 7) = ?
         UNION
         SELECT cliente_id FROM talao_baixa WHERE competencia = ?
       )`,
    )
    consulta.bind([FORMA_PAGAMENTO.TALAO, competencia, competencia])
    const ids: string[] = []
    while (consulta.step()) {
      ids.push((consulta.getAsObject() as { cliente_id: string }).cliente_id)
    }
    consulta.free()
    return ids
  }

  inserirBaixa(dados: {
    clienteId: string
    sessaoCaixaId: string
    formaPagamento: FormaPagamento
    valorCentavos: number
    valorRecebidoCentavos?: number | null
    competencia: string
    observacao?: string | null
  }): TalaoBaixa {
    const agora = agoraEmIsoUtc()
    const troco = resolverCamposTrocoDinheiro({
      formaPagamento: dados.formaPagamento,
      valorCentavos: dados.valorCentavos,
      valorRecebidoCentavos: dados.valorRecebidoCentavos,
    })
    const registro: TalaoBaixa = {
      id: randomUUID(),
      clienteId: dados.clienteId,
      sessaoCaixaId: dados.sessaoCaixaId,
      formaPagamento: dados.formaPagamento,
      valorCentavos: dados.valorCentavos,
      valorRecebidoCentavos: troco.valorRecebidoCentavos,
      trocoCentavos: troco.trocoCentavos,
      competencia: dados.competencia,
      observacao: dados.observacao ?? null,
      criadoEm: agora,
      atualizadoEm: agora,
    }

    this.obterConexao().instancia.run(
      `INSERT INTO talao_baixa (
         id, cliente_id, sessao_caixa_id, forma_pagamento, valor_centavos,
         valor_recebido_centavos, troco_centavos,
         competencia, observacao, criado_em, atualizado_em
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        registro.id,
        registro.clienteId,
        registro.sessaoCaixaId,
        registro.formaPagamento,
        registro.valorCentavos,
        registro.valorRecebidoCentavos,
        registro.trocoCentavos,
        registro.competencia,
        registro.observacao,
        registro.criadoEm,
        registro.atualizadoEm,
      ],
    )
    persistirConexaoBanco(this.obterConexao())
    return registro
  }

  calcularTotaisBaixasPorSessao(sessaoCaixaId: string): Record<FormaPagamento, number> {
    const totais = totaisFormaPagamentoVazios()
    const consulta = this.obterConexao().instancia.prepare(
      `SELECT forma_pagamento, COALESCE(SUM(${SQL_VALOR_LIQUIDO_CAIXA}), 0) AS total
       FROM talao_baixa
       WHERE sessao_caixa_id = ?
       GROUP BY forma_pagamento`,
    )
    consulta.bind([sessaoCaixaId])
    while (consulta.step()) {
      const linha = consulta.getAsObject() as {
        forma_pagamento: FormaPagamento
        total: number
      }
      totais[linha.forma_pagamento] = Number(linha.total) || 0
    }
    consulta.free()
    return totais
  }

  listarTodasBaixas(): TalaoBaixa[] {
    const consulta = this.obterConexao().instancia.prepare(
      `SELECT id, cliente_id, sessao_caixa_id, forma_pagamento, valor_centavos,
              valor_recebido_centavos, troco_centavos,
              competencia, observacao, criado_em, atualizado_em
       FROM talao_baixa
       ORDER BY criado_em ASC`,
    )
    const baixas: TalaoBaixa[] = []
    while (consulta.step()) {
      baixas.push(mapearBaixa(consulta.getAsObject() as LinhaBaixaSql))
    }
    consulta.free()
    return baixas
  }
}

export function criarTalaoRepository(conexao?: ConexaoSqlite): TalaoRepository {
  return conexao ? new TalaoRepository(() => conexao) : new TalaoRepository()
}
