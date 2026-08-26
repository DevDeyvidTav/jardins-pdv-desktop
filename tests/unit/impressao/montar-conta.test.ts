import { describe, expect, it } from 'vitest'
import { criarDocumentoContaAmostra } from '../../../src/main/modules/impressao/templates/dados-amostra'
import { formatarMoedaCupom } from '../../../src/main/modules/impressao/templates/formatar-cupom'
import { montarConta } from '../../../src/main/modules/impressao/templates/montar-conta'

describe('montarConta', () => {
  const linhas = montarConta(criarDocumentoContaAmostra())
  const texto = linhas.join('\n')

  it('identifica conta de conferencia com mesa e referencia', () => {
    expect(texto).toContain('JARDINS')
    expect(texto).toContain('CONTA')
    expect(texto).toContain('Mesa 12')
    expect(texto).toContain('#104')
    expect(texto).toContain('Nao e documento fiscal')
  })

  it('nao imprime item com valor zero', () => {
    const documento = criarDocumentoContaAmostra()
    documento.itens.push({
      quantidade: 1,
      nome: 'Brinde cortesia',
      detalhes: [],
      observacao: null,
      precoUnitarioCentavos: 0,
      totalCentavos: 0,
      setor: 'COZINHA',
      cancelado: false,
    })

    const texto = montarConta(documento).join('\n')
    expect(texto).not.toContain('Brinde cortesia')
  })

  it('imprime itens ativos com precos e omite item cancelado', () => {
    expect(texto).toContain('Pizza G')
    expect(texto).toContain('Calabresa / Mussarela')
    expect(texto).toContain('Combinado 20 pecas')
    expect(texto).toContain('sem wasabi')
    expect(texto).toContain('Yakisoba carne')
    expect(texto).toContain(formatarMoedaCupom(5500))
    expect(texto).toContain(formatarMoedaCupom(4800))
    expect(texto).toContain(formatarMoedaCupom(3200))
    expect(texto).not.toMatch(/\u00A0/)
    expect(texto).not.toContain('Refrigerante lata')
    expect(linhas.some((linha) => linha.includes('Pizza G') && linha.includes('R$ 55,00'))).toBe(
      true,
    )
  })

  it('repete o rodape financeiro do cupom da tela', () => {
    expect(texto).toContain('Subtotal')
    expect(texto).toContain(formatarMoedaCupom(13500))
    expect(texto).toContain('Desc. pedido')
    expect(texto).toContain(formatarMoedaCupom(500))
    expect(texto).toContain('TOTAL')
    expect(texto).toContain(formatarMoedaCupom(13000))
    expect(texto).toContain('Pago')
    expect(texto).toContain(formatarMoedaCupom(5000))
    expect(texto).toContain('Restante')
    expect(texto).toContain(formatarMoedaCupom(8000))
    expect(texto).toContain('Dinheiro')
  })

  it('nao imprime Restante quando e igual ao total', () => {
    const documento = criarDocumentoContaAmostra()
    documento.valorPagoCentavos = 0
    documento.pagamentos = []
    documento.valorRestanteCentavos = documento.totalCentavos

    const texto = montarConta(documento).join('\n')
    expect(texto).toContain('TOTAL')
    expect(texto).not.toContain('Restante')
  })

  it('quebra sabores da pizza abaixo e mantem o valor na linha do item', () => {
    const documento = criarDocumentoContaAmostra()
    documento.itens = [
      {
        quantidade: 1,
        nome: 'Pizza Grande',
        detalhes: ['Calabresa', 'Frango c/ Catupiry', 'Quatro Queijos'],
        observacao: null,
        precoUnitarioCentavos: 5990,
        totalCentavos: 5990,
        setor: 'PIZZA',
        cancelado: false,
      },
    ]
    documento.subtotalCentavos = 5990
    documento.descontoPedidoCentavos = 0
    documento.totalCentavos = 5990
    documento.valorPagoCentavos = 0
    documento.valorRestanteCentavos = 5990
    documento.pagamentos = []

    const linhas = montarConta(documento)
    const linhaItem = linhas.find((linha) => linha.includes('Pizza Grande'))

    expect(linhaItem).toContain('R$ 59,90')
    expect(linhas.join('\n')).toContain('Calabresa / Frango c/ Catupiry')
    expect(linhas.join('\n')).toContain('Queijos')
    expect(linhas.find((linha) => linha.includes('Calabresa'))).not.toContain('R$ 59,90')
  })

  it('nao imprime linhas do rodape ou pagamento com valor zero', () => {
    expect(texto).not.toContain('Desc. itens')
    expect(texto).not.toContain('Taxa entrega')
    expect(texto).not.toContain('Cortesia')
    expect(texto).not.toContain(formatarMoedaCupom(0))
  })
})
