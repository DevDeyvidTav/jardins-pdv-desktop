import { afterEach, describe, expect, it } from 'vitest'
import {
  CODIGOS_ERRO_PRODUTOS,
  ErroProdutos,
} from '../../../src/main/modules/produtos/errors/erros-produtos'
import { criarCategoriaProdutoRepository } from '../../../src/main/modules/produtos/repositories/categoria-produto.repository'
import { criarCriarCategoriaProduto } from '../../../src/main/modules/produtos/use-cases/criar-categoria-produto'
import { criarInativarCategoriaProduto } from '../../../src/main/modules/produtos/use-cases/inativar-categoria-produto'
import { criarReativarCategoriaProduto } from '../../../src/main/modules/produtos/use-cases/reativar-categoria-produto'
import { criarListarCategoriasProduto } from '../../../src/main/modules/produtos/use-cases/listar-categorias-produto'
import { prepararBancoTeste } from '../../helpers/banco-teste'

describe('categorias de produto', () => {
  let encerrarBanco: (() => void) | undefined

  afterEach(() => {
    encerrarBanco?.()
    encerrarBanco = undefined
  })

  it('cria categoria valida', async () => {
    const banco = await prepararBancoTeste()
    encerrarBanco = banco.encerrar

    const repositorio = criarCategoriaProdutoRepository()
    const criarCategoriaProduto = criarCriarCategoriaProduto(repositorio)

    const categoria = criarCategoriaProduto({
      nome: 'Bebidas',
      descricao: 'Bebidas em geral',
    })

    expect(categoria.nome).toBe('Bebidas')
    expect(categoria.ativo).toBe(true)
  })

  it('impede categoria com nome vazio', async () => {
    const banco = await prepararBancoTeste()
    encerrarBanco = banco.encerrar

    const criarCategoriaProduto = criarCriarCategoriaProduto()

    expect(() => criarCategoriaProduto({ nome: '   ' })).toThrow(ErroProdutos)

    try {
      criarCategoriaProduto({ nome: '   ' })
    } catch (erro) {
      expect((erro as ErroProdutos).codigo).toBe(CODIGOS_ERRO_PRODUTOS.NOME_OBRIGATORIO)
    }
  })

  it('lista apenas categorias ativas por padrao', async () => {
    const banco = await prepararBancoTeste()
    encerrarBanco = banco.encerrar

    const repositorio = criarCategoriaProdutoRepository()
    const criarCategoriaProduto = criarCriarCategoriaProduto(repositorio)
    const inativarCategoriaProduto = criarInativarCategoriaProduto(repositorio)
    const listarCategoriasProduto = criarListarCategoriasProduto(repositorio)

    criarCategoriaProduto({ nome: 'Bebidas' })
    criarCategoriaProduto({ nome: 'Lanches' })
    const sobremesas = criarCategoriaProduto({ nome: 'Sobremesas' })
    inativarCategoriaProduto({ categoriaId: sobremesas.id })

    expect(listarCategoriasProduto()).toHaveLength(2)
    expect(listarCategoriasProduto({ apenasAtivas: false })).toHaveLength(3)
  })

  it('inativa categoria', async () => {
    const banco = await prepararBancoTeste()
    encerrarBanco = banco.encerrar

    const repositorio = criarCategoriaProdutoRepository()
    const criarCategoriaProduto = criarCriarCategoriaProduto(repositorio)
    const inativarCategoriaProduto = criarInativarCategoriaProduto(repositorio)

    const categoria = criarCategoriaProduto({ nome: 'Bebidas' })
    const inativada = inativarCategoriaProduto({ categoriaId: categoria.id })

    expect(inativada.ativo).toBe(false)
  })

  it('reativa categoria', async () => {
    const banco = await prepararBancoTeste()
    encerrarBanco = banco.encerrar

    const repositorio = criarCategoriaProdutoRepository()
    const criarCategoriaProduto = criarCriarCategoriaProduto(repositorio)
    const inativarCategoriaProduto = criarInativarCategoriaProduto(repositorio)
    const reativarCategoriaProduto = criarReativarCategoriaProduto(repositorio)

    const categoria = criarCategoriaProduto({ nome: 'Bebidas' })
    inativarCategoriaProduto({ categoriaId: categoria.id })
    const reativada = reativarCategoriaProduto({ categoriaId: categoria.id })

    expect(reativada.ativo).toBe(true)
  })
})
