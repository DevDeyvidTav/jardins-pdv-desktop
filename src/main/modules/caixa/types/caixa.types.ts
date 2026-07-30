export { STATUS_SESSAO_CAIXA } from '@shared/types/sessao-caixa'
export type {
  AbrirSessaoCaixaEntrada,
  FecharSessaoCaixaEntrada,
  SessaoCaixa,
  StatusSessaoCaixa,
} from '@shared/types/sessao-caixa'

export interface LinhaSessaoCaixaSql {
  id: string
  operador_id: string
  operador_nome: string
  saldo_inicial_centavos: number
  status: string
  aberto_em: string
  fechado_em: string | null
  saldo_final_informado_centavos: number | null
  saldo_final_esperado_centavos: number | null
  diferenca_centavos: number | null
  observacao_fechamento: string | null
  criado_em: string
  atualizado_em: string
}

const COLUNAS_SESSAO_CAIXA = `
  id, operador_id, operador_nome, saldo_inicial_centavos, status,
  aberto_em, fechado_em, saldo_final_informado_centavos,
  saldo_final_esperado_centavos, diferenca_centavos, observacao_fechamento,
  criado_em, atualizado_em
`.trim()

export function obterColunasSessaoCaixa(): string {
  return COLUNAS_SESSAO_CAIXA
}

export function mapearLinhaSessaoCaixa(
  linha: LinhaSessaoCaixaSql,
): import('@shared/types/sessao-caixa').SessaoCaixa {
  return {
    id: linha.id,
    operadorId: linha.operador_id,
    operadorNome: linha.operador_nome,
    saldoInicialCentavos: linha.saldo_inicial_centavos,
    status: linha.status as import('@shared/types/sessao-caixa').StatusSessaoCaixa,
    abertoEm: linha.aberto_em,
    fechadoEm: linha.fechado_em,
    saldoFinalInformadoCentavos: linha.saldo_final_informado_centavos,
    saldoFinalEsperadoCentavos: linha.saldo_final_esperado_centavos,
    diferencaCentavos: linha.diferenca_centavos,
    observacaoFechamento: linha.observacao_fechamento,
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
  }
}

export type { TipoMovimentoCaixa } from '@shared/types/movimento-caixa'
