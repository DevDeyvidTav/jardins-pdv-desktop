import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { _electron as electron } from '@playwright/test'
import { test, expect, type Page } from '@playwright/test'

const diretorioDesktop = join(__dirname, '../..')
const executavelMain = join(diretorioDesktop, 'out/main/index.js')

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

async function garantirCaixaAberto(janela: Page) {
  const paginaAbertura = janela.getByTestId('pagina-abertura-caixa')

  if (await paginaAbertura.isVisible().catch(() => false)) {
    await janela.getByTestId('campo-saldo-inicial').fill('300,00')
    await janela.getByTestId('botao-abrir-caixa').click()
    await expect(janela.getByTestId('pagina-caixa-atual')).toBeVisible({
      timeout: 10_000,
    })
  }
}

async function registrarMovimento(
  janela: Page,
  tipo: 'SUPRIMENTO' | 'SANGRIA' | 'RETIRADA',
  valor: string,
  descricao?: string,
) {
  const formulario = janela.getByTestId('formulario-movimento-caixa')
  if (!(await formulario.isVisible().catch(() => false))) {
    await janela.getByTestId('botao-toggle-movimento').click()
  }

  await janela.getByTestId('campo-tipo-movimento').selectOption(tipo)
  await janela.getByTestId('campo-valor-movimento').fill(valor)

  if (descricao !== undefined) {
    await janela.getByTestId('campo-descricao-movimento').fill(descricao)
  } else {
    await janela.getByTestId('campo-descricao-movimento').fill('')
  }

  await janela.getByTestId('botao-registrar-movimento').click()
  await expect(janela.getByTestId('feedback-sucesso')).toBeVisible({
    timeout: 10_000,
  })
}

test.describe('movimentos de caixa local', () => {
  test('registra movimentos, calcula saldo e persiste apos reiniciar', async () => {
    const diretorioDados = mkdtempSync(join(tmpdir(), 'pdv-e2e-mov-'))

    try {
      const aplicativo = await abrirAplicativo(diretorioDados)
      const janela = await aplicativo.firstWindow()

      await garantirCaixaAberto(janela)

      await registrarMovimento(janela, 'SUPRIMENTO', '50,00')
      await registrarMovimento(janela, 'SANGRIA', '20,00', 'Sangria teste')
      await registrarMovimento(janela, 'RETIRADA', '10,00', 'Retirada teste')

      await expect(janela.getByTestId('item-movimento-caixa')).toHaveCount(3)
      await expect(janela.getByTestId('caixa-total-suprimentos')).toHaveText(/R\$\s*50,00/)
      await expect(janela.getByTestId('caixa-total-sangrias')).toHaveText(/R\$\s*20,00/)
      await expect(janela.getByTestId('caixa-total-retiradas')).toHaveText(/R\$\s*10,00/)
      await expect(janela.getByTestId('caixa-saldo-atual')).toHaveText(/R\$\s*320,00/)

      await aplicativo.close()

      const aplicativoReaberto = await abrirAplicativo(diretorioDados)
      const janelaReaberta = await aplicativoReaberto.firstWindow()

      await expect(janelaReaberta.getByTestId('pagina-caixa-atual')).toBeVisible({
        timeout: 15_000,
      })
      await expect(janelaReaberta.getByTestId('item-movimento-caixa')).toHaveCount(3)
      await expect(janelaReaberta.getByTestId('caixa-saldo-atual')).toHaveText(
        /R\$\s*320,00/,
      )

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
