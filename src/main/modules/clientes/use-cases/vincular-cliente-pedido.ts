import type { VincularClientePedidoEntrada } from '@shared/types/cliente'
import type { Pedido } from '@shared/types/pedido'
import { STATUS_PEDIDO } from '@shared/types/pedido'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { executarEmTransacaoImediata } from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { CODIGOS_ERRO_CLIENTES, ErroClientes } from '../errors/erros-clientes'
import {
  criarClienteRepository,
  type ClienteRepository,
} from '../repositories/cliente.repository'
import {
  criarPedidoRepository,
  type PedidoRepository,
} from '../../pedidos/repositories/pedido.repository'
import {
  criarPedidoEntregaRepository,
  type PedidoEntregaRepository,
} from '../../delivery/repositories/pedido-entrega.repository'
import { registrarEventoPedidoSync } from '../../sincronizacao/services/registrar-evento-pedido'

export function criarVincularClientePedido(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioCliente: ClienteRepository = criarClienteRepository(),
  repositorioEntrega: PedidoEntregaRepository = criarPedidoEntregaRepository(),
  obterConexao = obterConexaoBancoLocal,
) {
  return function vincularClientePedido(entrada: VincularClientePedidoEntrada): Pedido {
    const conexao = obterConexao()
    return executarEmTransacaoImediata(conexao, () => {
      const pedido = repositorioPedido.buscarPorId(entrada.pedidoId)
      if (!pedido) {
        throw new ErroClientes(
          CODIGOS_ERRO_CLIENTES.PEDIDO_NAO_ENCONTRADO,
          'Pedido nao encontrado.',
        )
      }
      if (pedido.status !== STATUS_PEDIDO.ABERTO) {
        throw new ErroClientes(
          CODIGOS_ERRO_CLIENTES.PEDIDO_NAO_ABERTO,
          'So e possivel vincular cliente em pedido aberto.',
        )
      }

      let atualizado: Pedido

      if (entrada.clienteId) {
        const cliente = repositorioCliente.buscarPorId(entrada.clienteId)
        if (!cliente) {
          throw new ErroClientes(
            CODIGOS_ERRO_CLIENTES.CLIENTE_NAO_ENCONTRADO,
            'Cliente nao encontrado.',
          )
        }
        if (!cliente.ativo) {
          throw new ErroClientes(
            CODIGOS_ERRO_CLIENTES.CLIENTE_INATIVO,
            'Cliente inativo nao pode ser vinculado ao pedido.',
          )
        }

        atualizado = repositorioPedido.atualizarClienteId(pedido.id, cliente.id)
        const entrega = repositorioEntrega.buscarPorPedidoId(pedido.id)
        if (entrega) {
          repositorioEntrega.atualizarDados(pedido.id, {
            clienteNome: entrega.clienteNome.trim() || cliente.nome,
            telefone: entrega.telefone ?? cliente.telefone,
            endereco: entrega.endereco ?? cliente.endereco,
          })
        }
      } else {
        atualizado = repositorioPedido.atualizarClienteId(pedido.id, null)
      }

      registrarEventoPedidoSync(pedido.id, OPERACAO_SYNC.UPDATE, conexao)
      return atualizado
    })
  }
}

export const vincularClientePedido = criarVincularClientePedido()
