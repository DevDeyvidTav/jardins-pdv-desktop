import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  encerrarBancoLocal,
  inicializarBancoLocal,
} from '../../src/main/database/inicializar-banco'

export async function prepararBancoTeste() {
  const diretorio = mkdtempSync(join(tmpdir(), 'pdv-teste-'))
  const caminhoBanco = join(diretorio, 'pdv-local.sqlite')

  await inicializarBancoLocal(caminhoBanco)

  return {
    diretorio,
    caminhoBanco,
    encerrar: () => {
      encerrarBancoLocal()
      rmSync(diretorio, { recursive: true, force: true })
    },
  }
}
