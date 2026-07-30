export const CANAIS_IPC = {
  SISTEMA_OBTER_INFORMACOES: 'sistema:obter-informacoes',
  CAIXA_ABRIR_SESSAO: 'caixa:abrir-sessao',
  CAIXA_OBTER_SESSAO_ABERTA: 'caixa:obter-sessao-aberta',
} as const

export type CanalIpc = (typeof CANAIS_IPC)[keyof typeof CANAIS_IPC]
