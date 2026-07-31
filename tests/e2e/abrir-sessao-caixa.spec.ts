import { _electron as electron } from '@playwright/test'
import { test, expect } from '@playwright/test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const diretorioDesktop = join(__dirname, '../..')
const executavelMain = join(diretorioDesktop, 'out/main/index.js')

test.describe('sessao de caixa local', () => {
  test('abre caixa e persiste sessao apos reiniciar o app', async () => {
    const diretorioDados = mkdtempSync(join(tmpdir(), 'pdv-e2e-caixa-'))

    try {
      const aplicativo = await electron.launch({
        args: [executavelMain, `--user-data-dir=${diretorioDados}`],
        cwd: diretorioDesktop,
        env: {
          ...process.env,
          NODE_ENV: 'test',
        },
      })

      const janela = await aplicativo.firstWindow()

      await expect(janela.getByTestId('pagina-abertura-caixa')).toBeVisible({
        timeout: 15_000,
      })

      await janela.getByTestId('campo-saldo-inicial').fill('300,00')
      await janela.getByTestId('botao-abrir-caixa').click()

      await expect(janela.getByTestId('pagina-caixa-atual')).toBeVisible({
        timeout: 10_000,
      })
      await expect(janela.getByTestId('caixa-saldo-inicial')).toHaveText(/R\$\s*300,00/)

      await aplicativo.close()

      const aplicativoReaberto = await electron.launch({
        args: [executavelMain, `--user-data-dir=${diretorioDados}`],
        cwd: diretorioDesktop,
        env: {
          ...process.env,
          NODE_ENV: 'test',
        },
      })

      const janelaReaberta = await aplicativoReaberto.firstWindow()

      await expect(janelaReaberta.getByTestId('pagina-caixa-atual')).toBeVisible({
        timeout: 15_000,
      })
      await expect(janelaReaberta.getByTestId('caixa-saldo-inicial')).toHaveText(
        /R\$\s*300,00/,
      )
      await expect(janelaReaberta.getByTestId('formulario-abertura-caixa')).toHaveCount(0)

      await aplicativoReaberto.close()
    } finally {
      try {
        rmSync(diretorioDados, { recursive: true, force: true })
      } catch {
        // Electron pode manter lock temporario no userData durante o cleanup.
      }
    }
  })
})
