import { randomUUID } from 'node:crypto'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import {
  STATUS_PAGAMENTO_PEDIDO,
  type PagamentoInformado,
  type PagamentoPedido,
} from '@shared/types/pagamento-pedido'
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
  status: PagamentoPedido['status']
  motivo_cortesia: string | null
  criado_em: string
  atualizado_em: string
  cancelado_em: string | null
}

function mapear(linha: LinhaPagamentoPedido): PagamentoPedido {
  return {
    id: linha.id,
    pedidoId: linha.pedido_id,
    sessaoCaixaId: linha.sessao_caixa_id,
    formaPagamento: linha.forma_pagamento,
    valorCentavos: linha.valor_centavos,
    status: linha.status,
    motivoCortesia: linha.motivo_cortesia,
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
    canceladoEm: linha.cancelado_em,
  }
}

export class PagamentoPedidoRepository {
  constructor(private readonly obterConexao = obterConexaoBancoLocal) {}

  listarPorPedido(pedidoId: string): PagamentoPedido[] {
    const consulta = this.obterConexao().instancia.prepare(
      `SELECT id, pedido_id, sessao_caixa_id, forma_pagamento, valor_centavos, status,
              motivo_cortesia, criado_em, atualizado_em, cancelado_em
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
  ): PagamentoPedido {
    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()
    const registro: PagamentoPedido = {
      id: randomUUID(),
      pedidoId,
      sessaoCaixaId,
      formaPagamento: pagamento.formaPagamento,
      valorCentavos: pagamento.valorCentavos,
      status: STATUS_PAGAMENTO_PEDIDO.CONFIRMADO,
      motivoCortesia: pagamento.motivoCortesia ?? null,
      criadoEm: agora,
      atualizadoEm: agora,
      canceladoEm: null,
    }

    conexao.instancia.run(
      `INSERT INTO pagamento_pedido (
        id, pedido_id, sessao_caixa_id, forma_pagamento, valor_centavos, status,
        motivo_cortesia, criado_em, atualizado_em, cancelado_em
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        registro.id,
        registro.pedidoId,
        registro.sessaoCaixaId,
        registro.formaPagamento,
        registro.valorCentavos,
        registro.status,
        registro.motivoCortesia,
        registro.criadoEm,
        registro.atualizadoEm,
        registro.canceladoEm,
      ],
    )

    if (persistir) persistirConexaoBanco(conexao)
    return registro
  }

  calcularTotaisPorSessao(sessaoCaixaId: string): Record<PagamentoPedido['formaPagamento'], number> {
    const totais = {
      DINHEIRO: 0,
      CARTAO_CREDITO: 0,
      CARTAO_DEBITO: 0,
      PIX: 0,
      CORTESIA: 0,
    }
    const consulta = this.obterConexao().instancia.prepare(
      `SELECT forma_pagamento, COALESCE(SUM(valor_centavos), 0) AS total
       FROM pagamento_pedido
       WHERE sessao_caixa_id = ? AND status = 'CONFIRMADO' AND cancelado_em IS NULL
       GROUP BY forma_pagamento`,
    )
    consulta.bind([sessaoCaixaId])
    while (consulta.step()) {
      const linha = consulta.getAsObject() as { forma_pagamento: PagamentoPedido['formaPagamento']; total: number }
      totais[linha.forma_pagamento] = linha.total
    }
    consulta.free()
    return totais
  }
}

export function criarPagamentoPedidoRepository(conexao?: ConexaoSqlite): PagamentoPedidoRepository {
  return new PagamentoPedidoRepository(conexao ? () => conexao : undefined)
}
