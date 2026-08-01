import { afterEach, describe, expect, it } from 'vitest'
import {
  CODIGOS_ERRO_PRODUTOS,
  ErroProdutos,
} from '../../../src/main/modules/produtos/errors/erros-produtos'
import { criarCategoriaProdutoRepository } from '../../../src/main/modules/produtos/repositories/categoria-produto.repository'
import { criarProdutoRepository } from '../../../src/main/modules/produtos/repositories/produto.repository'
import { criarAtualizarCategoriaProduto } from '../../../src/main/modules/produtos/use-cases/atualizar-categoria-produto'
import { criarAtualizarProduto } from '../../../src/main/modules/produtos/use-cases/atualizar-produto'
import { criarCriarCategoriaProduto } from '../../../src/main/modules/produtos/use-cases/criar-categoria-produto'
import { criarExcluirCategoriaProduto } from '../../../src/main/modules/produtos/use-cases/excluir-categoria-produto'
import { criarExcluirProduto } from '../../../src/main/modules/produtos/use-cases/excluir-produto'
import { criarInativarCategoriaProduto } from '../../../src/main/modules/produtos/use-cases/inativar-categoria-produto'
import { criarBuscarProdutos } from '../../../src/main/modules/produtos/use-cases/buscar-produtos'
import { criarCriarProduto } from '../../../src/main/modules/produtos/use-cases/criar-produto'
import { criarInativarProduto } from '../../../src/main/modules/produtos/use-cases/inativar-produto'
import { criarReativarProduto } from '../../../src/main/modules/produtos/use-cases/reativar-produto'
import { criarListarProdutos } from '../../../src/main/modules/produtos/use-cases/listar-produtos'
import { prepararAmbientePedidos } from '../../helpers/pedido-teste'
import { prepararBancoTeste } from '../../helpers/banco-teste'

