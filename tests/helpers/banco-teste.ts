import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  encerrarBancoLocal,
  inicializarBancoLocal,
} from '../../src/main/database/inicializar-banco'
import { definirDiretorioBackupParaTestes } from '../../src/main/database/backup-banco'
import { definirDiretorioLogsParaTestes } from '../../src/main/logging/logger'

export async function prepararBancoTeste() {
  const diretorio = mkdtempSync(join(tmpdir(), 'pdv-teste-'))
  const caminhoBanco = join(diretorio, 'pdv-local.sqlite')

  definirDiretorioBackupParaTestes(join(diretorio, 'backups'))
  definirDiretorioLogsParaTestes(join(diretorio, 'logs'))

  await inicializarBancoLocal(caminhoBanco)

  return {
    diretorio,
    caminhoBanco,
    encerrar: () => {
      encerrarBancoLocal()
      definirDiretorioBackupParaTestes(null)
      definirDiretorioLogsParaTestes(null)
      rmSync(diretorio, { recursive: true, force: true })
    },
  }
}
