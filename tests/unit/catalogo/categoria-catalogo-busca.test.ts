import { afterEach, describe, expect, it } from 'vitest'
import {
  encerrarBancoLocal,
  inicializarBancoLocal,
} from '../../../src/main/database/inicializar-banco'
import { criarCategoriaProdutoRepository } from '../../../src/main/modules/produtos/repositories/categoria-produto.repository'
import { criarCatalogoCategoriaBuscaRepository } from '../../../src/main/modules/catalogo/repositories/catalogo-categoria-busca.repository'
import { criarBuscarCategoriasCatalogo } from '../../../src/main/modules/catalogo/use-cases/buscar-categorias-catalogo'

describe('buscar categorias catalogo (FTS5)', () => {
  afterEach(() => {
    encerrarBancoLocal()
  })

  async function setup() {
    const conexao = await inicializarBancoLocal(':memory:')
    const repositorioCategoria = criarCategoriaProdutoRepository(conexao)
    const buscar = criarBuscarCategoriasCatalogo(
      criarCatalogoCategoriaBuscaRepository(conexao),
    )

    repositorioCategoria.inserir({ nome: 'Bebidas', descricao: null })
    repositorioCategoria.inserir({ nome: 'ZZZ Unica Busca FTS', descricao: null })

    return { buscar }
  }

  it('lista categorias ativas sem termo', async () => {
    const { buscar } = await setup()
    const resultados = buscar()
    expect(resultados.length).toBeGreaterThanOrEqual(2)
    expect(resultados.some((item) => item.nome === 'Bebidas')).toBe(true)
  })

  it('filtra categorias por termo parcial', async () => {
    const { buscar } = await setup()
    const resultados = buscar({ termo: 'ZZZ Unica' })
    expect(resultados).toHaveLength(1)
    expect(resultados[0]?.nome).toBe('ZZZ Unica Busca FTS')
  })
})
