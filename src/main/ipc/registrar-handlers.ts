import { registrarHandlersSistema } from './sistema.ipc'
import { registrarHandlersCaixa } from '../modules/caixa/caixa.ipc'
import { registrarHandlersProdutos } from '../modules/produtos/produtos.ipc'
import { registrarHandlersCatalogo } from '../modules/catalogo/catalogo.ipc'
import { registrarHandlersMesas } from '../modules/mesas/mesas.ipc'
import { registrarHandlersPedidos } from '../modules/pedidos/pedidos.ipc'
import { registrarHandlersPagamentos } from '../modules/pagamentos/pagamentos.ipc'
import { registrarHandlersDelivery } from '../modules/delivery/delivery.ipc'
import { registrarHandlersDivisaoConta } from '../modules/divisao-conta/divisao-conta.ipc'
import { registrarHandlersPizzas } from '../modules/pizzas/pizzas.ipc'
import { registrarHandlersClientes } from '../modules/clientes/clientes.ipc'
import { registrarHandlersImpressao } from '../modules/impressao/impressao.ipc'
import { registrarHandlersSincronizacao } from '../modules/sincronizacao/sincronizacao.ipc'
import { registrarHandlersFiscal } from '../modules/fiscal/fiscal.ipc'
import { registrarHandlersConfiguracoes } from '../modules/configuracoes/configuracoes.ipc'

export function registrarHandlersIpc(): void {
  registrarHandlersSistema()
  registrarHandlersCaixa()
  registrarHandlersProdutos()
  registrarHandlersCatalogo()
  registrarHandlersMesas()
  registrarHandlersPedidos()
  registrarHandlersPagamentos()
  registrarHandlersDelivery()
  registrarHandlersDivisaoConta()
  registrarHandlersPizzas()
  registrarHandlersClientes()
  registrarHandlersImpressao()
  registrarHandlersSincronizacao()
  registrarHandlersFiscal()
  registrarHandlersConfiguracoes()
}
