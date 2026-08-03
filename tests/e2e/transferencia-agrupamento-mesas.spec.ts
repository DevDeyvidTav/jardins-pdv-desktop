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
    await expect(janela.getByTestId('formulario-categoria')).toBeVisible()
    await janela.getByTestId('campo-nome-categoria').fill('Bebidas')
    await janela.getByTestId('botao-criar-categoria').click()
    await expect(janela.getByTestId('feedback-sucesso-produtos')).toBeVisible({
      timeout: 10_000,
    })

    await janela.getByTestId('botao-toggle-produto').click()
    await expect(janela.getByTestId('formulario-produto')).toBeVisible()
    await janela.getByTestId('campo-nome-produto').fill('Coca-Cola lata')
    await janela.getByTestId('campo-preco-produto').fill('6,00')
    await janela.getByTestId('botao-criar-produto').click()
    await expect(janela.getByTestId('feedback-sucesso-produtos')).toBeVisible({
      timeout: 10_000,
    })
  }
}

async function selecionarMesaPorNumero(janela: Page, numero: number) {
  await janela.locator(`[data-testid="item-mesa"][data-mesa-numero="${numero}"]`).click()
}

test.describe('transferencia e agrupamento de mesas', () => {
  test('transfere, agrupa, finaliza e persiste historico apos reiniciar', async () => {
    const diretorioDados = mkdtempSync(join(tmpdir(), 'pdv-e2e-transf-'))

    try {
      let aplicativo = await abrirAplicativo(diretorioDados)
      let janela = await aplicativo.firstWindow()

      await garantirCaixaAberto(janela)
      await garantirProdutoAtivo(janela)

      await janela.getByTestId('nav-pedidos').click()
      await expect(janela.getByTestId('pagina-pedidos')).toBeVisible({ timeout: 15_000 })

      await janela.getByTestId('botao-cadastrar-mesas').click()
      await janela.getByTestId('campo-numero-inicial-mesa').fill('1')
      await janela.getByTestId('campo-numero-final-mesa').fill('4')
      await janela.getByTestId('botao-criar-mesas').click()
      await expect(janela.getByTestId('item-mesa')).toHaveCount(4)

      await selecionarMesaPorNumero(janela, 1)
      await janela.getByTestId('botao-abrir-mesa').click()
      await expect(janela.getByTestId('pagina-pedido-aberto')).toBeVisible({ timeout: 10_000 })

      await janela.getByTestId('botao-adicionar-item-painel').click()
      await janela.getByTestId('campo-produto-pedido').click()
      await janela.getByTestId('opcao-produto-pedido').first().click()
      await janela.getByTestId('campo-quantidade-item').fill('1')
      await janela.getByTestId('botao-adicionar-item').click()
      await expect(janela.getByTestId('pedido-total')).toHaveText(/R\$\s*6,00/)

      const totalAntes = await janela.getByTestId('pedido-total').innerText()

      await janela.getByTestId('botao-transferir-mesa').click()
      await expect(janela.getByTestId('modal-transferir-mesa')).toBeVisible()
      await janela.getByTestId('select-mesa-destino').selectOption({ label: 'Mesa 2' })
      await janela.getByTestId('confirmar-transferencia').click()

      await expect(janela.getByTestId('feedback-sucesso-pedidos')).toContainText(
        'transferido',
        { timeout: 10_000 },
      )
      await expect(janela.getByTestId('painel-mesa-numero')).toContainText('2')
      await expect(janela.getByTestId('pedido-total')).toHaveText(totalAntes)

      await janela.getByTestId('botao-agrupar-mesas').click()
      await expect(janela.getByTestId('modal-agrupar-mesas')).toBeVisible()
      await janela.getByTestId('check-mesa-agrupar-3').check()
      await janela.getByTestId('check-mesa-agrupar-4').check()
      await janela.getByTestId('confirmar-agrupamento').click()

      await expect(janela.getByTestId('selo-agrupamento')).toBeVisible({ timeout: 10_000 })
      await expect(janela.getByTestId('selo-agrupamento')).toContainText('principal')
      await expect(janela.getByTestId('item-historico-movimentacao').first()).toBeVisible()

      await janela.getByTestId('botao-abrir-pagamento').click()
      await janela.getByTestId('campo-valor-pagamento').fill('6,00')
      await janela.getByTestId('botao-confirmar-pagamento').click()

      await expect(
        janela.getByTestId('pedido-finalizado').or(janela.getByTestId('painel-mesa-vazio')),
      ).toBeVisible({ timeout: 15_000 })

      await aplicativo.close()

      aplicativo = await abrirAplicativo(diretorioDados)
      janela = await aplicativo.firstWindow()
      await garantirCaixaAberto(janela)
      await janela.getByTestId('nav-pedidos').click()
      await expect(janela.getByTestId('pagina-pedidos')).toBeVisible({ timeout: 15_000 })

      await expect(janela.getByTestId('item-mesa')).toHaveCount(4)
      await selecionarMesaPorNumero(janela, 2)
      await expect(janela.getByTestId('mesa-status')).toContainText(/Livre/i)

      await aplicativo.close()
    } finally {
      try {
        rmSync(diretorioDados, { recursive: true, force: true })
      } catch {
        // Electron pode manter lock temporario no userData durante o cleanup.
      }
    }
  })
})
