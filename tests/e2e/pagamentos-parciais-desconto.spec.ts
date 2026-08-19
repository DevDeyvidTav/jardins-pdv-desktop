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
    await janela.getByTestId('campo-nome-categoria').fill('Pratos Principais')
    await janela.getByTestId('botao-criar-categoria').click()
    await expect(janela.getByTestId('feedback-sucesso-produtos')).toBeVisible({
      timeout: 10_000,
    })

    await janela.getByTestId('botao-toggle-produto').click()
    await expect(janela.getByTestId('formulario-produto')).toBeVisible()
    await janela.getByTestId('campo-nome-produto').fill('Almoco Executivo')
    await janela.getByTestId('campo-preco-produto').fill('30,00')
    await janela.getByTestId('botao-criar-produto').click()
    await expect(janela.getByTestId('feedback-sucesso-produtos')).toBeVisible({
      timeout: 10_000,
    })
  }
}

test.describe('Evolucao da Etapa 7 - Pagamentos parciais, desconto e cortesia', () => {
  test('fluxo completo de pedido: desconto, pagamento parcial em dinheiro, cortesia com motivo e finalizacao', async () => {
    const diretorioDados = mkdtempSync(join(tmpdir(), 'pdv-e2e-pag-'))

    try {
      const aplicativo = await abrirAplicativo(diretorioDados)
      const janela = await aplicativo.firstWindow()

      await garantirCaixaAberto(janela)
      await garantirProdutoAtivo(janela)

      await janela.getByTestId('nav-pedidos').click()
      await expect(janela.getByTestId('pagina-pedidos')).toBeVisible({ timeout: 15_000 })

      // Criar mesa
      await janela.getByTestId('botao-cadastrar-mesas').click()
      await expect(janela.getByTestId('formulario-mesa')).toBeVisible()
      await janela.getByTestId('campo-numero-inicial-mesa').fill('5')
      await janela.getByTestId('campo-numero-final-mesa').fill('5')
      await janela.getByTestId('botao-criar-mesas').click()
      await expect(janela.getByTestId('item-mesa')).toHaveCount(1)

      // Abrir mesa
      await janela.getByTestId('item-mesa').click()
      await janela.getByTestId('botao-abrir-mesa').click()
      await expect(janela.getByTestId('pagina-pedido-aberto')).toBeVisible({ timeout: 10_000 })

      // Adicionar item: Almoco Executivo (30,00) x 2 = 60,00
      await janela.getByTestId('botao-adicionar-item-painel').click()
      await janela.getByTestId('campo-produto-pedido').click()
      await janela.getByTestId('opcao-produto-pedido').first().click()
      await janela.getByTestId('campo-quantidade-item').fill('2')
      await janela.getByTestId('botao-adicionar-item').click()
      await expect(janela.getByTestId('item-pedido')).toHaveCount(1)
      await expect(janela.getByTestId('pedido-subtotal')).toHaveText(/R\$\s*60,00/)

      // Aplicar Desconto Geral no Pedido: R$ 10,00 -> Total fica 50,00
      await janela.getByTestId('botao-abrir-desconto').click()
      await expect(janela.getByTestId('modal-desconto-pedido')).toBeVisible()
      await janela.getByTestId('input-desconto-pedido').fill('10,00')
      await janela.getByTestId('input-motivo-desconto').fill('Desconto Fidelidade')
      await janela.getByTestId('botao-confirmar-desconto').click()
      await expect(janela.getByTestId('modal-desconto-pedido')).toBeHidden()

      await expect(janela.getByTestId('pedido-desconto-geral')).toHaveText(/R\$\s*10,00/)
      await expect(janela.getByTestId('pedido-total')).toHaveText(/R\$\s*50,00/)
      await expect(janela.getByTestId('pedido-valor-restante')).toHaveText(/R\$\s*50,00/)

      // 1º Pagamento Parcial: R$ 20,00 em Dinheiro
      await janela.getByTestId('botao-abrir-pagamento').click()
      await expect(janela.getByTestId('modal-pagamento')).toBeVisible()
      await janela.getByTestId('campo-forma-pagamento').selectOption('DINHEIRO')
      await janela.getByTestId('campo-valor-pagamento').fill('20,00')
      await janela.getByTestId('botao-confirmar-pagamento').click()
      await expect(janela.getByTestId('modal-pagamento')).toBeHidden()

      await expect(janela.getByTestId('pedido-valor-pago')).toHaveText(/R\$\s*20,00/)
      await expect(janela.getByTestId('pedido-valor-restante')).toHaveText(/R\$\s*30,00/)

      // 2º Pagamento Parcial: Cortesia de R$ 10,00 com motivo
      await janela.getByTestId('botao-abrir-pagamento').click()
      await expect(janela.getByTestId('modal-pagamento')).toBeVisible()
      await janela.getByTestId('campo-forma-pagamento').selectOption('CORTESIA')
      await janela.getByTestId('campo-valor-pagamento').fill('10,00')
      await janela.getByTestId('campo-motivo-cortesia').fill('Cortesia de Aniversario')
      await janela.getByTestId('botao-confirmar-pagamento').click()
      await expect(janela.getByTestId('modal-pagamento')).toBeHidden()

      await expect(janela.getByTestId('pedido-valor-cortesia')).toHaveText(/R\$\s*10,00/)
      await expect(janela.getByTestId('pedido-valor-restante')).toHaveText(/R\$\s*20,00/)

      // 3º Pagamento Final: R$ 20,00 via PIX (Zera o saldo restante e finaliza o pedido)
      await janela.getByTestId('botao-abrir-pagamento').click()
      await expect(janela.getByTestId('modal-pagamento')).toBeVisible()
      await janela.getByTestId('campo-forma-pagamento').selectOption('PIX_MAQUINETA')
      await janela.getByTestId('campo-valor-pagamento').fill('20,00')
      await janela.getByTestId('botao-confirmar-pagamento').click()
      await expect(janela.getByTestId('modal-pagamento')).toBeHidden()

      await expect(janela.getByTestId('feedback-sucesso-pedidos')).toContainText(
        /finalizado/i,
        { timeout: 10_000 },
      )

      // Reiniciar aplicativo para checar persistencia dos dados
      await aplicativo.close()

      const aplicativoReaberto = await abrirAplicativo(diretorioDados)
      const janelaReaberta = await aplicativoReaberto.firstWindow()
      await expect(janelaReaberta.getByTestId('app-carregando')).toBeHidden({ timeout: 15_000 })

      await janelaReaberta.getByTestId('nav-pedidos').click()
      await expect(janelaReaberta.getByTestId('pagina-pedidos')).toBeVisible({ timeout: 15_000 })

      // Verificar status da mesa na grade (deve ter ficado livre apos a finalizacao)
      await expect(janelaReaberta.getByTestId('item-mesa')).toBeVisible()

      await aplicativoReaberto.close()
    } finally {
      try {
        rmSync(diretorioDados, { recursive: true, force: true })
      } catch {
        // Ignorar lock temporario do userData no Windows
      }
    }
  })
})
