import { prepararBancoTeste } from './banco-teste'
import { criarAbrirSessaoCaixa } from '../../src/main/modules/caixa/use-cases/abrir-sessao-caixa'

export async function prepararCaixaAbertoTeste(saldoInicialCentavos = 30000) {
  const banco = await prepararBancoTeste()
  const abrirSessaoCaixa = criarAbrirSessaoCaixa()

  const sessao = abrirSessaoCaixa({
    operadorId: 'local',
    operadorNome: 'Operador Local',
    saldoInicialCentavos,
  })

  return {
    ...banco,
    sessao,
  }
}
