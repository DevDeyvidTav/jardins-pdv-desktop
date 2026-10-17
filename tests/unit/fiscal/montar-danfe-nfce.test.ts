import { describe, expect, it } from 'vitest'
import {
  conteudoQrDanfe,
  formatarChaveAcesso,
  formatarCnpj,
  formatarNumeroNfce,
  mapearItensPedidoParaDanfe,
  montarDanfeNfce,
} from '../../../src/main/modules/impressao/templates/montar-danfe-nfce'
import type { PedidoItem } from '../../../src/shared/types/pedido'

describe('montarDanfeNfce', () => {
  const chave = '35200914200166000187550020462799281000000010'

  it('monta DANFE no formato auxiliar de NFC-e', () => {
    const linhas = montarDanfeNfce({
      emitente: {
        nome: 'Jardins',
        cnpj: '50681762000179',
        ie: '123456789',
        endereco: 'Rua das Flores, 100',
        municipio: 'Porto Alegre',
        uf: 'RS',
        ambiente: 'HOMOLOGACAO',
        urlConsulta: 'www.sefaz.rs.gov.br/nfce/consulta',
      },
      itens: [
        {
          codigo: '001',
          descricao: 'COCA COLA 2L',
          quantidade: 1,
          unidade: 'UN',
          unitarioCentavos: 800,
          totalCentavos: 800,
        },
      ],
      pagamentos: [{ forma: 'CARTAO DE CREDITO', valorCentavos: 800 }],
      cpfDestinatario: '52998224725',
      valorTotalCentavos: 800,
      numero: 12,
      serie: 1,
      chaveAcesso: chave,
      protocoloAutorizacao: '135200000000000',
      autorizadoEm: '2026-09-07T20:16:45.000Z',
    })

    const texto = linhas.join('\n')
    expect(texto).toContain('JARDINS')
    expect(texto).toContain('50.681.762/0001-79')
    expect(texto).toContain('DOCUMENTO AUXILIAR DA NOTA FISCAL')
    expect(texto).toContain('AMBIENTE DE')
    expect(texto).toContain('HOMOLOGACAO')
    expect(texto).toContain('SEM VALOR FISCAL')
    expect(texto).not.toMatch(/9999\s+NOTA FISCAL/)
    expect(texto).not.toContain('1,0000 UN x 0,00')
    expect(texto).toMatch(/QTD\. TOTAL DE ITENS\s+1/)
    expect(texto).toContain('COCA COLA 2L')
    expect(texto).toContain('CARTAO DE CREDITO')
    expect(texto).toContain('VALOR TOTAL R$')
    expect(texto).toContain('Via Consumidor')
    expect(texto).toContain('NFC-e n. 000000012 Serie 001')
    expect(texto).toContain('529.982.247-25')
    expect(texto).toContain('PROTOCOLO DE AUTORIZACAO')
    expect(linhas).toContain('{QR}')
    expect(formatarChaveAcesso(chave).join('').replace(/\s/g, '')).toBe(chave)
    expect(formatarCnpj('50681762000179')).toBe('50.681.762/0001-79')
    expect(formatarNumeroNfce(18080, 1)).toBe('NFC-e n. 000018080 Serie 001')
  })

  it('indica consumidor nao identificado e prefere URL do QR da Focus', () => {
    const linhas = montarDanfeNfce({
      valorTotalCentavos: 1000,
      numero: 1,
      serie: 1,
      chaveAcesso: chave,
      protocoloAutorizacao: '1',
    })

    expect(linhas.join('\n')).toContain('CONSUMIDOR NAO IDENTIFICADO')
    expect(
      conteudoQrDanfe({
        chaveAcesso: chave,
        qrCode: 'https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx?p=1',
      }),
    ).toBe('https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx?p=1')
    expect(conteudoQrDanfe({ chaveAcesso: chave, qrCode: null })).toBe(chave)
  })

  it('expande pizza em uma linha por sabor na DANFE', () => {
    const agora = '2026-10-17T12:00:00.000Z'
    const item: PedidoItem = {
      id: 'item-1',
      pedidoId: 'ped-1',
      produtoId: null,
      tipo: 'PIZZA',
      produtoNome: '1/2 Calabresa G + 1/2 Matuta G',
      quantidade: 1,
      precoUnitarioCentavos: 5500,
      subtotalCentavos: 5500,
      descontoCentavos: 0,
      totalCentavos: 5500,
      observacao: null,
      criadoEm: agora,
      atualizadoEm: agora,
      canceladoEm: null,
      motivoCancelamento: null,
      fiscalNcm: '19059090',
      fiscalCfop: '5102',
      fiscalIcmsOrigem: 0,
      fiscalIcmsCsosn: '102',
      fiscalPisCst: '07',
      fiscalCofinsCst: '07',
      pizza: {
        id: 'ppi-1',
        pedidoItemId: 'item-1',
        pizzaCategoriaId: 'pc-1',
        pizzaTamanhoId: 'tam-g',
        regraPrecificacaoSnapshot: 'MAIOR_SABOR',
        valorCalculadoCentavos: 5500,
        observacao: null,
        categoriaNomeSnapshot: 'Tradicional',
        tamanhoNomeSnapshot: 'Grande',
        sabores: [
          {
            id: 's1',
            pizzaSaborId: 'ps-1',
            saborNomeSnapshot: 'Calabresa',
            valorSaborSnapshotCentavos: 5000,
            ordem: 1,
          },
          {
            id: 's2',
            pizzaSaborId: 'ps-2',
            saborNomeSnapshot: 'Matuta',
            valorSaborSnapshotCentavos: 5500,
            ordem: 2,
          },
        ],
      },
    }

    const itens = mapearItensPedidoParaDanfe([item])
    expect(itens).toEqual([
      expect.objectContaining({
        codigo: '001',
        descricao: '1/2 CALABRESA G',
        unitarioCentavos: 2619,
        totalCentavos: 2619,
      }),
      expect.objectContaining({
        codigo: '002',
        descricao: '1/2 MATUTA G',
        unitarioCentavos: 2881,
        totalCentavos: 2881,
      }),
    ])
  })
})
