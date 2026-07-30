import { describe, expect, it } from 'vitest'
import {
  atualizarProdutoSchema,
  buscarProdutosSchema,
  criarProdutoSchema,
  inativarProdutoSchema,
} from '../../../src/main/modules/produtos/schemas/produto.schema'

describe('produto.schema', () => {
  it('valida criacao de produto valido', () => {
    const resultado = criarProdutoSchema.parse({
      categoriaId: 'cat-1',
      nome: 'Coca-Cola lata',
      descricao: '350ml',
      precoCentavos: 600,
    })

    expect(resultado.precoCentavos).toBe(600)
  })

  it('impede produto com nome vazio', () => {
    expect(() =>
      criarProdutoSchema.parse({
        categoriaId: 'cat-1',
        nome: '   ',
        precoCentavos: 600,
      }),
    ).toThrow()
  })

  it('impede produto com preco negativo', () => {
    expect(() =>
      criarProdutoSchema.parse({
        categoriaId: 'cat-1',
        nome: 'Agua',
        precoCentavos: -1,
      }),
    ).toThrow()
  })

  it('impede produto sem categoria', () => {
    expect(() =>
      criarProdutoSchema.parse({
        categoriaId: '',
        nome: 'Agua',
        precoCentavos: 300,
      }),
    ).toThrow()
  })

  it('valida busca, atualizacao e inativacao', () => {
    expect(
      buscarProdutosSchema.parse({
        termo: 'coca',
      }).termo,
    ).toBe('coca')

    expect(
      atualizarProdutoSchema.parse({
        produtoId: 'prod-1',
        precoCentavos: 700,
      }).precoCentavos,
    ).toBe(700)

    expect(
      inativarProdutoSchema.parse({
        produtoId: 'prod-1',
      }).produtoId,
    ).toBe('prod-1')
  })
})
