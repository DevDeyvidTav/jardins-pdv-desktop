import { randomUUID } from 'node:crypto'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import {
  STATUS_PAGAMENTO_PEDIDO,
  totaisFormaPagamentoVazios,
  type PagamentoInformado,
  type PagamentoPedido,
} from '@shared/types/pagamento-pedido'
import {
  resolverCamposTrocoDinheiro,
  SQL_VALOR_LIQUIDO_CAIXA,
} from '@shared/utils/troco-dinheiro'
import {
  persistirConexaoBanco,
  type ConexaoSqlite,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'

type LinhaPagamentoPedido = {
  id: string
  pedido_id: string
  sessao_caixa_id: string
  forma_pagamento: PagamentoPedido['formaPagamento']
  valor_centavos: number
  valor_recebido_centavos: number | null
  troco_centavos: number
  status: PagamentoPedido['status']
  motivo_cortesia: string | null
  pedido_divisao_parte_id: string | null
  criado_em: string
  atualizado_em: string
  cancelado_em: string | null
}

const COLUNAS_PAGAMENTO = `id, pedido_id, sessao_caixa_id, forma_pagamento, valor_centavos,
              valor_recebido_centavos, troco_centavos, status,
              motivo_cortesia, pedido_divisao_parte_id, criado_em, atualizado_em, cancelado_em`

function mapear(linha: LinhaPagamentoPedido): PagamentoPedido {
  return {
    id: linha.id,
    pedidoId: linha.pedido_id,
    sessaoCaixaId: linha.sessao_caixa_id,
    formaPagamento: linha.forma_pagamento,
    valorCentavos: linha.valor_centavos,
    valorRecebidoCentavos:
      linha.valor_recebido_centavos == null ? null : Number(linha.valor_recebido_centavos),
    trocoCentavos: Number(linha.troco_centavos) || 0,
    status: linha.status,
    motivoCortesia: linha.motivo_cortesia,
    pedidoDivisaoParteId: linha.pedido_divisao_parte_id ?? null,
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
    canceladoEm: linha.cancelado_em,
  }
}

export class PagamentoPedidoRepository {
  constructor(private readonly obterConexao = obterConexaoBancoLocal) {}

  listarPorPedido(pedidoId: string): PagamentoPedido[] {
    const consulta = this.obterConexao().instancia.prepare(
      `SELECT ${COLUNAS_PAGAMENTO}
       FROM pagamento_pedido
       WHERE pedido_id = ?
       ORDER BY criado_em ASC`,
    )
    consulta.bind([pedidoId])
    const pagamentos: PagamentoPedido[] = []
    while (consulta.step()) pagamentos.push(mapear(consulta.getAsObject() as LinhaPagamentoPedido))
    consulta.free()
    return pagamentos
  }

  inserir(
    pedidoId: string,
    sessaoCaixaId: string,
    pagamento: PagamentoInformado,
    persistir = true,
    pedidoDivisaoParteId: string | null = null,
  ): PagamentoPedido {
    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()
    const troco = resolverCamposTrocoDinheiro({
      formaPagamento: pagamento.formaPagamento,
      valorCentavos: pagamento.valorCentavos,
      valorRecebidoCentavos: pagamento.valorRecebidoCentavos,
    })
    const registro: PagamentoPedido = {
      id: randomUUID(),
      pedidoId,
      sessaoCaixaId,
      formaPagamento: pagamento.formaPagamento,
      valorCentavos: pagamento.valorCentavos,
      valorRecebidoCentavos: troco.valorRecebidoCentavos,
      trocoCentavos: troco.trocoCentavos,
      status: STATUS_PAGAMENTO_PEDIDO.CONFIRMADO,
      motivoCortesia: pagamento.motivoCortesia ?? null,
      pedidoDivisaoParteId,
      criadoEm: agora,
      atualizadoEm: agora,
      canceladoEm: null,
    }

    conexao.instancia.run(
      `INSERT INTO pagamento_pedido (
        id, pedido_id, sessao_caixa_id, forma_pagamento, valor_centavos,
        valor_recebido_centavos, troco_centavos, status,
        motivo_cortesia, pedido_divisao_parte_id, criado_em, atualizado_em, cancelado_em
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        registro.id,
        registro.pedidoId,
        registro.sessaoCaixaId,
        registro.formaPagamento,
        registro.valorCentavos,
        registro.valorRecebidoCentavos,
        registro.trocoCentavos,
        registro.status,
        registro.motivoCortesia ?? null,
        registro.pedidoDivisaoParteId,
        registro.criadoEm,
        registro.atualizadoEm,
        registro.canceladoEm,
      ],
    )

    if (persistir) persistirConexaoBanco(conexao)
    return registro
  }

  calcularTotaisPorSessao(sessaoCaixaId: string): Record<PagamentoPedido['formaPagamento'], number> {
    const totais = totaisFormaPagamentoVazios()
    const consulta = this.obterConexao().instancia.prepare(
      `SELECT forma_pagamento, COALESCE(SUM(${SQL_VALOR_LIQUIDO_CAIXA}), 0) AS total
       FROM pagamento_pedido
       WHERE sessao_caixa_id = ? AND status = 'CONFIRMADO' AND cancelado_em IS NULL
       GROUP BY forma_pagamento`,
    )
    consulta.bind([sessaoCaixaId])
    while (consulta.step()) {
      const linha = consulta.getAsObject() as { forma_pagamento: PagamentoPedido['formaPagamento']; total: number }
      totais[linha.forma_pagamento] =
        (totais[linha.forma_pagamento] ?? 0) + Number(linha.total)
    }
    consulta.free()
    return totais
  }
}

export function criarPagamentoPedidoRepository(conexao?: ConexaoSqlite): PagamentoPedidoRepository {
  return new PagamentoPedidoRepository(conexao ? () => conexao : undefined)
}
