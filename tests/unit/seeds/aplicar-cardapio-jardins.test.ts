import { describe, expect, it } from 'vitest'
import { obterConexaoBancoLocal } from '../../../src/main/database/inicializar-banco'
import { aplicarCardapioJardins } from '../../../src/main/database/seeds/aplicar-cardapio-jardins'
import { executarSeedChinaExpress } from '../../../src/main/database/seeds/seed-china-express'
import { SETOR_POR_CATEGORIA_JARDINS } from '../../../src/main/database/seeds/setores-categoria-jardins'
import { criarCategoriaProdutoRepository } from '../../../src/main/modules/produtos/repositories/categoria-produto.repository'
import { criarProdutoRepository } from '../../../src/main/modules/produtos/repositories/produto.repository'
import { prepararBancoTeste } from '../../helpers/banco-teste'

describe('aplicarCardapioJardins', () => {
  // Um unico teste: o seed completo e pesado (~20s no CI por execucao) e
  // varias rodadas no mesmo arquivo derrubam o worker do vitest (RPC timeout).
  it('configura cardapio, esconde categorias fora do menu e preenche fiscal', { timeout: 180_000 }, async () => {
    const banco = await prepararBancoTeste()
    const conexao = obterConexaoBancoLocal()

    executarSeedChinaExpress(conexao, { forcar: true })

    const repositorioCategoria = criarCategoriaProdutoRepository(conexao)
    const repositorioProduto = criarProdutoRepository(conexao)
    const categorias = repositorioCategoria.listar()
    const produtos = repositorioProduto.listarComCategoria()

    // Renomeia e separa categorias do cardapio Jardins
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

    // Esconde categorias que nao estao no cardapio impresso
    for (const nome of ['Rodizio', 'Temakis', 'Yakissoba', 'Sobremesa', 'Promocao Do Dia']) {
      const categoria = categorias.find((c) => c.nome === nome)
      expect(categoria?.ativo).toBe(false)
      expect(produtos.some((p) => p.categoriaId === categoria?.id && p.ativo)).toBe(false)
    }

    // Todo produto sai com NCM preenchido
    const semNcm = repositorioProduto
      .listarComCategoria({ apenasAtivos: false })
      .filter((p) => !p.fiscalNcm)
    expect(semNcm.map((p) => `${p.categoriaNome} | ${p.nome}`)).toEqual([])

    // Idempotente na mesma versao
    const reaplicar = aplicarCardapioJardins(conexao)
    expect(reaplicar.aplicado).toBe(false)

    // Reaplica quando forçado (ex.: versao nova do cardapio)
    const rodizio = repositorioCategoria.listar().find((c) => c.nome === 'Rodizio')
    repositorioCategoria.reativar(rodizio!.id)
    expect(repositorioCategoria.buscarPorId(rodizio!.id)?.ativo).toBe(true)

    const forcado = aplicarCardapioJardins(conexao, { forcar: true })
    expect(forcado.aplicado).toBe(true)
    expect(repositorioCategoria.buscarPorId(rodizio!.id)?.ativo).toBe(false)

    banco.encerrar()
  })
})
