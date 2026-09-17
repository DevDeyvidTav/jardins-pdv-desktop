import { describe, expect, it } from 'vitest'
import { cpfEhValido, formatarCpf, normalizarCpf } from '../../../src/shared/utils/cpf'

describe('cpf', () => {
  it('valida CPF conhecido', () => {
    expect(cpfEhValido('529.982.247-25')).toBe(true)
    expect(cpfEhValido('52998224725')).toBe(true)
  })

  it('rejeita sequencia repetida e tamanho errado', () => {
    expect(cpfEhValido('11111111111')).toBe(false)
    expect(cpfEhValido('123')).toBe(false)
  })

  it('normaliza e formata', () => {
    expect(normalizarCpf('529.982.247-25')).toBe('52998224725')
    expect(formatarCpf('52998224725')).toBe('529.982.247-25')
  })
})
