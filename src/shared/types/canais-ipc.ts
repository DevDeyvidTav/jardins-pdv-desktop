export const CANAIS_IPC = {
  SISTEMA_OBTER_INFORMACOES: 'sistema:obter-informacoes',
} as const

export type CanalIpc = (typeof CANAIS_IPC)[keyof typeof CANAIS_IPC]
