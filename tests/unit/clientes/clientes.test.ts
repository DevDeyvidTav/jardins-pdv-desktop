import { afterEach, describe, expect, it } from 'vitest'
import { CODIGOS_ERRO_CLIENTES, ErroClientes } from '../../../src/main/modules/clientes/errors/erros-clientes'
import { criarClienteRepository } from '../../../src/main/modules/clientes/repositories/cliente.repository'
import { criarCriarCliente } from '../../../src/main/modules/clientes/use-cases/criar-cliente'
import {
  criarAtualizarCliente,
  criarInativarCliente,
  criarListarClientes,
  criarObterCliente,
  criarReativarCliente,
} from '../../../src/main/modules/clientes/use-cases/consultar-atualizar-cliente'
import { criarVincularClientePedido } from '../../../src/main/modules/clientes/use-cases/vincular-cliente-pedido'
import {
  atualizarClienteSchema,
  criarClienteSchema,
  registrarBaixaTalaoSchema,
  vincularClientePedidoSchema,
} from '../../../src/main/modules/clientes/schemas/cliente.schema'
import { FORMA_PAGAMENTO } from '../../../src/shared/types/pagamento-pedido'
import { prepararAmbientePedidos } from '../../helpers/pedido-teste'
import { prepararBancoTeste } from '../../helpers/banco-teste'

describe('clientes', () => {
  let encerrar: (() => void) | undefined
  afterEach(() => encerrar?.())

  async function preparar() {
    const banco = await prepararBancoTeste()
    encerrar = banco.encerrar
    const repositorio = criarClienteRepository()
    return {
      criar: criarCriarCliente(repositorio),
      listar: criarListarClientes(repositorio),
      obter: criarObterCliente(repositorio),
      atualizar: criarAtualizarCliente(repositorio),
      inativar: criarInativarCliente(repositorio),
      reativar: criarReativarCliente(repositorio),
    }
  }

  it('cria cliente com talão liberado', async () => {
    const { criar, obter } = await preparar()
    const cliente = criar({
      nome: 'Maria Oliveira',
      telefone: '81998887766',
      liberaTalao: true,
    })

    expect(cliente.nome).toBe('Maria Oliveira')
    expect(cliente.liberaTalao).toBe(true)
    expect(cliente.ativo).toBe(true)
    expect(obter({ clienteId: cliente.id }).id).toBe(cliente.id)
  })

  it('impede cliente com nome curto', async () => {
    const { criar } = await preparar()
    expect(() => criar({ nome: 'A' })).toThrow(ErroClientes)
    expect(() => criar({ nome: 'A' })).toThrow(/minimo 2 caracteres/)
  })

  it('lista, atualiza, inativa e reativa', async () => {
    const { criar, listar, atualizar, inativar, reativar } = await preparar()
    const maria = criar({ nome: 'Maria Oliveira', liberaTalao: true })
    criar({ nome: 'Joao Ferreira' })

    expect(listar({ apenasComTalao: true })).toHaveLength(1)
    expect(listar({ termo: 'ferreira' })[0]?.nome).toBe('Joao Ferreira')

    const atualizado = atualizar({
      clienteId: maria.id,
      nome: 'Maria O.',
      telefone: '81990000000',
      liberaTalao: false,
    })
    expect(atualizado.nome).toBe('Maria O.')
    expect(atualizado.liberaTalao).toBe(false)

    expect(inativar({ clienteId: maria.id }).ativo).toBe(false)
    expect(listar({ apenasAtivos: true })).toHaveLength(1)
    expect(reativar({ clienteId: maria.id }).ativo).toBe(true)
  })

  it('vincula e desvincula cliente em pedido aberto', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrar = ambiente.encerrar
    const criar = criarCriarCliente()
    const vincular = criarVincularClientePedido(ambiente.repositorioPedido)
    const cliente = criar({ nome: 'Cliente Mesa', liberaTalao: true })
    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })

    const vinculado = vincular({ pedidoId: pedido.id, clienteId: cliente.id })
    expect(vinculado.clienteId).toBe(cliente.id)

    const semCliente = vincular({ pedidoId: pedido.id, clienteId: null })
    expect(semCliente.clienteId).toBeNull()
  })

  it('impede vincular cliente inativo', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrar = ambiente.encerrar
    const repositorio = criarClienteRepository()
    const criar = criarCriarCliente(repositorio)
    const inativar = criarInativarCliente(repositorio)
    const vincular = criarVincularClientePedido(ambiente.repositorioPedido, repositorio)
    const cliente = criar({ nome: 'Inativo', liberaTalao: true })
    inativar({ clienteId: cliente.id })
    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })

    try {
      vincular({ pedidoId: pedido.id, clienteId: cliente.id })
      throw new Error('deveria ter falhado')
    } catch (erro) {
      expect(erro).toBeInstanceOf(ErroClientes)
      expect((erro as ErroClientes).codigo).toBe(CODIGOS_ERRO_CLIENTES.CLIENTE_INATIVO)
    }
  })
})

describe('clientes schemas', () => {
  const UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

  it('valida criacao e atualizacao', () => {
    expect(criarClienteSchema.parse({ nome: 'Maria', liberaTalao: true }).nome).toBe('Maria')
    expect(() => criarClienteSchema.parse({ nome: 'A' })).toThrow()
    expect(
      atualizarClienteSchema.parse({
        clienteId: UUID,
        nome: 'Maria',
        liberaTalao: false,
      }).liberaTalao,
    ).toBe(false)
  })

  it('valida vinculo e baixa de talão', () => {
    expect(
      vincularClientePedidoSchema.parse({ pedidoId: UUID, clienteId: null }).clienteId,
    ).toBeNull()
    expect(
      registrarBaixaTalaoSchema.parse({
        clienteId: UUID,
        formaPagamento: FORMA_PAGAMENTO.DINHEIRO,
        valorCentavos: 100,
        competencia: '2026-08',
      }).valorCentavos,
    ).toBe(100)
    expect(() =>
      registrarBaixaTalaoSchema.parse({
        clienteId: UUID,
        formaPagamento: FORMA_PAGAMENTO.TALAO,
        valorCentavos: 100,
      }),
    ).toThrow()
  })
})
