import { registrarHandlersSistema } from './sistema.ipc'
import { registrarHandlersCaixa } from '../modules/caixa/caixa.ipc'

export function registrarHandlersIpc(): void {
  registrarHandlersSistema()
  registrarHandlersCaixa()
}
