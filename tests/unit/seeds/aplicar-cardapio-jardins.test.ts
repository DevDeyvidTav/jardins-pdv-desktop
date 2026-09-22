import { describe, expect, it } from 'vitest'
import { obterConexaoBancoLocal } from '../../../src/main/database/inicializar-banco'
import { aplicarCardapioJardins } from '../../../src/main/database/seeds/aplicar-cardapio-jardins'
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
})
