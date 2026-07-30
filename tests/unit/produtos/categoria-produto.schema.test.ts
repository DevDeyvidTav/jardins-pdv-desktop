import { describe, expect, it } from 'vitest'
import {
  atualizarCategoriaProdutoSchema,
  criarCategoriaProdutoSchema,
  inativarCategoriaProdutoSchema,
} from '../../../src/main/modules/produtos/schemas/categoria-produto.schema'

describe('categoria-produto.schema', () => {
  it('valida criacao de categoria valida', () => {
    const resultado = criarCategoriaProdutoSchema.parse({
      nome: 'Bebidas',
      descricao: 'Bebidas em geral',
    })

    expect(resultado.nome).toBe('Bebidas')
  })

  it('impede categoria com nome vazio', () => {
    expect(() =>
      criarCategoriaProdutoSchema.parse({
        nome: '   ',
      }),
    ).toThrow()
  })

  it('valida atualizacao e inativacao', () => {
    expect(
      atualizarCategoriaProdutoSchema.parse({
        categoriaId: 'cat-1',
        nome: 'Lanches',
      }).nome,
    ).toBe('Lanches')

    expect(
      inativarCategoriaProdutoSchema.parse({
        categoriaId: 'cat-1',
      }).categoriaId,
    ).toBe('cat-1')
  })
})
