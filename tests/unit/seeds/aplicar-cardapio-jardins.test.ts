import { describe, expect, it } from 'vitest'
import { obterConexaoBancoLocal } from '../../../src/main/database/inicializar-banco'
import {
  aplicarCardapioJardins,
  CHAVE_METADATA_CARDAPIO_JARDINS,
} from '../../../src/main/database/seeds/aplicar-cardapio-jardins'
import { executarSeedChinaExpress } from '../../../src/main/database/seeds/seed-china-express'
import { SETOR_POR_CATEGORIA_JARDINS } from '../../../src/main/database/seeds/setores-categoria-jardins'
import { criarCategoriaProdutoRepository } from '../../../src/main/modules/produtos/repositories/categoria-produto.repository'
import { criarProdutoRepository } from '../../../src/main/modules/produtos/repositories/produto.repository'
import { prepararBancoTeste } from '../../helpers/banco-teste'

describe('aplicarCardapioJardins', () => {
  // Seed completo + migracoes passam de 5s quando a suite roda em paralelo.
  it('configura setores, renomeia categorias e separa pratos italianos', { timeout: 120_000 }, async () => {
    const banco = await prepararBancoTeste()
    const conexao = obterConexaoBancoLocal()

    executarSeedChinaExpress(conexao, { forcar: true })

    const categorias = criarCategoriaProdutoRepository(conexao).listar()
    const produtos = criarProdutoRepository(conexao).listarComCategoria()

    expect(categorias.some((c) => c.nome === 'Pratos Quentes Chinesa')).toBe(true)
    expect(categorias.some((c) => c.nome === 'Pratos Quentes Italiano')).toBe(true)
    expect(categorias.some((c) => c.nome === 'Sushi Tradicional')).toBe(true)
    expect(categorias.some((c) => c.nome === 'Sushi Doce')).toBe(true)

    const italiano = categorias.find((c) => c.nome === 'Pratos Quentes Italiano')
    expect(italiano?.setorImpressao).toBe('PIZZA')
    expect(
      produtos.some(
        (p) => p.categoriaId === italiano?.id && p.nome === 'Frango à Parmegiana Italiano',
      ),
    ).toBe(true)

    for (const [nomeCategoria, setor] of Object.entries(SETOR_POR_CATEGORIA_JARDINS)) {
      const categoria = categorias.find((c) => c.nome === nomeCategoria)
      if (categoria) {
        expect(categoria.setorImpressao).toBe(setor)
      }
    }

    const reaplicar = aplicarCardapioJardins(conexao)
    expect(reaplicar.aplicado).toBe(false)

    banco.encerrar()
  })

  it('esconde categorias que nao estao no cardapio impresso', { timeout: 120_000 }, async () => {
    const banco = await prepararBancoTeste()
    const conexao = obterConexaoBancoLocal()

    executarSeedChinaExpress(conexao, { forcar: true })

    const categorias = criarCategoriaProdutoRepository(conexao).listar()
    const produtos = criarProdutoRepository(conexao).listarComCategoria()

    for (const nome of ['Rodizio', 'Temakis', 'Yakissoba', 'Sobremesa', 'Promocao Do Dia']) {
      const categoria = categorias.find((c) => c.nome === nome)
      expect(categoria?.ativo).toBe(false)
      expect(
        produtos.some((p) => p.categoriaId === categoria?.id && p.ativo),
      ).toBe(false)
    }

    banco.encerrar()
  })

  it('preenche fiscal de produto sem NCM', { timeout: 120_000 }, async () => {
    const banco = await prepararBancoTeste()
    const conexao = obterConexaoBancoLocal()

    executarSeedChinaExpress(conexao, { forcar: true })

    const repositorio = criarProdutoRepository(conexao)
    const semNcm = repositorio
      .listarComCategoria({ apenasAtivos: false })
      .filter((p) => !p.fiscalNcm)
    expect(
      semNcm.map((p) => `${p.categoriaNome} | ${p.nome}`),
    ).toEqual([])

    banco.encerrar()
  })

  it('reaplica quando a versao do cardapio muda', { timeout: 120_000 }, async () => {
    const banco = await prepararBancoTeste()
    const conexao = obterConexaoBancoLocal()

    executarSeedChinaExpress(conexao, { forcar: true })

    const repositorioCategoria = criarCategoriaProdutoRepository(conexao)
    const rodizio = repositorioCategoria.listar().find((c) => c.nome === 'Rodizio')
    expect(rodizio?.ativo).toBe(false)

    repositorioCategoria.reativar(rodizio!.id)
    expect(repositorioCategoria.buscarPorId(rodizio!.id)?.ativo).toBe(true)

    const resultado = aplicarCardapioJardins(conexao, { forcar: true })
    expect(resultado.aplicado).toBe(true)
    expect(repositorioCategoria.buscarPorId(rodizio!.id)?.ativo).toBe(false)

    banco.encerrar()
  })
})
