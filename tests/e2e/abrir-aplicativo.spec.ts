import { _electron as electron } from '@playwright/test'
import { test, expect } from '@playwright/test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const diretorioDesktop = join(__dirname, '../..')
const executavelMain = join(diretorioDesktop, 'out/main/index.js')

test.describe('aplicativo desktop', () => {
  test('abre a tela de abertura de caixa', async () => {
    const diretorioDados = mkdtempSync(join(tmpdir(), 'pdv-e2e-app-'))

    const aplicativo = await electron.launch({
      args: [executavelMain, `--user-data-dir=${diretorioDados}`],
      cwd: diretorioDesktop,
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    })

    try {
      const janela = await aplicativo.firstWindow()

      await expect(janela.getByTestId('pagina-abertura-caixa')).toBeVisible({
        timeout: 15_000,
      })
      await expect(janela.getByRole('heading', { name: 'Abertura de Caixa' })).toBeVisible()
      await expect(janela.getByTestId('formulario-abertura-caixa')).toBeVisible()
    } finally {
      await aplicativo.close()
      rmSync(diretorioDados, { recursive: true, force: true })
    }
  })
})
