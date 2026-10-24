import { describe, expect, it } from 'vitest'
import {
  formatarEnderecoImpressora,
  normalizarEnderecoImpressora,
} from '../../../src/shared/utils/endereco-impressora'

describe('endereco de impressora na rede', () => {
  it('aceita IPv4 e usa a porta 9100', () => {
    expect(normalizarEnderecoImpressora(' 10.0.70.11 ')).toEqual({
      host: '10.0.70.11',
      porta: 9100,
    })
    expect(normalizarEnderecoImpressora('10.0.70.11:9101')).toEqual({
      host: '10.0.70.11',
      porta: 9101,
    })
  })

  it('rejeita texto que nao e IP', () => {
    expect(normalizarEnderecoImpressora('COM3')).toBeNull()
    expect(normalizarEnderecoImpressora('10.0.70.300')).toBeNull()
    expect(normalizarEnderecoImpressora('')).toBeNull()
  })

  it('omite a porta padrao ao gravar', () => {
    expect(formatarEnderecoImpressora({ host: '10.0.70.11', porta: 9100 })).toBe('10.0.70.11')
    expect(formatarEnderecoImpressora({ host: '10.0.70.11', porta: 9101 })).toBe(
      '10.0.70.11:9101',
    )
  })
})