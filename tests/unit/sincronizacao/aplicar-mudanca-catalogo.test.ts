import { afterEach, describe, expect, it } from 'vitest'
import { ENTIDADE_SYNC, OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { obterConexaoBancoLocal } from '../../../src/main/database/inicializar-banco'
import { criarProdutoRepository } from '../../../src/main/modules/produtos/repositories/produto.repository'
import { criarPizzaSaborRepository } from '../../../src/main/modules/pizzas/repositories/pizza-sabor.repository'
import { criarSyncOutboxRepository } from '../../../src/main/modules/sincronizacao/repositories/sync-outbox.repository'
import { aplicarMudancasCatalogo } from '../../../src/main/modules/sincronizacao/services/aplicar-mudanca-catalogo'
import { prepararAmbientePedidos } from '../../helpers/pedido-teste'
import { prepararAmbientePizzas } from '../../helpers/pizza-teste'

describe('aplicar mudancas de catalogo da nuvem', () => {
  let encerrarBanco: (() => void) | undefined

  afterEach(() => {
    encerrarBanco?.()
    encerrarBanco = undefined
  })

  it('dashboard cria sabor e o PDV aplica sem reenviar outbox', async () => {
    const ambiente = await prepararAmbientePizzas()
    encerrarBanco = ambiente.encerrar
    const conexao = obterConexaoBancoLocal()
    const outboxAntes = criarSyncOutboxRepository().listarPendentes(200).length
    const saborId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

    const resultado = aplicarMudancasCatalogo(conexao, [
      {
        id: 11,
        entidade: ENTIDADE_SYNC.PIZZA_SABOR,
        entidadeId: saborId,
        operacao: OPERACAO_SYNC.CREATE,
        atualizadoEm: '2026-09-21T22:00:00.000Z',
        origem: 'DASHBOARD',
        payload: {
          id: saborId,
          nome: 'Margherita nuvem',
          descricao: null,
          ativa: true,
          ordem: 0,
          criadoEm: '2026-09-21T22:00:00.000Z',
          atualizadoEm: '2026-09-21T22:00:00.000Z',
        },
      },
    ])

    expect(resultado.aplicados).toBe(1)
    const sabor = criarPizzaSaborRepository().buscarPorId(saborId)
    expect(sabor?.nome).toBe('Margherita nuvem')
    expect(criarSyncOutboxRepository().listarPendentes(200)).toHaveLength(outboxAntes)
  })

  it('nao sobrescreve preco local mais novo', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar
    const conexao = obterConexaoBancoLocal()
    const produto = criarProdutoRepository().buscarPorId(ambiente.produto.id)
    expect(produto).not.toBeNull()

    aplicarMudancasCatalogo(conexao, [
      {
        id: 8,
        entidade: ENTIDADE_SYNC.PRODUTO,
        entidadeId: ambiente.produto.id,
        operacao: OPERACAO_SYNC.UPDATE,
        atualizadoEm: '2020-01-01T00:00:00.000Z',
        origem: 'DASHBOARD',
        payload: {
          id: ambiente.produto.id,
          categoriaId: ambiente.produto.categoriaId,
          nome: 'Preco velho da nuvem',
          precoCentavos: 1,
          ativo: true,
          atualizadoEm: '2020-01-01T00:00:00.000Z',
          criadoEm: ambiente.produto.criadoEm,
        },
      },
    ])

    const depois = criarProdutoRepository().buscarPorId(ambiente.produto.id)
    expect(depois?.nome).toBe(ambiente.produto.nome)
    expect(depois?.precoCentavos).toBe(ambiente.produto.precoCentavos)
  })

  it('nuvem mais nova atualiza o produto local', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar
    const conexao = obterConexaoBancoLocal()

    aplicarMudancasCatalogo(conexao, [
      {
        id: 9,
        entidade: ENTIDADE_SYNC.PRODUTO,
        entidadeId: ambiente.produto.id,
        operacao: OPERACAO_SYNC.UPDATE,
        atualizadoEm: '2099-01-01T00:00:00.000Z',
        origem: 'DASHBOARD',
        payload: {
          id: ambiente.produto.id,
          categoriaId: ambiente.categoria.id,
          nome: 'Coca da nuvem',
          precoCentavos: 850,
          ativo: true,
          atualizadoEm: '2099-01-01T00:00:00.000Z',
          criadoEm: ambiente.produto.criadoEm,
        },
      },
    ])

    const depois = criarProdutoRepository().buscarPorId(ambiente.produto.id)
    expect(depois?.nome).toBe('Coca da nuvem')
    expect(depois?.precoCentavos).toBe(850)
  })

  it('aplica produto cuja categoria da nuvem ainda nao existe localmente', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar
    const conexao = obterConexaoBancoLocal()
    const produtoId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'

    const resultado = aplicarMudancasCatalogo(conexao, [
      {
        id: 10,
        entidade: ENTIDADE_SYNC.PRODUTO,
        entidadeId: produtoId,
        operacao: OPERACAO_SYNC.CREATE,
        atualizadoEm: '2026-09-21T23:30:00.000Z',
        origem: 'DASHBOARD',
        payload: {
          id: produtoId,
          categoriaId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
          nome: 'Produto sem categoria local',
          precoCentavos: 1500,
          ativo: true,
          criadoEm: '2026-09-21T23:30:00.000Z',
          atualizadoEm: '2026-09-21T23:30:00.000Z',
        },
      },
    ])

    expect(resultado.aplicados).toBe(1)
    const local = criarProdutoRepository().buscarPorId(produtoId)
    expect(local?.nome).toBe('Produto sem categoria local')
    expect(local?.categoriaId).toBe(ambiente.categoria.id)
  })
})
