import type { Cliente, CriarClienteEntrada } from '@shared/types/cliente'
import { CODIGOS_ERRO_CLIENTES, ErroClientes } from '../errors/erros-clientes'
import {
  criarClienteRepository,
  type ClienteRepository,
} from '../repositories/cliente.repository'

function normalizarOpcional(valor?: string | null): string | null {
  const texto = valor?.trim() ?? ''
  return texto.length > 0 ? texto : null
}

export function criarCriarCliente(
  repositorio: ClienteRepository = criarClienteRepository(),
) {
  return function criarCliente(entrada: CriarClienteEntrada): Cliente {
    const nome = entrada.nome.trim()
    if (nome.length < 2) {
      throw new ErroClientes(
        CODIGOS_ERRO_CLIENTES.NOME_OBRIGATORIO,
        'Nome do cliente deve ter no minimo 2 caracteres.',
      )
    }

    return repositorio.inserir({
      nome,
      telefone: normalizarOpcional(entrada.telefone),
      documento: normalizarOpcional(entrada.documento),
      endereco: normalizarOpcional(entrada.endereco),
      liberaTalao: Boolean(entrada.liberaTalao),
    })
  }
}

export const criarCliente = criarCriarCliente()
