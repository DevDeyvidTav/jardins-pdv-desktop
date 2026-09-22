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
import {
  criarPedidoRepository,
  type PedidoRepository,
} from '../../pedidos/repositories/pedido.repository'
import {
  criarTalaoRepository,
  type TalaoRepository,
} from '../../clientes/repositories/talao.repository'

export function criarObterResumoCaixaAtual(
  repositorioSessao: SessaoCaixaRepository = criarSessaoCaixaRepository(),
  repositorioMovimento: MovimentoCaixaRepository = criarMovimentoCaixaRepository(),
  repositorioPagamento: PagamentoPedidoRepository = criarPagamentoPedidoRepository(),
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioTalao: TalaoRepository = criarTalaoRepository(),
) {
  return function obterResumoCaixaAtual(): ResumoCaixaAtual | null {
    const sessaoAberta = repositorioSessao.buscarSessaoAberta()

    if (!sessaoAberta) {
      return null
    }

    const totais = repositorioMovimento.calcularTotaisPorSessao(sessaoAberta.id)
    const vendas = repositorioPagamento.calcularTotaisPorSessao(sessaoAberta.id)
    const baixas = repositorioTalao.calcularTotaisBaixasPorSessao(sessaoAberta.id)
    const quantidadePedidosAbertos = repositorioPedido.contarPedidosAbertos(
      sessaoAberta.id,
    )

    const totalVendasDinheiroCentavos =
      (vendas.DINHEIRO ?? 0) + (baixas.DINHEIRO ?? 0)
    const totalVendasCartaoCreditoCentavos =
      (vendas.CARTAO_CREDITO ?? 0) + (baixas.CARTAO_CREDITO ?? 0)
    const totalVendasCartaoDebitoCentavos =
      (vendas.CARTAO_DEBITO ?? 0) + (baixas.CARTAO_DEBITO ?? 0)
    const totalVendasPixMaquinetaCentavos =
      (vendas.PIX_MAQUINETA ?? 0) + (baixas.PIX_MAQUINETA ?? 0)
    const totalVendasPixCnpjCentavos =
      (vendas.PIX_CNPJ ?? 0) + (baixas.PIX_CNPJ ?? 0)
    const totalVendasPixCentavos =
      totalVendasPixMaquinetaCentavos + totalVendasPixCnpjCentavos
    const totalVendasTalaoCentavos = vendas.TALAO ?? 0
    const totalRecebimentoTalaoCentavos = Object.values(baixas).reduce(
      (acc, valor) => acc + valor,
      0,
    )

    const saldoAtualEsperadoCentavos = calcularSaldoEsperadoCentavos(
      sessaoAberta.saldoInicialCentavos,
      {
        ...totais,
        totalSuprimentosCentavos:
          totais.totalSuprimentosCentavos + totalVendasDinheiroCentavos,
      },
    )

    return {
      sessao: sessaoAberta,
      saldoInicialCentavos: sessaoAberta.saldoInicialCentavos,
      totalSuprimentosCentavos: totais.totalSuprimentosCentavos,
      totalRetiradasCentavos: totais.totalRetiradasCentavos,
      totalVendasDinheiroCentavos,
      totalVendasCartaoCreditoCentavos,
      totalVendasCartaoDebitoCentavos,
      totalVendasPixCentavos,
      totalVendasPixMaquinetaCentavos,
      totalVendasPixCnpjCentavos,
      totalVendasTalaoCentavos,
      totalRecebimentoTalaoCentavos,
      totalVendasCentavos:
        totalVendasDinheiroCentavos +
        totalVendasCartaoCreditoCentavos +
        totalVendasCartaoDebitoCentavos +
        totalVendasPixCentavos,
      saldoAtualEsperadoCentavos,
      quantidadePedidosAbertos,
    }
  }
}

export const obterResumoCaixaAtual = criarObterResumoCaixaAtual()
