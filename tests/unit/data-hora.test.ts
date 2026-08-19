import { describe, expect, it } from 'vitest'
import { agoraEmIsoUtc, competenciaAtualUtc, competenciaDeIsoUtc } from '../../src/shared/utils/data-hora'

describe('utilitarios de data e hora', () => {
  it('retorna timestamp ISO UTC', () => {
    const valor = agoraEmIsoUtc()
    expect(valor).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  })

  it('extrai competencia mensal YYYY-MM', () => {
    expect(competenciaDeIsoUtc('2026-08-16T12:00:00.000Z')).toBe('2026-08')
    expect(competenciaAtualUtc('2026-01-01T00:00:00.000Z')).toBe('2026-01')
  })
})
