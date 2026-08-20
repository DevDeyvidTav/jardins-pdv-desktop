import type { SessaoCaixa } from '@shared/types/sessao-caixa';

export function serializarSessaoCaixaSync(sessao: SessaoCaixa): Record<string, unknown> {
  return {
    id: sessao.id,
    operadorId: sessao.operadorId,
    operadorNome: sessao.operadorNome,
    saldoInicialCentavos: sessao.saldoInicialCentavos,
    status: sessao.status,
    abertoEm: sessao.abertoEm,
    fechadoEm: sessao.fechadoEm,
    saldoFinalInformadoCentavos: sessao.saldoFinalInformadoCentavos,
    saldoFinalEsperadoCentavos: sessao.saldoFinalEsperadoCentavos,
    diferencaCentavos: sessao.diferencaCentavos,
    observacaoFechamento: sessao.observacaoFechamento,
    criadoEm: sessao.criadoEm,
    atualizadoEm: sessao.atualizadoEm,
  };
}
