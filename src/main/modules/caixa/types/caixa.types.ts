export { STATUS_SESSAO_CAIXA } from '@shared/types/sessao-caixa'
export type {
  AbrirSessaoCaixaEntrada,
  SessaoCaixa,
  StatusSessaoCaixa,
} from '@shared/types/sessao-caixa'

interface LinhaSessaoCaixaSql {
  id: string
  operador_id: string
  operador_nome: string
  saldo_inicial_centavos: number
  status: string
  aberto_em: string
  fechado_em: string | null
  criado_em: string
  atualizado_em: string
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
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
  }
}

export type { LinhaSessaoCaixaSql }
