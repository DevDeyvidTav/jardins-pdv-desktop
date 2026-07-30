import type { ResumoCaixaAtual } from '@shared/types/movimento-caixa'
import {
  criarMovimentoCaixaRepository,
  type MovimentoCaixaRepository,
} from '../repositories/movimento-caixa.repository'
import {
  criarSessaoCaixaRepository,
  type SessaoCaixaRepository,
} from '../repositories/sessao-caixa.repository'
import { calcularSaldoEsperadoCentavos } from '../types/fechamento-caixa.types'
import {
  criarPagamentoPedidoRepository,
  type PagamentoPedidoRepository,
} from '../../pagamentos/repositories/pagamento-pedido.repository'

export function criarObterResumoCaixaAtual(
  repositorioSessao: SessaoCaixaRepository = criarSessaoCaixaRepository(),
  repositorioMovimento: MovimentoCaixaRepository = criarMovimentoCaixaRepository(),
  repositorioPagamento: PagamentoPedidoRepository = criarPagamentoPedidoRepository(),
) {
  return function obterResumoCaixaAtual(): ResumoCaixaAtual | null {
    const sessaoAberta = repositorioSessao.buscarSessaoAberta()

    if (!sessaoAberta) {
      return null
    }

    const totais = repositorioMovimento.calcularTotaisPorSessao(sessaoAberta.id)
    const vendas = repositorioPagamento.calcularTotaisPorSessao(sessaoAberta.id)
    const saldoAtualEsperadoCentavos = calcularSaldoEsperadoCentavos(
      sessaoAberta.saldoInicialCentavos,
      {
        ...totais,
        totalSuprimentosCentavos:
          totais.totalSuprimentosCentavos + vendas.DINHEIRO,
      },
    )

    return {
      sessao: sessaoAberta,
      saldoInicialCentavos: sessaoAberta.saldoInicialCentavos,
      totalSuprimentosCentavos: totais.totalSuprimentosCentavos,
      totalSangriasCentavos: totais.totalSangriasCentavos,
      totalRetiradasCentavos: totais.totalRetiradasCentavos,
      totalVendasDinheiroCentavos: vendas.DINHEIRO,
      totalVendasCartaoCreditoCentavos: vendas.CARTAO_CREDITO,
      totalVendasCartaoDebitoCentavos: vendas.CARTAO_DEBITO,
      totalVendasPixCentavos: vendas.PIX,
      totalVendasCentavos:
        vendas.DINHEIRO + vendas.CARTAO_CREDITO + vendas.CARTAO_DEBITO + vendas.PIX,
      saldoAtualEsperadoCentavos,
    }
  }
}

export const obterResumoCaixaAtual = criarObterResumoCaixaAtual()
