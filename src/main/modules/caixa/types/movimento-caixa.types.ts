import {
  TIPO_MOVIMENTO_CAIXA,
  type MovimentoCaixa,
  type OrigemMovimentoCaixa,
  type TipoMovimentoCaixa,
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
    tipo:
      linha.tipo === 'SANGRIA'
        ? TIPO_MOVIMENTO_CAIXA.RETIRADA
        : (linha.tipo as TipoMovimentoCaixa),
    valorCentavos: linha.valor_centavos,
    descricao: linha.descricao,
    origem: linha.origem as OrigemMovimentoCaixa,
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
  }
}
