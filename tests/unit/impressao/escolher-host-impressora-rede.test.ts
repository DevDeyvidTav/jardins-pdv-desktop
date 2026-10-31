import { describe, expect, it } from 'vitest'
import {
  escolherHostImpressoraRede,
  interpretarTabelaArp,
} from '../../../src/main/modules/impressao/infraestrutura/escolher-host-impressora-rede'
import { normalizarMacImpressora } from '../../../src/shared/utils/endereco-impressora'

const MAC_PIZZA = '00-1A-2B-3C-4D-5E'

describe('impressora de rede com IP instavel', () => {
  it('le o MAC da tabela ARP do Windows', () => {
    const arp = `
Interface: 10.0.70.182 --- 0xc
  10.0.70.11            00-1a-2b-3c-4d-5e     dynamic
  10.0.70.255           ff-ff-ff-ff-ff-ff     static
`
    expect(interpretarTabelaArp(arp)).toEqual([{ host: '10.0.70.11', mac: MAC_PIZZA }])
    expect(normalizarMacImpressora('00:1a:2b:3c:4d:5e')).toBe(MAC_PIZZA)
  })

  it('segue o MAC quando o roteador troca o IP', () => {
    expect(
      escolherHostImpressoraRede({
        hostSalvo: '10.0.70.11',
        macSalva: MAC_PIZZA,
        arp: [{ host: '10.0.70.40', mac: MAC_PIZZA }],
        encontradas: null,
      }),
    ).toEqual({ host: '10.0.70.40', mac: MAC_PIZZA })
  })

  it('depois da varredura escolhe o aparelho memorizado', () => {
    expect(
      escolherHostImpressoraRede({
        hostSalvo: '10.0.70.11',
        macSalva: MAC_PIZZA,
        arp: [],
        encontradas: [
          { host: '10.0.70.21', mac: 'AA-BB-CC-DD-EE-01' },
          { host: '10.0.70.40', mac: MAC_PIZZA },
        ],
      }),
    ).toEqual({ host: '10.0.70.40', mac: MAC_PIZZA })
  })

  it('sem MAC memorizado usa a unica impressora encontrada', () => {
    expect(
      escolherHostImpressoraRede({
        hostSalvo: '10.0.70.11',
        macSalva: null,
        arp: [],
        encontradas: [{ host: '10.0.70.40', mac: MAC_PIZZA }],
      }),
    ).toEqual({ host: '10.0.70.40', mac: MAC_PIZZA })
  })

  it('nao chuta entre duas impressoras sem MAC', () => {
    expect(
      escolherHostImpressoraRede({
        hostSalvo: '10.0.70.11',
        macSalva: null,
        arp: [],
        encontradas: [
          { host: '10.0.70.40', mac: MAC_PIZZA },
          { host: '10.0.70.41', mac: 'AA-BB-CC-DD-EE-02' },
        ],
      }),
    ).toBeNull()
  })
})
