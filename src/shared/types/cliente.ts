export interface Cliente {
  id: string
  nome: string
  telefone: string | null
  documento: string | null
  endereco: string | null
  liberaTalao: boolean
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}

export interface CriarClienteEntrada {
  nome: string
  telefone?: string
  documento?: string
  endereco?: string
  liberaTalao?: boolean
}

export interface AtualizarClienteEntrada {
  clienteId: string
  nome: string
  telefone?: string | null
  documento?: string | null
  endereco?: string | null
  liberaTalao: boolean
}

export interface ObterClienteEntrada {
  clienteId: string
}

export interface ListarClientesEntrada {
  apenasAtivos?: boolean
  apenasComTalao?: boolean
  termo?: string
}

export interface InativarClienteEntrada {
  clienteId: string
}

export interface ReativarClienteEntrada {
  clienteId: string
}

export interface VincularClientePedidoEntrada {
  pedidoId: string
  clienteId: string | null
}
