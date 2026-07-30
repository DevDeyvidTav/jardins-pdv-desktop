import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { obterInformacoesSistema } from '../../src/main/app/servico-informacoes-sistema'
import {
  encerrarBancoLocal,
  inicializarBancoLocal,
} from '../../src/main/database/inicializar-banco'
import { NOME_APLICACAO, VERSAO_APLICACAO } from '../../src/shared/types/informacoes-sistema'

describe('servico de informacoes do sistema', () => {
  let diretorioTemporario: string

  afterEach(() => {
    encerrarBancoLocal()

    if (diretorioTemporario) {
      rmSync(diretorioTemporario, { recursive: true, force: true })
    }
  })

  it('retorna metadados da fundacao com banco inicializado', async () => {
    diretorioTemporario = mkdtempSync(join(tmpdir(), 'pdv-info-'))
    const caminhoBanco = join(diretorioTemporario, 'pdv-local.sqlite')

    await inicializarBancoLocal(caminhoBanco)

    const informacoes = obterInformacoesSistema()

    expect(informacoes).toEqual({
      nomeAplicacao: NOME_APLICACAO,
      versao: VERSAO_APLICACAO,
      bancoLocalInicializado: true,
      electronAtivo: true,
    })
  })
})
