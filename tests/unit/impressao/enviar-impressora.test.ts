import { describe, expect, it, vi } from 'vitest'
import {
  concluirScriptImpressora,
  detectarPortaComAtual,
  deveSimularImpressora,
  extrairSaidaExecFile,
  falhaPermiteReenvio,
  limparFilaImpressora,
  normalizarPortaCom,
  obterMensagemErroImpressora,
  orientarFalhaPortaCom,
  obterNomeImpressoraLocal,
  prepararImpressoraParaEnvio,
  removerLockImpressoraLegado,
  resolverDestinoImpressao,
  resolverPortaComImpressora,
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

  it('trata bytes entregues como sucesso mesmo se o script travar depois', () => {
    expect(() => concluirScriptImpressora('WROTE:502')).not.toThrow()
    expect(() => concluirScriptImpressora('WROTE:502\nOK')).not.toThrow()
    expect(() =>
      concluirScriptImpressora(
        extrairSaidaExecFile({
          message: 'Command failed: powershell.exe -File script.ps1',
          stdout: 'WROTE:502\r\n',
          stderr: '',
        }),
      ),
    ).not.toThrow()
  })

  it('recupera FAIL:ABERTURA do stdout quando o PowerShell sai com codigo 1', () => {
    expect(
      extrairSaidaExecFile({
        message: 'Command failed: powershell.exe -File script.ps1',
        stdout: 'FAIL:ABERTURA:Acesso a porta COM12 foi negado.\r\n',
        stderr: '',
      }),
    ).toBe('FAIL:ABERTURA:Acesso a porta COM12 foi negado.')

    expect(() =>
      concluirScriptImpressora('FAIL:ABERTURA:Acesso a porta COM12 foi negado.'),
    ).toThrow('ABERTURA:Acesso a porta COM12 foi negado.')
    expect(falhaPermiteReenvio(new Error('ABERTURA:Acesso a porta COM12 foi negado.'))).toBe(
      true,
    )
  })

  it('so reenvia o cupom quando a falha aconteceu antes de abrir a porta', () => {
    expect(falhaPermiteReenvio(new Error('ABERTURA: Acesso negado a COM10'))).toBe(true)
    expect(falhaPermiteReenvio(new Error('A impressora nao consumiu 120 bytes.'))).toBe(
      false,
    )
  })

  it('orienta resetar o USB quando o Windows diz que o dispositivo nao funciona', () => {
    const mensagem = obterMensagemErroImpressora(
      'MP-4200 TH',
      'Um dispositivo conectado ao sistema nao esta funcionando.',
      () => ({ printerStatus: 'Normal', jobCount: 0 }),
      () => 'COM10',
    )

    expect(mensagem).toContain('USB')
    expect(mensagem).toContain('desconecte')
    expect(mensagem).toContain('COM10')
  })

  it('orienta retomar quando o Windows reporta pausada', () => {
    const mensagem = obterMensagemErroImpressora(
      'MP-4200 TH',
      'Falha',
      () => ({ printerStatus: 'Paused', jobCount: 0 }),
      () => null,
    )

    expect(mensagem).toContain('pausada')
  })

  it('nao bloqueia envio quando a Bematech reporta Error sem jobs presos', () => {
    const limpar = vi.fn()
    expect(() =>
      prepararImpressoraParaEnvio(
        'MP-4200 TH',
        limpar,
        vi.fn(),
        () => ({ printerStatus: 'Error', jobCount: 0 }),
      ),
    ).not.toThrow()
    expect(limpar).not.toHaveBeenCalled()
  })

  it('limpa a fila quando ha job preso e segue quando ela esvazia', () => {
    const limpar = vi.fn()
    const statusPorChamada = [
      { printerStatus: 'Paused', jobCount: 1 },
      { printerStatus: 'Normal', jobCount: 0 },
    ]

    expect(() =>
      prepararImpressoraParaEnvio(
        'MP-4200 TH',
        limpar,
        vi.fn(),
        () => statusPorChamada.shift() ?? { printerStatus: 'Normal', jobCount: 0 },
      ),
    ).not.toThrow()
    expect(limpar).toHaveBeenCalledTimes(1)
  })

  it('falha em vez de empilhar job quando a fila nao libera', () => {
    const limpar = vi.fn()

    expect(() =>
      prepararImpressoraParaEnvio(
        'MP-4200 TH',
        limpar,
        vi.fn(),
        () => ({ printerStatus: 'Error', jobCount: 1 }),
      ),
    ).toThrow('travada')
    expect(limpar).toHaveBeenCalledTimes(3)
  })

  it('detecta porta COM pelo nome da impressora no Get-Printer', () => {
    expect(
      detectarPortaComAtual('MP-4200 TH', () => 'COM12:'),
    ).toBe('COM12')
    expect(detectarPortaComAtual('Inexistente', () => '')).toBeNull()
  })

  it('prioriza porta detectada sobre a configurada', () => {
    expect(
      resolverPortaComImpressora('MP-4200 TH', 'COM10', {}, () => 'COM13'),
    ).toBe('COM13')
    expect(
      resolverPortaComImpressora('MP-4200 TH', 'COM10', {}, () => null),
    ).toBe('COM10')
    expect(normalizarPortaCom('com11:')).toBe('COM11')
  })

  it('orienta desligar a impressora quando o Windows reporta erro', () => {
    const mensagem = obterMensagemErroImpressora(
      'MP-4200 TH',
      'Write fail',
      () => ({ printerStatus: 'Error', jobCount: 1 }),
      () => null,
    )

    expect(mensagem).toContain('nao responde')
    expect(mensagem).toContain('Desligue-a')
  })
})
