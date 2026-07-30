import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { _electron as electron } from '@playwright/test'
import { test, expect } from '@playwright/test'

const diretorioDesktop = join(__dirname, '../..')
const executavelMain = join(diretorioDesktop, 'out/main/index.js')

function criarDiretorioDadosTeste(): string {
  return mkdtempSync(join(tmpdir(), 'pdv-e2e-caixa-'))
}

async function abrirAplicativo(diretorioDados: string) {
  return electron.launch({
    args: [executavelMain, `--user-data-dir=${diretorioDados}`],
    cwd: diretorioDesktop,
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  })
}

test.describe('modulo de caixa local', () => {
  test('abre caixa e persiste sessao apos reiniciar o app', async () => {
    const diretorioDados = criarDiretorioDadosTeste()

    try {
      const aplicativo = await abrirAplicativo(diretorioDados)
      const janela = await aplicativo.firstWindow()

      await expect(janela.getByTestId('pagina-abertura-caixa')).toBeVisible({
        timeout: 15_000,
      })
      await expect(janela.getByRole('heading', { name: 'Abertura de Caixa' })).toBeVisible()

      await janela.getByTestId('campo-saldo-inicial').fill('300,00')
      await janela.getByTestId('botao-abrir-caixa').click()

      await expect(janela.getByTestId('resumo-caixa-aberto')).toBeVisible({
        timeout: 10_000,
      })
      await expect(janela.getByTestId('caixa-saldo-inicial')).toHaveText(/R\$\s*300,00/)

      await aplicativo.close()

      const aplicativoReaberto = await abrirAplicativo(diretorioDados)
      const janelaReaberta = await aplicativoReaberto.firstWindow()

      await expect(janelaReaberta.getByTestId('resumo-caixa-aberto')).toBeVisible({
        timeout: 15_000,
      })
      await expect(janelaReaberta.getByTestId('caixa-saldo-inicial')).toHaveText(
        'R$ 300,00',
      )
      await expect(janelaReaberta.getByTestId('formulario-abertura-caixa')).toHaveCount(0)

      await aplicativoReaberto.close()
    } finally {
      rmSync(diretorioDados, { recursive: true, force: true })
    }
  })
})
