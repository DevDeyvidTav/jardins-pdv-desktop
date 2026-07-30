import { _electron as electron } from '@playwright/test'
import { test, expect } from '@playwright/test'
import { join } from 'node:path'

const diretorioDesktop = join(__dirname, '../..')
const executavelMain = join(diretorioDesktop, 'out/main/index.js')

test.describe('aplicativo desktop', () => {
  test('abre a tela inicial com status da fundacao', async () => {
    const aplicativo = await electron.launch({
      args: [executavelMain],
      cwd: diretorioDesktop,
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    })

    try {
      const janela = await aplicativo.firstWindow()

      await expect(janela.getByTestId('pagina-inicial')).toBeVisible({
        timeout: 15_000,
      })
      await expect(janela.getByTestId('nome-sistema')).toHaveText(
        'PDV Restaurante',
      )
      await expect(janela.getByTestId('status-banco-local')).toHaveText(
        'Inicializado',
      )
      await expect(janela.getByTestId('status-electron')).toHaveText(
        'Inicializado',
      )
    } finally {
      await aplicativo.close()
    }
  })
})
