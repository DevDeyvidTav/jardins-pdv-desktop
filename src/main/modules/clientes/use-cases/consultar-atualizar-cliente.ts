import type {
  AtualizarClienteEntrada,
  Cliente,
  InativarClienteEntrada,
  ListarClientesEntrada,
  ObterClienteEntrada,
  ReativarClienteEntrada,
} from '@shared/types/cliente'
import { CODIGOS_ERRO_CLIENTES, ErroClientes } from '../errors/erros-clientes'
import {
  criarClienteRepository,
  type ClienteRepository,
} from '../repositories/cliente.repository'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { registrarClienteSync } from '../../sincronizacao/services/registrar-cadastro-sync'

function garantirCliente(repositorio: ClienteRepository, clienteId: string): Cliente {
  const cliente = repositorio.buscarPorId(clienteId)
  if (!cliente) {
    throw new ErroClientes(
      CODIGOS_ERRO_CLIENTES.CLIENTE_NAO_ENCONTRADO,
      'Cliente nao encontrado.',
    )
  }
  return cliente
}

function normalizarOpcional(valor?: string | null): string | null {
  if (valor === undefined) return null
  const texto = valor?.trim() ?? ''
  return texto.length > 0 ? texto : null
}

export function criarListarClientes(
  repositorio: ClienteRepository = criarClienteRepository(),
) {
  return function listarClientes(entrada: ListarClientesEntrada = {}): Cliente[] {
    return repositorio.listar(entrada)
  }
}

export const listarClientes = criarListarClientes()

export function criarObterCliente(
  repositorio: ClienteRepository = criarClienteRepository(),
) {
  return function obterCliente(entrada: ObterClienteEntrada): Cliente {
    return garantirCliente(repositorio, entrada.clienteId)
  }
}

export const obterCliente = criarObterCliente()

export function criarAtualizarCliente(
  repositorio: ClienteRepository = criarClienteRepository(),
) {
  return function atualizarCliente(entrada: AtualizarClienteEntrada): Cliente {
    garantirCliente(repositorio, entrada.clienteId)
    const nome = entrada.nome.trim()
    if (nome.length < 2) {
      throw new ErroClientes(
        CODIGOS_ERRO_CLIENTES.NOME_OBRIGATORIO,
        'Nome do cliente deve ter no minimo 2 caracteres.',
      )
    }

    const cliente = repositorio.atualizar({
      clienteId: entrada.clienteId,
      nome,
      telefone: normalizarOpcional(entrada.telefone),
      documento: normalizarOpcional(entrada.documento),
      endereco: normalizarOpcional(entrada.endereco),
      liberaTalao: entrada.liberaTalao,
    })
    registrarClienteSync(cliente, OPERACAO_SYNC.UPDATE)
    return cliente
  }
}

export const atualizarCliente = criarAtualizarCliente()

export function criarInativarCliente(
  repositorio: ClienteRepository = criarClienteRepository(),
) {
  return function inativarCliente(entrada: InativarClienteEntrada): Cliente {
    garantirCliente(repositorio, entrada.clienteId)
    const cliente = repositorio.definirAtivo(entrada.clienteId, false)
    registrarClienteSync(cliente, OPERACAO_SYNC.UPDATE)
    return cliente
  }
}

export const inativarCliente = criarInativarCliente()

export function criarReativarCliente(
  repositorio: ClienteRepository = criarClienteRepository(),
) {
  return function reativarCliente(entrada: ReativarClienteEntrada): Cliente {
    garantirCliente(repositorio, entrada.clienteId)
    const cliente = repositorio.definirAtivo(entrada.clienteId, true)
    registrarClienteSync(cliente, OPERACAO_SYNC.UPDATE)
    return cliente
  }
}

export const reativarCliente = criarReativarCliente()
