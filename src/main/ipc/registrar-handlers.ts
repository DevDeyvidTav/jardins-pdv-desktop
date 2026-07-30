import { registrarHandlersSistema } from './sistema.ipc'
import { registrarHandlersCaixa } from '../modules/caixa/caixa.ipc'
import { registrarHandlersProdutos } from '../modules/produtos/produtos.ipc'

export function registrarHandlersIpc(): void {
  registrarHandlersSistema()
  registrarHandlersCaixa()
  registrarHandlersProdutos()
}
