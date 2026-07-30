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
    await janela.getByTestId('campo-nome-categoria').fill('Bebidas')
    await janela.getByTestId('botao-criar-categoria').click()
    await expect(janela.getByTestId('feedback-sucesso-produtos')).toBeVisible({
      timeout: 10_000,
    })

    await janela.getByTestId('campo-nome-produto').fill('Coca-Cola lata')
    await janela.getByTestId('campo-preco-produto').fill('6,00')
    await janela.getByTestId('botao-criar-produto').click()
    await expect(janela.getByTestId('feedback-sucesso-produtos')).toBeVisible({
      timeout: 10_000,
    })
  }
}

test.describe('pedidos locais', () => {
  test('abre pedido de mesa, adiciona itens, calcula total e persiste apos reiniciar', async () => {
    const diretorioDados = mkdtempSync(join(tmpdir(), 'pdv-e2e-ped-'))

    try {
      const aplicativo = await abrirAplicativo(diretorioDados)
      const janela = await aplicativo.firstWindow()

      await garantirCaixaAberto(janela)
      await garantirProdutoAtivo(janela)

      await janela.getByTestId('nav-pedidos').click()
      await expect(janela.getByTestId('pagina-pedidos')).toBeVisible({ timeout: 15_000 })

      await janela.getByTestId('botao-cadastrar-mesas').click()
      await expect(janela.getByTestId('formulario-mesa')).toBeVisible()

      await janela.getByTestId('campo-numero-inicial-mesa').fill('10')
      await janela.getByTestId('campo-numero-final-mesa').fill('10')
      await janela.getByTestId('botao-criar-mesas').click()
      await expect(janela.getByTestId('item-mesa')).toHaveCount(1)

      await janela.getByTestId('item-mesa').click()
      await janela.getByTestId('botao-abrir-mesa').click()
      await expect(janela.getByTestId('pagina-pedido-aberto')).toBeVisible({ timeout: 10_000 })

      await janela.getByTestId('botao-adicionar-item-painel').click()
      await janela.getByTestId('campo-produto-pedido').click()
      await janela.getByTestId('opcao-produto-pedido').first().click()
      await janela.getByTestId('campo-quantidade-item').fill('2')
      await janela.getByTestId('botao-adicionar-item').click()
      await expect(janela.getByTestId('item-pedido')).toHaveCount(1)
      await expect(janela.getByTestId('pedido-total')).toHaveText(/R\$\s*12,00/)

      await janela.getByTestId('botao-aumentar-quantidade').click()
      await expect(janela.getByTestId('pedido-total')).toHaveText(/R\$\s*18,00/)

      await janela.getByTestId('botao-remover-item').click()
      await expect(janela.getByTestId('item-pedido')).toHaveCount(0)
      await expect(janela.getByTestId('pedido-total')).toHaveText(/R\$\s*0,00/)

      await janela.getByTestId('botao-adicionar-item-painel').click()
      await janela.getByTestId('campo-produto-pedido').click()
      await janela.getByTestId('opcao-produto-pedido').first().click()
      await janela.getByTestId('campo-quantidade-item').fill('1')
      await janela.getByTestId('botao-adicionar-item').click()
      await expect(janela.getByTestId('pedido-total')).toHaveText(/R\$\s*6,00/)

      await aplicativo.close()

      const aplicativoReaberto = await abrirAplicativo(diretorioDados)
      const janelaReaberta = await aplicativoReaberto.firstWindow()

      await expect(janelaReaberta.getByTestId('app-carregando')).toBeHidden({ timeout: 15_000 })
      await janelaReaberta.getByTestId('nav-pedidos').click()
      await expect(janelaReaberta.getByTestId('pagina-pedidos')).toBeVisible({
        timeout: 15_000,
      })
      await janelaReaberta.getByTestId('item-mesa').click()
      await expect(janelaReaberta.getByTestId('pagina-pedido-aberto')).toBeVisible({
        timeout: 10_000,
      })
      await expect(janelaReaberta.getByTestId('item-pedido')).toHaveCount(1)
      await expect(janelaReaberta.getByTestId('pedido-total')).toHaveText(/R\$\s*6,00/)

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
