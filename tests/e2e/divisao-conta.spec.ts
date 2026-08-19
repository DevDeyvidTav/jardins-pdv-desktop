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

async function adicionarItemQuantidade(janela: Page, quantidade: string) {
  await janela.getByTestId('botao-adicionar-item-painel').click()
  await janela.getByTestId('campo-produto-pedido').click()
  await janela.getByTestId('opcao-produto-pedido').first().click()
  await janela.getByTestId('campo-quantidade-item').fill(quantidade)
  await janela.getByTestId('botao-adicionar-item').click()
}

test.describe('divisao de conta', () => {
  test('divide conta, quita partes, persiste e cancela outra divisao', async () => {
    const diretorioDados = mkdtempSync(join(tmpdir(), 'pdv-e2e-divisao-'))

    try {
      let aplicativo = await abrirAplicativo(diretorioDados)
      let janela = await aplicativo.firstWindow()

      await garantirCaixaAberto(janela)
      await garantirProdutoAtivo(janela)

      await janela.getByTestId('nav-pedidos').click()
      await expect(janela.getByTestId('pagina-pedidos')).toBeVisible({ timeout: 15_000 })

      await janela.getByTestId('botao-cadastrar-mesas').click()
      await janela.getByTestId('campo-numero-inicial-mesa').fill('1')
      await janela.getByTestId('campo-numero-final-mesa').fill('2')
      await janela.getByTestId('botao-criar-mesas').click()
      await expect(janela.getByTestId('item-mesa')).toHaveCount(2)

      await selecionarMesaPorNumero(janela, 1)
      await janela.getByTestId('botao-abrir-mesa').click()
      await expect(janela.getByTestId('pagina-pedido-aberto')).toBeVisible({ timeout: 10_000 })

      // 3 x R$ 6,00 = R$ 18,00
      await adicionarItemQuantidade(janela, '3')
      await expect(janela.getByTestId('pedido-total')).toHaveText(/R\$\s*18,00/)

      await janela.getByTestId('botao-dividir-conta').click()
      await expect(janela.getByTestId('modal-dividir-conta')).toBeVisible()

      await janela.getByTestId('campo-identificacao-parte-0').fill('Joao')
      await janela.getByTestId('campo-valor-parte-0').fill('6,00')
      await janela.getByTestId('campo-identificacao-parte-1').fill('Maria')
      await janela.getByTestId('campo-valor-parte-1').fill('6,00')
      await janela.getByTestId('botao-adicionar-parte').click()
      await janela.getByTestId('campo-identificacao-parte-2').fill('Pedro')
      await janela.getByTestId('campo-valor-parte-2').fill('6,00')

      await expect(janela.getByTestId('diferenca-distribuicao-divisao')).toContainText('0,00')
      await janela.getByTestId('botao-confirmar-divisao').click()
      await janela.getByTestId('botao-confirmar-divisao').click()

      await expect(janela.getByTestId('painel-divisao-conta')).toBeVisible({ timeout: 10_000 })
      await expect(janela.getByTestId('status-divisao-conta')).toHaveText('Ativa')
      await expect(janela.getByTestId('botao-abrir-pagamento')).toHaveCount(0)

      const botoesParte = janela.locator('[data-testid^="botao-selecionar-parte-"]')
      await expect(botoesParte).toHaveCount(3)

      const parte1Id = (await botoesParte.nth(0).getAttribute('data-testid'))!.replace(
        'botao-selecionar-parte-',
        '',
      )
      await janela.getByTestId(`botao-selecionar-parte-${parte1Id}`).click()
      await janela.getByTestId('campo-valor-pagamento').fill('3,00')
      await janela.getByTestId('campo-forma-pagamento').selectOption('PIX_MAQUINETA')
      await janela.getByTestId('botao-confirmar-pagamento').click()
      await expect(janela.getByTestId(`status-parte-${parte1Id}`)).toContainText(/Parcial/i)

      await janela.getByTestId(`botao-selecionar-parte-${parte1Id}`).click()
      await janela.getByTestId('campo-valor-pagamento').fill('3,00')
      await janela.getByTestId('campo-forma-pagamento').selectOption('CARTAO_CREDITO')
      await janela.getByTestId('botao-confirmar-pagamento').click()
      await expect(janela.getByTestId(`status-parte-${parte1Id}`)).toContainText(/Quitada/i)

      const parte2Id = (await botoesParte.nth(1).getAttribute('data-testid'))!.replace(
        'botao-selecionar-parte-',
        '',
      )
      await janela.getByTestId(`botao-selecionar-parte-${parte2Id}`).click()
      await janela.getByTestId('campo-valor-pagamento').fill('6,00')
      await janela.getByTestId('campo-forma-pagamento').selectOption('DINHEIRO')
      await janela.getByTestId('botao-confirmar-pagamento').click()
      await expect(janela.getByTestId(`status-parte-${parte2Id}`)).toContainText(/Quitada/i)

      const parte3Id = (await botoesParte.nth(2).getAttribute('data-testid'))!.replace(
        'botao-selecionar-parte-',
        '',
      )
      await janela.getByTestId(`botao-selecionar-parte-${parte3Id}`).click()
      await janela.getByTestId('campo-valor-pagamento').fill('6,00')
      await janela.getByTestId('campo-forma-pagamento').selectOption('CORTESIA')
      await janela.getByTestId('campo-motivo-cortesia').fill('Cortesia e2e')
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

      await selecionarMesaPorNumero(janela, 1)
      await expect(janela.getByTestId('mesa-status')).toContainText(/Livre/i)

      await selecionarMesaPorNumero(janela, 2)
      await janela.getByTestId('botao-abrir-mesa').click()
      await expect(janela.getByTestId('pagina-pedido-aberto')).toBeVisible({ timeout: 10_000 })
      await adicionarItemQuantidade(janela, '2')
      await expect(janela.getByTestId('pedido-total')).toHaveText(/R\$\s*12,00/)

      await janela.getByTestId('botao-dividir-conta').click()
      await janela.getByTestId('campo-identificacao-parte-0').fill('Ana')
      await janela.getByTestId('campo-valor-parte-0').fill('6,00')
      await janela.getByTestId('campo-identificacao-parte-1').fill('Bruno')
      await janela.getByTestId('campo-valor-parte-1').fill('6,00')
      await janela.getByTestId('botao-confirmar-divisao').click()
      await janela.getByTestId('botao-confirmar-divisao').click()
      await expect(janela.getByTestId('painel-divisao-conta')).toBeVisible({ timeout: 10_000 })
      await expect(janela.getByTestId('status-divisao-conta')).toHaveText('Ativa')

      await janela.getByTestId('botao-cancelar-divisao').click()
      await expect(janela.getByTestId('botao-abrir-pagamento')).toBeVisible({ timeout: 10_000 })
      await expect(janela.getByTestId('botao-dividir-conta')).toHaveCount(0)

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
