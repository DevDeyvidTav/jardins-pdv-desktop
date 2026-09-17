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

test.describe('clientes, talão e delivery opcional', () => {
  test('cadastra cliente com talão, lanca pedido e registra baixa parcial no caixa', async () => {
    const diretorioDados = mkdtempSync(join(tmpdir(), 'pdv-e2e-talao-'))

    try {
      const aplicativo = await abrirAplicativo(diretorioDados)
      const janela = await aplicativo.firstWindow()

      await garantirCaixaAberto(janela)
      await garantirProdutoAtivo(janela)

      await janela.getByTestId('nav-clientes').click()
      await expect(janela.getByTestId('pagina-clientes')).toBeVisible({ timeout: 10_000 })

      await janela.getByTestId('campo-nome-cliente').fill('Cliente Talao')
      await janela.getByTestId('campo-telefone-cliente').fill('81999990000')
      await janela.getByTestId('campo-libera-talao').check()
      await janela.getByTestId('botao-salvar-cliente').click()
      await expect(janela.getByTestId('feedback-sucesso-clientes')).toBeVisible({
        timeout: 10_000,
      })
      await expect(janela.getByTestId('item-cliente')).toContainText('Cliente Talao')

      await janela.getByTestId('nav-pedidos').click()
      await expect(janela.getByTestId('pagina-pedidos')).toBeVisible({ timeout: 15_000 })

      await janela.getByTestId('botao-cadastrar-mesas').click()
      await janela.getByTestId('campo-numero-inicial-mesa').fill('21')
      await janela.getByTestId('campo-numero-final-mesa').fill('21')
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
      await janela.getByTestId('campo-quantidade-item').fill('1')
      await janela.getByTestId('botao-adicionar-item').click()
      await expect(janela.getByTestId('pedido-total')).toHaveText(/R\$\s*6,00/)

      await janela.getByTestId('select-cliente-pedido').selectOption({ index: 1 })
      await expect(janela.getByTestId('feedback-sucesso-pedidos')).toContainText(
        'Cliente vinculado',
        { timeout: 10_000 },
      )

      await janela.getByTestId('botao-abrir-pagamento').click()
      await expect(janela.getByTestId('campo-forma-pagamento')).toContainText('Talão')
      await janela.getByTestId('campo-forma-pagamento').selectOption('TALAO')
      await janela.getByTestId('campo-valor-pagamento').fill('6,00')
      await janela.getByTestId('botao-confirmar-pagamento').click()
      await expect(janela.getByTestId('modal-pagamento')).toBeHidden({ timeout: 10_000 })
      await expect(janela.getByTestId('feedback-sucesso-pedidos')).toContainText(
        /finalizado/i,
        { timeout: 10_000 },
      )

      await janela.getByTestId('nav-clientes').click()
      await expect(janela.getByTestId('pagina-clientes')).toBeVisible()
      await janela.getByTestId('item-cliente').click()
      await expect(janela.getByTestId('talao-saldo')).toHaveText(/R\$\s*6,00/, { timeout: 10_000 })
      await expect(janela.getByTestId('talao-total-lancado')).toHaveText(/R\$\s*6,00/)

      await janela.getByTestId('campo-forma-baixa-talao').selectOption('DINHEIRO')
      await janela.getByTestId('campo-valor-baixa-talao').fill('3,00')
      await janela.getByTestId('botao-registrar-baixa-talao').click()
      await expect(janela.getByTestId('feedback-sucesso-clientes')).toContainText('Baixa', {
        timeout: 10_000,
      })
      await expect(janela.getByTestId('talao-saldo')).toHaveText(/R\$\s*3,00/)
      await expect(janela.getByTestId('talao-total-baixado')).toHaveText(/R\$\s*3,00/)

      // Mes sem movimento fica zerado
      await janela.getByTestId('campo-competencia-talao').fill('2020-01')
      await expect(janela.getByTestId('talao-saldo')).toHaveText(/R\$\s*0,00/, {
        timeout: 10_000,
      })

      // Visao consolidada de todos os meses mostra o saldo e esconde a baixa
      await janela.getByTestId('campo-todos-meses-talao').check()
      await expect(janela.getByTestId('talao-saldo')).toHaveText(/R\$\s*3,00/, {
        timeout: 10_000,
      })
      await expect(janela.getByTestId('talao-total-lancado')).toHaveText(/R\$\s*6,00/)
      await expect(janela.getByTestId('formulario-baixa-talao')).toBeHidden()
      await expect(janela.getByTestId('aviso-baixa-todos-meses')).toBeVisible()
      await expect(janela.getByTestId('campo-competencia-talao')).toBeDisabled()

      // Volta para a visao mensal
      await janela.getByTestId('campo-todos-meses-talao').uncheck()
      await expect(janela.getByTestId('formulario-baixa-talao')).toBeVisible()

      await janela.getByTestId('nav-caixa').click()
      await expect(janela.getByTestId('pagina-caixa-atual')).toBeVisible({ timeout: 10_000 })
      await janela.getByTestId('caixa-vendas-talao').scrollIntoViewIfNeeded()
      await expect(janela.getByTestId('caixa-vendas-talao')).toHaveText(/R\$\s*6,00/)
      await expect(janela.getByTestId('caixa-recebimento-talao')).toHaveText(/R\$\s*3,00/)
      await expect(janela.getByTestId('caixa-vendas-dinheiro')).toHaveText(/R\$\s*3,00/)
      await janela.getByTestId('caixa-saldo-atual').scrollIntoViewIfNeeded()
      await expect(janela.getByTestId('caixa-saldo-atual')).toHaveText(/R\$\s*103,00/)

      await aplicativo.close()
    } finally {
      try {
        rmSync(diretorioDados, { recursive: true, force: true })
      } catch {
        // Ignorar lock temporario do userData no Windows
      }
    }
  })

  test('cria delivery sem nome e com endereco', async () => {
    const diretorioDados = mkdtempSync(join(tmpdir(), 'pdv-e2e-deliv-'))

    try {
      const aplicativo = await abrirAplicativo(diretorioDados)
      const janela = await aplicativo.firstWindow()

      await garantirCaixaAberto(janela)

      await janela.getByTestId('nav-pedidos').click()
      await expect(janela.getByTestId('pagina-pedidos')).toBeVisible({ timeout: 15_000 })

      await janela.getByTestId('botao-pedido-delivery').click()
      await expect(janela.getByTestId('formulario-delivery')).toBeVisible()
      await janela.getByTestId('delivery-endereco').fill('Rua das Flores, 100')
      await janela.getByTestId('delivery-confirmar').click()

      await expect(janela.getByTestId('dados-entrega')).toBeVisible({ timeout: 10_000 })
      await expect(janela.getByTestId('entrega-cliente-nome')).toHaveText(/Não informado/)
      await expect(janela.getByTestId('entrega-endereco')).toHaveText('Rua das Flores, 100')

      await aplicativo.close()
    } finally {
      try {
        rmSync(diretorioDados, { recursive: true, force: true })
      } catch {
        // Ignorar lock temporario do userData no Windows
      }
    }
  })
})
