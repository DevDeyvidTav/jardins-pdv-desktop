import { describe, expect, it } from 'vitest'
import { agoraEmIsoUtc } from '../../src/shared/utils/data-hora'

describe('utilitarios de data e hora', () => {
  it('retorna timestamp ISO UTC', () => {
    const valor = agoraEmIsoUtc()
    expect(valor).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  })
})
