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
      PDV_IMPRESSORA_MOCK: '1',
    },
  })
}

async function garantirCaixaAberto(janela: Page) {
  await expect(janela.getByTestId('app-carregando')).toBeHidden({ timeout: 15_000 })

  if (await janela.getByTestId('pagina-abertura-caixa').isVisible().catch(() => false)) {
    await janela.getByTestId('campo-saldo-inicial').fill('100,00')
    await janela.getByTestId('botao-abrir-caixa').click()
  }

  await expect(janela.getByTestId('pagina-caixa-atual')).toBeVisible({ timeout: 10_000 })
}

async function garantirProdutoAtivo(janela: Page) {
  await janela.getByTestId('nav-produtos').click()
  await expect(janela.getByTestId('pagina-produtos')).toBeVisible()

  if ((await janela.getByTestId('item-produto').count()) === 0) {
    await janela.getByTestId('botao-toggle-categoria').click()
    await janela.getByTestId('campo-nome-categoria').fill('Pratos')
    await janela.getByTestId('botao-criar-categoria').click()
    await expect(janela.getByTestId('feedback-sucesso-produtos')).toBeVisible({
      timeout: 10_000,
    })
    await janela.getByTestId('botao-toggle-produto').click()
    await janela.getByTestId('campo-nome-produto').fill('Yakisoba carne')
    await janela.getByTestId('campo-preco-produto').fill('6,00')
    await janela.getByTestId('botao-criar-produto').click()
    await expect(janela.getByTestId('feedback-sucesso-produtos')).toBeVisible({
      timeout: 10_000,
    })
  }
}

test.describe('impressao no pedido', () => {
  test('nao coloca botoes de amostra na toolbar', async () => {
    const diretorioDados = mkdtempSync(join(tmpdir(), 'pdv-e2e-imp-toolbar-'))

    try {
      const aplicativo = await abrirAplicativo(diretorioDados)
      const janela = await aplicativo.firstWindow()

      await garantirCaixaAberto(janela)
      await janela.getByTestId('nav-pedidos').click()
      await expect(janela.getByTestId('pagina-pedidos')).toBeVisible({ timeout: 15_000 })
      await expect(janela.getByTestId('botao-pedido-balcao')).toBeVisible()
      await expect(janela.getByTestId('botao-amostra-conta')).toHaveCount(0)
      await expect(janela.getByTestId('amostras-impressao')).toHaveCount(0)

      await aplicativo.close()
    } finally {
      try {
        rmSync(diretorioDados, { recursive: true, force: true })
      } catch {
        // lock do userData no Windows
      }
    }
  })

  test('imprime conta e comanda a partir do painel do pedido', async () => {
    const diretorioDados = mkdtempSync(join(tmpdir(), 'pdv-e2e-imp-pedido-'))

    try {
      const aplicativo = await abrirAplicativo(diretorioDados)
      const janela = await aplicativo.firstWindow()

      await garantirCaixaAberto(janela)
      await garantirProdutoAtivo(janela)

      await janela.getByTestId('nav-pedidos').click()
      await expect(janela.getByTestId('pagina-pedidos')).toBeVisible({ timeout: 15_000 })
      await janela.getByTestId('botao-cadastrar-mesas').click()
      await janela.getByTestId('campo-numero-inicial-mesa').fill('1')
      await janela.getByTestId('campo-numero-final-mesa').fill('1')
      await janela.getByTestId('botao-criar-mesas').click()
      await expect(janela.getByTestId('item-mesa')).toHaveCount(1)

      await janela.getByTestId('item-mesa').click()
      await janela.getByTestId('botao-abrir-mesa').click()
      await expect(janela.getByTestId('pagina-pedido-aberto')).toBeVisible({ timeout: 10_000 })

      await janela.getByTestId('botao-adicionar-item-painel').click()
      await janela.getByTestId('campo-categoria-produto-pedido').click()
      await janela.getByTestId('opcao-categoria-pedido').first().click()
      await janela.getByTestId('campo-produto-pedido').click()
      await janela.getByTestId('opcao-produto-pedido').first().click()
      await janela.getByTestId('botao-adicionar-item').click()
      await expect(janela.getByTestId('item-pedido')).toHaveCount(1)

      await janela.getByTestId('botao-imprimir-conta').click()
      await expect(janela.getByTestId('feedback-sucesso-impressao')).toBeVisible()

      await janela.getByTestId('botao-imprimir-comanda').click()
      await expect(janela.getByTestId('feedback-sucesso-impressao')).toBeVisible()

      await aplicativo.close()
    } finally {
      try {
        rmSync(diretorioDados, { recursive: true, force: true })
      } catch {
        // lock do userData no Windows
      }
    }
  })
})