describe('produtos', () => {
  let encerrarBanco: (() => void) | undefined

  afterEach(() => {
    encerrarBanco?.()
    encerrarBanco = undefined
  })

  async function prepararCatalogo() {
    const banco = await prepararBancoTeste()
    encerrarBanco = banco.encerrar

    const repositorioCategoria = criarCategoriaProdutoRepository()
    const repositorioProduto = criarProdutoRepository()
    const criarCategoriaProduto = criarCriarCategoriaProduto(repositorioCategoria)
    const inativarCategoriaProduto = criarInativarCategoriaProduto(repositorioCategoria)
    const criarProduto = criarCriarProduto(repositorioProduto, repositorioCategoria)
    const listarProdutos = criarListarProdutos(repositorioProduto)
    const buscarProdutos = criarBuscarProdutos(repositorioProduto)
    const inativarProduto = criarInativarProduto(repositorioProduto)
    const reativarProduto = criarReativarProduto(repositorioProduto, repositorioCategoria)

    const categoria = criarCategoriaProduto({
      nome: 'Bebidas',
      descricao: 'Bebidas em geral',
    })

    return {
      categoria,
      criarCategoriaProduto,
      inativarCategoriaProduto,
      criarProduto,
      listarProdutos,
      buscarProdutos,
      inativarProduto,
      reativarProduto,
    }
  }

  it('cria produto valido', async () => {
    const { categoria, criarProduto } = await prepararCatalogo()

    const produto = criarProduto({
      categoriaId: categoria.id,
      nome: 'Coca-Cola lata',
      descricao: '350ml',
      precoCentavos: 600,
    })

    expect(produto.nome).toBe('Coca-Cola lata')
    expect(produto.precoCentavos).toBe(600)
    expect(produto.ativo).toBe(true)
  })

  it('impede produto com nome vazio', async () => {
    const { categoria, criarProduto } = await prepararCatalogo()

    expect(() =>
      criarProduto({
        categoriaId: categoria.id,
        nome: '   ',
        precoCentavos: 600,
      }),
    ).toThrow(ErroProdutos)
  })

  it('impede produto com preco negativo', async () => {
    const { categoria, criarProduto } = await prepararCatalogo()

    try {
      criarProduto({
        categoriaId: categoria.id,
        nome: 'Agua',
        precoCentavos: -100,
      })
    } catch (erro) {
      expect((erro as ErroProdutos).codigo).toBe(CODIGOS_ERRO_PRODUTOS.PRECO_INVALIDO)
    }
  })

  it('impede produto sem categoria', async () => {
    await prepararCatalogo()
    const criarProduto = criarCriarProduto()

    try {
      criarProduto({
        categoriaId: 'inexistente',
        nome: 'Agua',
        precoCentavos: 300,
      })
    } catch (erro) {
      expect((erro as ErroProdutos).codigo).toBe(
        CODIGOS_ERRO_PRODUTOS.CATEGORIA_NAO_ENCONTRADA,
      )
    }
  })

  it('impede produto vinculado a categoria inativa', async () => {
    const { categoria, inativarCategoriaProduto, criarProduto } = await prepararCatalogo()

    inativarCategoriaProduto({ categoriaId: categoria.id })

    try {
      criarProduto({
        categoriaId: categoria.id,
        nome: 'Coca-Cola lata',
        precoCentavos: 600,
      })
    } catch (erro) {
      expect((erro as ErroProdutos).codigo).toBe(CODIGOS_ERRO_PRODUTOS.CATEGORIA_INATIVA)
    }
  })

  it('lista produtos ativos', async () => {
    const { categoria, criarProduto, listarProdutos, inativarProduto } =
      await prepararCatalogo()

    const produtoAtivo = criarProduto({
      categoriaId: categoria.id,
      nome: 'Coca-Cola lata',
      precoCentavos: 600,
    })

    const produtoInativo = criarProduto({
      categoriaId: categoria.id,
      nome: 'Suco',
      precoCentavos: 800,
    })

    inativarProduto({ produtoId: produtoInativo.id })

    const ativos = listarProdutos({ apenasAtivos: true })
    const todos = listarProdutos({ apenasAtivos: false })

    expect(ativos).toHaveLength(1)
    expect(ativos[0]?.id).toBe(produtoAtivo.id)
    expect(todos).toHaveLength(2)
  })

  it('busca produto por termo', async () => {
    const { categoria, criarProduto, buscarProdutos } = await prepararCatalogo()

    criarProduto({
      categoriaId: categoria.id,
      nome: 'Coca-Cola lata',
      precoCentavos: 600,
    })

    criarProduto({
      categoriaId: categoria.id,
      nome: 'Agua mineral',
      precoCentavos: 300,
    })

    const resultados = buscarProdutos({ termo: 'coca' })

    expect(resultados).toHaveLength(1)
    expect(resultados[0]?.nome).toBe('Coca-Cola lata')
  })

  it('inativa produto', async () => {
    const { categoria, criarProduto, inativarProduto } = await prepararCatalogo()

    const produto = criarProduto({
      categoriaId: categoria.id,
      nome: 'Coca-Cola lata',
      precoCentavos: 600,
    })

    const inativado = inativarProduto({ produtoId: produto.id })

    expect(inativado.ativo).toBe(false)
  })

  it('reativa produto quando categoria esta ativa', async () => {
    const { categoria, criarProduto, inativarProduto, reativarProduto } =
      await prepararCatalogo()

    const produto = criarProduto({
      categoriaId: categoria.id,
      nome: 'Coca-Cola lata',
      precoCentavos: 600,
    })

    inativarProduto({ produtoId: produto.id })
    const reativado = reativarProduto({ produtoId: produto.id })

    expect(reativado.ativo).toBe(true)
  })

  it('impede reativar produto com categoria inativa', async () => {
    const {
      categoria,
      criarProduto,
      inativarCategoriaProduto,
      inativarProduto,
      reativarProduto,
    } = await prepararCatalogo()

    const produto = criarProduto({
      categoriaId: categoria.id,
      nome: 'Coca-Cola lata',
      precoCentavos: 600,
    })

    inativarProduto({ produtoId: produto.id })
    inativarCategoriaProduto({ categoriaId: categoria.id })

    try {
      reativarProduto({ produtoId: produto.id })
    } catch (erro) {
      expect((erro as ErroProdutos).codigo).toBe(CODIGOS_ERRO_PRODUTOS.CATEGORIA_INATIVA)
    }
  })

  it('atualiza produto e categoria', async () => {
    const banco = await prepararBancoTeste()
    encerrarBanco = banco.encerrar

    const repositorioCategoria = criarCategoriaProdutoRepository()
    const repositorioProduto = criarProdutoRepository()
    const criarCategoriaProduto = criarCriarCategoriaProduto(repositorioCategoria)
    const atualizarCategoriaProduto = criarAtualizarCategoriaProduto(repositorioCategoria)
    const criarProduto = criarCriarProduto(repositorioProduto, repositorioCategoria)
    const atualizarProduto = criarAtualizarProduto(repositorioProduto, repositorioCategoria)

    const categoria = criarCategoriaProduto({ nome: 'Bebidas' })
    const produto = criarProduto({
      categoriaId: categoria.id,
      nome: 'Coca-Cola lata',
      precoCentavos: 600,
    })

    const categoriaAtualizada = atualizarCategoriaProduto({
      categoriaId: categoria.id,
      nome: 'Refrigerantes',
      descricao: 'Gelados',
    })
    const produtoAtualizado = atualizarProduto({
      produtoId: produto.id,
      nome: 'Coca-Cola 350ml',
      precoCentavos: 650,
      descricao: 'Lata',
    })

    expect(categoriaAtualizada.nome).toBe('Refrigerantes')
    expect(categoriaAtualizada.descricao).toBe('Gelados')
    expect(produtoAtualizado.nome).toBe('Coca-Cola 350ml')
    expect(produtoAtualizado.precoCentavos).toBe(650)
    expect(produtoAtualizado.descricao).toBe('Lata')
  })

  it('exclui produto sem historico de pedidos', async () => {
    const banco = await prepararBancoTeste()
    encerrarBanco = banco.encerrar

    const repositorioCategoria = criarCategoriaProdutoRepository()
    const repositorioProduto = criarProdutoRepository()
    const criarCategoriaProduto = criarCriarCategoriaProduto(repositorioCategoria)
    const criarProduto = criarCriarProduto(repositorioProduto, repositorioCategoria)
    const excluirProduto = criarExcluirProduto(repositorioProduto)
    const listarProdutos = criarListarProdutos(repositorioProduto)

    const categoria = criarCategoriaProduto({ nome: 'Bebidas' })
    const produto = criarProduto({
      categoriaId: categoria.id,
      nome: 'Suco',
      precoCentavos: 800,
    })

    excluirProduto({ produtoId: produto.id })

    expect(listarProdutos({ apenasAtivos: false })).toHaveLength(0)
  })

  it('impede excluir categoria com produtos', async () => {
    const banco = await prepararBancoTeste()
    encerrarBanco = banco.encerrar

    const repositorioCategoria = criarCategoriaProdutoRepository()
    const repositorioProduto = criarProdutoRepository()
    const criarCategoriaProduto = criarCriarCategoriaProduto(repositorioCategoria)
    const criarProduto = criarCriarProduto(repositorioProduto, repositorioCategoria)
    const excluirCategoriaProduto = criarExcluirCategoriaProduto(
      repositorioCategoria,
      repositorioProduto,
    )

    const categoria = criarCategoriaProduto({ nome: 'Bebidas' })
    criarProduto({
      categoriaId: categoria.id,
      nome: 'Suco',
      precoCentavos: 800,
    })

    try {
      excluirCategoriaProduto({ categoriaId: categoria.id })
      expect.fail('deveria ter lancado erro')
    } catch (erro) {
      expect((erro as ErroProdutos).codigo).toBe(CODIGOS_ERRO_PRODUTOS.CATEGORIA_COM_PRODUTOS)
    }
  })

  it('exclui categoria vazia', async () => {
    const banco = await prepararBancoTeste()
    encerrarBanco = banco.encerrar

    const repositorioCategoria = criarCategoriaProdutoRepository()
    const repositorioProduto = criarProdutoRepository()
    const criarCategoriaProduto = criarCriarCategoriaProduto(repositorioCategoria)
    const excluirCategoriaProduto = criarExcluirCategoriaProduto(
      repositorioCategoria,
      repositorioProduto,
    )

    const categoria = criarCategoriaProduto({ nome: 'Vazia' })
    excluirCategoriaProduto({ categoriaId: categoria.id })

    expect(repositorioCategoria.buscarPorId(categoria.id)).toBeNull()
  })

  it('impede excluir produto usado em pedido', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 1,
    })

    const excluirProduto = criarExcluirProduto(ambiente.repositorioProduto)

    try {
      excluirProduto({ produtoId: ambiente.produto.id })
      expect.fail('deveria ter lancado erro')
    } catch (erro) {
      expect((erro as ErroProdutos).codigo).toBe(CODIGOS_ERRO_PRODUTOS.PRODUTO_EM_USO)
    }
  })
})
