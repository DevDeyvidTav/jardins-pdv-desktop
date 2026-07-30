export const CANAIS_IPC = {
  SISTEMA_OBTER_INFORMACOES: 'sistema:obter-informacoes',
  CAIXA_ABRIR_SESSAO: 'caixa:abrir-sessao',
  CAIXA_OBTER_SESSAO_ABERTA: 'caixa:obter-sessao-aberta',
  CAIXA_REGISTRAR_MOVIMENTO: 'caixa:registrar-movimento',
  CAIXA_LISTAR_MOVIMENTOS: 'caixa:listar-movimentos',
  CAIXA_OBTER_RESUMO_ATUAL: 'caixa:obter-resumo-atual',
} as const

export type CanalIpc = (typeof CANAIS_IPC)[keyof typeof CANAIS_IPC]
