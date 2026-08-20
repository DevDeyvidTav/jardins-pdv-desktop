import type { MovimentoCaixa } from '@shared/types/movimento-caixa';

export function serializarMovimentoCaixaSync(
  movimento: MovimentoCaixa,
): Record<string, unknown> {
  return {
    id: movimento.id,
    sessaoCaixaId: movimento.sessaoCaixaId,
    tipo: movimento.tipo,
    valorCentavos: movimento.valorCentavos,
    descricao: movimento.descricao,
    origem: movimento.origem,
    criadoEm: movimento.criadoEm,
    atualizadoEm: movimento.atualizadoEm,
  };
}
