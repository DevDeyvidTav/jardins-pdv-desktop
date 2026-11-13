import { describe, expect, it } from 'vitest'
import {
  cnpjEhValido,
  cpfEhValido,
  formatarCpf,
  mascararCpfCnpj,
  normalizarCpf,
} from '../../../src/shared/utils/cpf'

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

  it('mascara CPF ate 11 digitos e CNPJ a partir do 12', () => {
    expect(mascararCpfCnpj('529982247')).toBe('529.982.247')
    expect(mascararCpfCnpj('52998224725')).toBe('529.982.247-25')
    expect(mascararCpfCnpj('529982247251')).toBe('52.998.224/7251')
    expect(mascararCpfCnpj('11.222.333/0001-81')).toBe('11.222.333/0001-81')
  })

  it('valida CNPJ conhecido', () => {
    expect(cnpjEhValido('11.222.333/0001-81')).toBe(true)
    expect(cnpjEhValido('11222333000181')).toBe(true)
    expect(cnpjEhValido('11111111111111')).toBe(false)
  })
})
