import { describe, expect, it, vi } from 'vitest'
import {
  deveSimularImpressora,
  falhaPermiteReenvio,
  limparFilaImpressora,
  obterMensagemErroImpressora,
  obterNomeImpressoraLocal,
  removerLockImpressoraLegado,
  resolverDestinoImpressao,
  retomarImpressoraWindows,
} from '../../../src/main/modules/impressao/infraestrutura/enviar-impressora'

describe('destino da impressora', () => {
  it('simula envio em teste', () => {
    expect(deveSimularImpressora({ NODE_ENV: 'test' })).toBe(true)
    expect(resolverDestinoImpressao({ NODE_ENV: 'test' })).toEqual({ tipo: 'SIMULADO' })
  })

  it('usa spooler RAW por padrao — mesmo caminho da pagina de teste do Windows', () => {
    expect(obterNomeImpressoraLocal({})).toBe('MP-4200 TH')
    expect(resolverDestinoImpressao({})).toEqual({
      tipo: 'SPOOLER',
      nome: 'MP-4200 TH',
    })
  })

  it('so usa COM direto quando PDV_IMPRESSORA_COM=1', () => {
    expect(resolverDestinoImpressao({ PDV_IMPRESSORA_COM: '1' })).toEqual({
      tipo: 'COM',
      porta: 'COM10',
      nomeImpressora: 'MP-4200 TH',
    })
  })

  it('permite forcar outra porta COM', () => {
    expect(
      resolverDestinoImpressao({ PDV_IMPRESSORA_COM: '1', PDV_IMPRESSORA_PORTA: 'COM11' }),
    ).toEqual({
      tipo: 'COM',
      porta: 'COM11',
      nomeImpressora: 'MP-4200 TH',
    })
  })

  it('remove lock legado em arquivo ao iniciar impressao', () => {
    const remover = vi.fn()
    removerLockImpressoraLegado('/tmp/pdv-impressora.lock', remover)
    expect(remover).toHaveBeenCalledWith('/tmp/pdv-impressora.lock')
  })

  it('limpa a fila da impressora antes de novas tentativas', () => {
    const executarScript = vi.fn()
    limparFilaImpressora('MP-4200 TH', executarScript)

    expect(executarScript).toHaveBeenCalledWith(
      expect.stringContaining('pdv-impressora-com'),
      expect.objectContaining({ PrinterName: 'MP-4200 TH', Modo: 'Limpar' }),
    )
  })

  it('retoma a impressora sem pausar a fila', () => {
    const executarScript = vi.fn()
    retomarImpressoraWindows('MP-4200 TH', executarScript)

    expect(executarScript).toHaveBeenCalledWith(
      expect.stringContaining('pdv-impressora-com'),
      expect.objectContaining({ PrinterName: 'MP-4200 TH', Modo: 'Retomar' }),
    )
  })

  it('so reenvia o cupom quando a falha aconteceu antes de abrir a porta', () => {
    expect(falhaPermiteReenvio(new Error('ABERTURA: Acesso negado a COM10'))).toBe(true)
    expect(falhaPermiteReenvio(new Error('A impressora nao consumiu 120 bytes.'))).toBe(
      false,
    )
  })

  it('orienta retomar quando o Windows reporta pausada', () => {
    const mensagem = obterMensagemErroImpressora('MP-4200 TH', 'Falha', () => ({
      printerStatus: 'Paused',
      jobCount: 0,
    }))

    expect(mensagem).toContain('pausada')
  })

  it('orienta desligar a impressora quando o Windows reporta erro', () => {
    const mensagem = obterMensagemErroImpressora('MP-4200 TH', 'Write fail', () => ({
      printerStatus: 'Error',
      jobCount: 1,
    }))

    expect(mensagem).toContain('nao responde')
    expect(mensagem).toContain('Desligue-a')
  })
})
