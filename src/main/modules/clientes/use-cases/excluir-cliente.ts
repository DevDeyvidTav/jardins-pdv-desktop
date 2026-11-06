import type {
  ExcluirClienteEntrada,
  ResultadoRemocaoCatalogo,
} from '@shared/types/cliente'
import { ENTIDADE_SYNC, OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { CODIGOS_ERRO_CLIENTES, ErroClientes } from '../errors/erros-clientes'
import {
  criarClienteRepository,
  type ClienteRepository,
} from '../repositories/cliente.repository'
import {
  registrarCadastroSync,
  registrarClienteSync,
} from '../../sincronizacao/services/registrar-cadastro-sync'

export function criarExcluirCliente(
  repositorio: ClienteRepository = criarClienteRepository(),
) {
  return function excluirCliente(entrada: ExcluirClienteEntrada): ResultadoRemocaoCatalogo {
    const existente = repositorio.buscarPorId(entrada.clienteId)
    if (!existente) {
      throw new ErroClientes(
        CODIGOS_ERRO_CLIENTES.CLIENTE_NAO_ENCONTRADO,
        'Cliente nao encontrado.',
      )
    }

    if (repositorio.estaReferenciado(entrada.clienteId)) {
      const cliente = existente.ativo
        ? repositorio.definirAtivo(entrada.clienteId, false)
        : existente
      registrarClienteSync(cliente, OPERACAO_SYNC.UPDATE)
      return { modo: 'INATIVADO' }
    }

    repositorio.excluir(entrada.clienteId)
    registrarCadastroSync(ENTIDADE_SYNC.CLIENTE, entrada.clienteId, OPERACAO_SYNC.CANCEL, {
      id: entrada.clienteId,
    })
    return { modo: 'EXCLUIDO' }
  }
}

export const excluirCliente = criarExcluirCliente()
