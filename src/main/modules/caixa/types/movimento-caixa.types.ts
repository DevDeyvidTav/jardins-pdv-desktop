import type {
  MovimentoCaixa,
  OrigemMovimentoCaixa,
  TipoMovimentoCaixa,
} from '@shared/types/movimento-caixa'

export interface LinhaMovimentoCaixaSql {
  id: string
  sessao_caixa_id: string
  tipo: string
  valor_centavos: number
  descricao: string | null
  origem: string
  criado_em: string
  atualizado_em: string
}

export function mapearLinhaMovimentoCaixa(
  linha: LinhaMovimentoCaixaSql,
): MovimentoCaixa {
  return {
    id: linha.id,
    sessaoCaixaId: linha.sessao_caixa_id,
    tipo: linha.tipo as TipoMovimentoCaixa,
    valorCentavos: linha.valor_centavos,
    descricao: linha.descricao,
    origem: linha.origem as OrigemMovimentoCaixa,
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
  }
}
