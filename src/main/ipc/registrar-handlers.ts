import { registrarHandlersSistema } from './sistema.ipc'
import { registrarHandlersCaixa } from '../modules/caixa/caixa.ipc'
import { registrarHandlersProdutos } from '../modules/produtos/produtos.ipc'
import { registrarHandlersMesas } from '../modules/mesas/mesas.ipc'
import { registrarHandlersPedidos } from '../modules/pedidos/pedidos.ipc'
import { registrarHandlersPagamentos } from '../modules/pagamentos/pagamentos.ipc'
import { registrarHandlersDelivery } from '../modules/delivery/delivery.ipc'

export function registrarHandlersIpc(): void {
  registrarHandlersSistema()
  registrarHandlersCaixa()
  registrarHandlersProdutos()
  registrarHandlersMesas()
  registrarHandlersPedidos()
  registrarHandlersPagamentos()
  registrarHandlersDelivery()
}
