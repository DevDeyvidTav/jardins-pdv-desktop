import { describe, expect, it } from 'vitest'
import { montarConsultaFts } from '../../../src/shared/utils/fts-consulta'

describe('montarConsultaFts', () => {
  it('retorna null para termo vazio', () => {
    expect(montarConsultaFts('')).toBeNull()
    expect(montarConsultaFts('   ')).toBeNull()
  })

  it('monta consulta com prefixo por token', () => {
    expect(montarConsultaFts('a la')).toBe('"a"* AND "la"*')
  })

  it('escapa aspas duplas', () => {
    expect(montarConsultaFts('combo "dia"')).toBe('"combo"* AND """dia"""*')
  })
})
