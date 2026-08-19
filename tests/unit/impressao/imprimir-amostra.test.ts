import { describe, expect, it, vi } from 'vitest'
import { SETOR_COZINHA, TIPO_DOCUMENTO_IMPRESSAO } from '../../../src/shared/types/impressao'
import { criarImprimirAmostra } from '../../../src/main/modules/impressao/use-cases/imprimir-amostra'
import { CODIGOS_ERRO_IMPRESSAO } from '../../../src/main/modules/impressao/errors/erros-impressao'

describe('imprimirAmostra', () => {
  it('monta conta e marca impresso quando o envio funciona', () => {
    const enviar = vi.fn()
    const imprimir = criarImprimirAmostra(enviar)

    const resultado = imprimir({ tipo: TIPO_DOCUMENTO_IMPRESSAO.CONTA })

    expect(enviar).toHaveBeenCalledOnce()
    expect(resultado.impresso).toBe(true)
    expect(resultado.aviso).toBeNull()
    expect(resultado.texto).toContain('CONTA')
    expect(resultado.texto).toContain('Nao e documento fiscal')
  })

  it('monta comanda mesmo se a impressora falhar', () => {
    const enviar = vi.fn(() => {
      throw new Error('COM10 ocupada')
    })
    const imprimir = criarImprimirAmostra(enviar)

    const resultado = imprimir({
      tipo: TIPO_DOCUMENTO_IMPRESSAO.COMANDA,
      setor: SETOR_COZINHA.PIZZA,
    })

    expect(resultado.impresso).toBe(false)
    expect(resultado.aviso).toBe('COM10 ocupada')
    expect(resultado.texto).toContain('PIZZA')
    expect(resultado.texto).not.toMatch(/R\$/)
  })

  it('recusa comanda sem setor', () => {
    const imprimir = criarImprimirAmostra(vi.fn())

    try {
      imprimir({ tipo: TIPO_DOCUMENTO_IMPRESSAO.COMANDA })
      throw new Error('deveria ter falhado')
    } catch (erro) {
      expect(erro).toMatchObject({ codigo: CODIGOS_ERRO_IMPRESSAO.SETOR_OBRIGATORIO })
    }
  })
})
