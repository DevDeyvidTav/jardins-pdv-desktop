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
  await expect(janela.getByTestId('app-carregando')).toBeHidden({ timeout: 15_000 })

  const paginaAbertura = janela.getByTestId('pagina-abertura-caixa')
  const paginaCaixaAtual = janela.getByTestId('pagina-caixa-atual')

  if (await paginaAbertura.isVisible().catch(() => false)) {
    await janela.getByTestId('campo-saldo-inicial').fill('300,00')
    await janela.getByTestId('botao-abrir-caixa').click()
  }

  await expect(paginaCaixaAtual).toBeVisible({ timeout: 10_000 })
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

test.describe('fechamento de caixa local', () => {
  test('fecha caixa, bloqueia movimentos e persiste apos reiniciar', async () => {
    const diretorioDados = mkdtempSync(join(tmpdir(), 'pdv-e2e-fech-'))

    try {
      const aplicativo = await abrirAplicativo(diretorioDados)
      const janela = await aplicativo.firstWindow()

      await garantirCaixaAberto(janela)
      await registrarMovimento(janela, 'SUPRIMENTO', '50,00')
      await registrarMovimento(janela, 'SANGRIA', '20,00', 'Sangria teste')

      await janela.getByTestId('botao-ir-fechamento').click()
      await expect(janela.getByTestId('pagina-fechamento-caixa')).toBeVisible()
      await expect(janela.getByTestId('caixa-saldo-atual')).toHaveText(/R\$\s*330,00/)

      await janela.getByTestId('campo-valor-contado').fill('325,00')
      await janela.getByTestId('campo-observacao-fechamento').fill('Fechamento E2E')
      await expect(janela.getByTestId('preview-diferenca')).toHaveText(/-R\$\s*5,00/)
      await janela.getByTestId('botao-fechar-caixa').click()

      await expect(janela.getByTestId('pagina-pos-fechamento')).toBeVisible({
        timeout: 10_000,
      })
      await expect(janela.getByTestId('fechamento-saldo-esperado')).toHaveText(/R\$\s*330,00/)
      await expect(janela.getByTestId('fechamento-valor-contado')).toHaveText(/R\$\s*325,00/)
      await expect(janela.getByTestId('fechamento-diferenca')).toHaveText(/-R\$\s*5,00/)
      await expect(janela.getByTestId('formulario-movimento-caixa')).toHaveCount(0)

      await aplicativo.close()

      const aplicativoReaberto = await abrirAplicativo(diretorioDados)
      const janelaReaberta = await aplicativoReaberto.firstWindow()

      await expect(janelaReaberta.getByTestId('pagina-pos-fechamento')).toBeVisible({
        timeout: 15_000,
      })
      await expect(janelaReaberta.getByTestId('fechamento-diferenca')).toHaveText(/-R\$\s*5,00/)
      await expect(janelaReaberta.getByTestId('formulario-movimento-caixa')).toHaveCount(0)

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
