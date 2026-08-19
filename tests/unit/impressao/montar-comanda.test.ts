import { describe, expect, it } from 'vitest'
import { SETOR_COZINHA } from '../../../src/shared/types/impressao'
import { criarDocumentoComandaAmostra } from '../../../src/main/modules/impressao/templates/dados-amostra'
import { montarComanda } from '../../../src/main/modules/impressao/templates/montar-comanda'

describe('montarComanda', () => {
  it('imprime comanda de pizza sem precos e com setor no cabecalho', () => {
    const texto = montarComanda(criarDocumentoComandaAmostra(SETOR_COZINHA.PIZZA)).join(
      '\n',
    )

    expect(texto).toContain('PIZZA')
    expect(texto).toContain('Mesa 12')
    expect(texto).toContain('#104')
    expect(texto).toContain('PIZZA G')
    expect(texto).toContain('Calabresa')
    expect(texto).toContain('Mussarela')
    expect(texto).toContain('** sem cebola **')
    expect(texto).toContain('COMANDA')
    expect(texto).toContain('1a via')
    expect(texto).not.toMatch(/R\$/)
    expect(texto).not.toContain('Yakisoba')
    expect(texto).not.toContain('Combinado')
  })

  it('imprime comanda japonesa so com itens do setor', () => {
    const texto = montarComanda(
      criarDocumentoComandaAmostra(SETOR_COZINHA.JAPONESA),
    ).join('\n')

    expect(texto).toContain('JAPONESA')
    expect(texto).toContain('COMBINADO 20 PECAS')
    expect(texto).toContain('** sem wasabi **')
    expect(texto).not.toMatch(/R\$/)
    expect(texto).not.toContain('Pizza')
    expect(texto).not.toContain('Yakisoba')
  })

  it('imprime comanda chinesa e omite item cancelado', () => {
    const texto = montarComanda(
      criarDocumentoComandaAmostra(SETOR_COZINHA.CHINESA),
    ).join('\n')

    expect(texto).toContain('CHINESA')
    expect(texto).toContain('YAKISOBA CARNE')
    expect(texto).not.toContain('Refrigerante')
    expect(texto).not.toMatch(/R\$/)
  })
})
