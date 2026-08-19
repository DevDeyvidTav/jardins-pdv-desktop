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

async function selecionarMesaPorNumero(janela: Page, numero: number) {
  await janela.locator(`[data-testid="item-mesa"][data-mesa-numero="${numero}"]`).click()
}

async function configurarCatalogoPizzas(janela: Page) {
  await janela.getByTestId('nav-produtos').click()
  await expect(janela.getByTestId('pagina-cardapio')).toBeVisible()
  await janela.getByTestId('aba-cardapio-pizzas').click()
  await expect(janela.getByTestId('pagina-pizzas')).toBeVisible()

  // Categoria
  await janela.getByRole('button', { name: 'Nova', exact: true }).first().click()
  await expect(janela.getByTestId('formulario-pizza-categoria')).toBeVisible()
  await janela.getByTestId('campo-nome-pizza-categoria').fill('Tradicional')
  await janela.getByTestId('campo-regra-pizza-categoria').selectOption('MAIOR_SABOR')
  await janela.getByTestId('botao-criar-pizza-categoria').click()
  await expect(janela.getByTestId('feedback-sucesso-pizzas')).toBeVisible({ timeout: 10_000 })
  await expect(janela.getByTestId('item-pizza-categoria')).toContainText('Tradicional')

  // Sabores com vinculo e precos (P 40/45/50, M 45/50/55, G 50/55/60)
  const sabores = [
    { nome: 'Calabresa', p: '40,00', m: '45,00', g: '50,00' },
    { nome: 'Frango', p: '45,00', m: '50,00', g: '55,00' },
    { nome: 'Quatro Queijos', p: '50,00', m: '55,00', g: '60,00' },
  ] as const

  for (const sabor of sabores) {
    await janela
      .locator('[data-testid="secao-pizza-sabores"]')
      .getByRole('button', { name: /Novo|Nova/i })
      .click()
    await expect(janela.getByTestId('formulario-pizza-sabor')).toBeVisible()
    await janela.getByTestId('campo-nome-pizza-sabor').fill(sabor.nome)
    await janela.getByTestId('botao-criar-pizza-sabor').click()
    await expect(janela.getByTestId('feedback-sucesso-pizzas')).toBeVisible({ timeout: 10_000 })

    const itemSabor = janela.getByTestId('item-pizza-sabor').filter({ hasText: sabor.nome })
    await itemSabor.getByRole('button', { name: /Precos|vinculos/i }).click()
    await expect(janela.getByTestId('formulario-pizza-sabor')).toBeVisible()

    const checkboxCategoria = janela.locator('[data-testid^="checkbox-vincular-categoria-"]').first()
    if (!(await checkboxCategoria.isChecked())) {
      await checkboxCategoria.check()
    }

    await janela.getByTestId('campo-preco-sabor-tamanho-P').fill(sabor.p)
    await janela.getByTestId('campo-preco-sabor-tamanho-M').fill(sabor.m)
    await janela.getByTestId('campo-preco-sabor-tamanho-G').fill(sabor.g)
    await janela.getByTestId('botao-salvar-precos-sabor').click()
    await expect(janela.getByTestId('feedback-sucesso-pizzas')).toBeVisible({ timeout: 10_000 })

    // Fecha o formulario de edicao antes do proximo sabor
    await janela
      .locator('[data-testid="secao-pizza-sabores"] > header')
      .getByRole('button', { name: 'Fechar' })
      .click()
  }

  // Confirma seed P/M/G
  await expect(janela.getByTestId('item-pizza-tamanho')).toHaveCount(3)
}

async function abrirFormularioAdicionarItem(janela: Page) {
  if (await janela.getByTestId('busca-produtos-pedido').isVisible().catch(() => false)) {
    return
  }
  await janela.getByTestId('botao-adicionar-item-painel').click()
}

async function selecionarCategoriaPizza(janela: Page, nomeCategoria = 'Tradicional') {
  const select = janela.getByTestId('campo-categoria-produto-pedido')
  await expect(select).toBeVisible()
  const valor = await select
    .locator('optgroup[label="Pizzas"] option')
    .filter({ hasText: nomeCategoria })
    .first()
    .getAttribute('value')
  expect(valor).toBeTruthy()
  await select.selectOption(valor!)
}

async function adicionarPizzaComSabores(
  janela: Page,
  opcoes: { tamanhoSigla: 'P' | 'M' | 'G'; nomesSabores: string[]; observacao?: string },
) {
  await abrirFormularioAdicionarItem(janela)
  await selecionarCategoriaPizza(janela)
  await expect(janela.getByTestId('formulario-adicionar-pizza')).toBeVisible()

  const tamanhoOption = janela
    .getByTestId('campo-pizza-tamanho')
    .locator('option')
    .filter({ hasText: new RegExp(`\\(${opcoes.tamanhoSigla}\\)`) })
  const tamanhoValue = await tamanhoOption.first().getAttribute('value')
  expect(tamanhoValue).toBeTruthy()
  await janela.getByTestId('campo-pizza-tamanho').selectOption(tamanhoValue!)

  await expect(janela.getByTestId('pizza-limite-sabores')).toContainText(
    `Pizza ${opcoes.tamanhoSigla}`,
  )

  for (const nome of opcoes.nomesSabores) {
    const checkbox = janela
      .locator('label')
      .filter({ hasText: nome })
      .getByTestId('opcao-pizza-sabor')
    await checkbox.check()
  }

  if (opcoes.observacao) {
    await janela.getByTestId('campo-observacao-pizza').fill(opcoes.observacao)
  }

  await expect(janela.getByTestId('preview-pizza-preco')).not.toHaveText('—', { timeout: 10_000 })
  await janela.getByTestId('botao-confirmar-pizza').click()
  await expect(janela.getByTestId('formulario-adicionar-pizza')).toBeHidden({ timeout: 10_000 })
}

test.describe('pizzas', () => {
  test('catalogo, composicao no pedido, persistencia e bloqueio por divisao', async () => {
    const diretorioDados = mkdtempSync(join(tmpdir(), 'pdv-e2e-pizzas-'))

    try {
      let aplicativo = await abrirAplicativo(diretorioDados)
      let janela = await aplicativo.firstWindow()

      await garantirCaixaAberto(janela)
      await configurarCatalogoPizzas(janela)

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

      // Pizza P com 2 sabores → maior sabor R$ 45,00 (Frango)
      await adicionarPizzaComSabores(janela, {
        tamanhoSigla: 'P',
        nomesSabores: ['Calabresa', 'Frango'],
        observacao: 'sem cebola',
      })

      const pizzaP = janela.locator('[data-testid="item-pedido"][data-pizza="true"]').first()
      await expect(pizzaP.getByTestId('item-pedido-nome')).toContainText('Pizza P')
      await expect(pizzaP.getByTestId('item-pedido-nome')).toContainText('Calabresa')
      await expect(pizzaP.getByTestId('item-pedido-nome')).toContainText('Frango')
      await expect(pizzaP.getByTestId('item-pedido-obs')).toContainText('sem cebola')
      await expect(pizzaP.getByTestId('item-pedido-total')).toHaveText(/R\$\s*45,00/)
      await expect(janela.getByTestId('pedido-total')).toHaveText(/R\$\s*45,00/)

      // Tentativa de 3 sabores em P: UI bloqueia e IPC tambem rejeita
      await abrirFormularioAdicionarItem(janela)
      await selecionarCategoriaPizza(janela)
      await expect(janela.getByTestId('formulario-adicionar-pizza')).toBeVisible()
      const tamanhoP = await janela
        .getByTestId('campo-pizza-tamanho')
        .locator('option')
        .filter({ hasText: /\(P\)/ })
        .first()
        .getAttribute('value')
      await janela.getByTestId('campo-pizza-tamanho').selectOption(tamanhoP!)
      await janela
        .locator('label')
        .filter({ hasText: 'Calabresa' })
        .getByTestId('opcao-pizza-sabor')
        .check()
      await janela
        .locator('label')
        .filter({ hasText: 'Frango' })
        .getByTestId('opcao-pizza-sabor')
        .check()
      await janela
        .locator('label')
        .filter({ hasText: 'Quatro Queijos' })
        .getByTestId('opcao-pizza-sabor')
        .click({ force: true })
      await expect(janela.getByText(/permite no maximo 2/i)).toBeVisible()
      await expect(
        janela.locator('label').filter({ hasText: 'Quatro Queijos' }).getByTestId('opcao-pizza-sabor'),
      ).not.toBeChecked()

      const rejeicaoIpc = await janela.evaluate(async () => {
        const categorias = await window.pdv.pizzas.listarCategorias({ apenasAtivas: true })
        const tamanhos = await window.pdv.pizzas.listarTamanhos({ apenasAtivas: true })
        const tamanhoPLocal = tamanhos.find((t) => t.sigla === 'P')
        const sabores = await window.pdv.pizzas.listarSabores({
          apenasAtivos: true,
          categoriaId: categorias[0]!.id,
        })
        const pedidos = await window.pdv.pedidos.listarPedidosAbertos()
        try {
          await window.pdv.pedidos.adicionarPizza({
            pedidoId: pedidos[0]!.id,
            categoriaId: categorias[0]!.id,
            tamanhoId: tamanhoPLocal!.id,
            saborIds: sabores.slice(0, 3).map((s) => s.id),
          })
          return { ok: true as const }
        } catch (erro) {
          const mensagem =
            erro && typeof erro === 'object' && 'message' in erro
              ? String((erro as { message: unknown }).message)
              : String(erro)
          const codigo =
            erro && typeof erro === 'object' && 'codigo' in erro
              ? String((erro as { codigo: unknown }).codigo)
              : null
          return { ok: false as const, mensagem, codigo }
        }
      })
      expect(rejeicaoIpc.ok).toBe(false)
      expect(
        `${rejeicaoIpc.codigo ?? ''} ${rejeicaoIpc.mensagem}`.toUpperCase(),
      ).toMatch(/PIZZA_QUANTIDADE_SABORES_EXCEDE_LIMITE|MAXIMO|SABOR/)

      await janela.getByTestId('botao-fechar-adicionar-item').click()

      // Pizza G com 3 sabores → R$ 60,00
      await adicionarPizzaComSabores(janela, {
        tamanhoSigla: 'G',
        nomesSabores: ['Calabresa', 'Frango', 'Quatro Queijos'],
      })

      const pizzas = janela.locator('[data-testid="item-pedido"][data-pizza="true"]')
      await expect(pizzas).toHaveCount(2)
      await expect(pizzas.nth(1).getByTestId('item-pedido-nome')).toContainText('Pizza G')
      await expect(pizzas.nth(1).getByTestId('item-pedido-nome')).toContainText('Quatro Queijos')
      await expect(pizzas.nth(1).getByTestId('item-pedido-total')).toHaveText(/R\$\s*60,00/)
      // 45 + 60 = 105
      await expect(janela.getByTestId('pedido-total')).toHaveText(/R\$\s*105,00/)

      await aplicativo.close()

      aplicativo = await abrirAplicativo(diretorioDados)
      janela = await aplicativo.firstWindow()
      await expect(janela.getByTestId('app-carregando')).toBeHidden({ timeout: 15_000 })
      await garantirCaixaAberto(janela)

      await janela.getByTestId('nav-produtos').click()
      await janela.getByTestId('aba-cardapio-pizzas').click()
      await expect(janela.getByTestId('item-pizza-categoria')).toContainText('Tradicional')
      await expect(janela.getByTestId('item-pizza-sabor')).toHaveCount(3)
      await expect(janela.getByTestId('item-pizza-tamanho')).toHaveCount(3)

      await janela.getByTestId('nav-pedidos').click()
      await selecionarMesaPorNumero(janela, 1)
      await expect(janela.getByTestId('pagina-pedido-aberto')).toBeVisible({ timeout: 10_000 })
      await expect(janela.locator('[data-testid="item-pedido"][data-pizza="true"]')).toHaveCount(2)
      await expect(janela.getByTestId('pedido-total')).toHaveText(/R\$\s*105,00/)
      await expect(
        janela.locator('[data-testid="item-pedido"][data-pizza="true"]').first().getByTestId('item-pedido-obs'),
      ).toContainText('sem cebola')

      // Cenario divisao: bloqueia alteracao de pizza
      await janela.getByTestId('botao-dividir-conta').click()
      await expect(janela.getByTestId('modal-dividir-conta')).toBeVisible()
      await janela.getByTestId('campo-identificacao-parte-0').fill('A')
      await janela.getByTestId('campo-valor-parte-0').fill('50,00')
      await janela.getByTestId('campo-identificacao-parte-1').fill('B')
      await janela.getByTestId('campo-valor-parte-1').fill('55,00')
      await expect(janela.getByTestId('diferenca-distribuicao-divisao')).toContainText('0,00')
      await janela.getByTestId('botao-confirmar-divisao').click()
      await janela.getByTestId('botao-confirmar-divisao').click()
      await expect(janela.getByTestId('painel-divisao-conta')).toBeVisible({ timeout: 10_000 })

      const bloqueioDivisao = await janela.evaluate(async () => {
        const categorias = await window.pdv.pizzas.listarCategorias({ apenasAtivas: true })
        const tamanhos = await window.pdv.pizzas.listarTamanhos({ apenasAtivas: true })
        const tamanhoPLocal = tamanhos.find((t) => t.sigla === 'P')!
        const sabores = await window.pdv.pizzas.listarSabores({
          apenasAtivos: true,
          categoriaId: categorias[0]!.id,
        })
        const pedidos = await window.pdv.pedidos.listarPedidosAbertos()
        const resumo = await window.pdv.pedidos.obterResumoPedido({
          pedidoId: pedidos[0]!.id,
        })
        const pizzaItem = resumo.itens.find((i) => i.tipo === 'PIZZA')!

        const resultados: string[] = []

        try {
          await window.pdv.pedidos.adicionarPizza({
            pedidoId: pedidos[0]!.id,
            categoriaId: categorias[0]!.id,
            tamanhoId: tamanhoPLocal.id,
            saborIds: [sabores[0]!.id],
          })
          resultados.push('add-ok')
        } catch (erro) {
          const codigo =
            erro && typeof erro === 'object' && 'codigo' in erro
              ? String((erro as { codigo: unknown }).codigo)
              : 'sem-codigo'
          const mensagem =
            erro && typeof erro === 'object' && 'message' in erro
              ? String((erro as { message: unknown }).message)
              : String(erro)
          resultados.push(`add:${codigo}:${mensagem}`)
        }

        try {
          await window.pdv.pedidos.cancelarItemPedido({
            pedidoId: pedidos[0]!.id,
            itemId: pizzaItem.id,
            motivoCancelamento: 'teste e2e',
          })
          resultados.push('remove-ok')
        } catch (erro) {
          const codigo =
            erro && typeof erro === 'object' && 'codigo' in erro
              ? String((erro as { codigo: unknown }).codigo)
              : 'sem-codigo'
          const mensagem =
            erro && typeof erro === 'object' && 'message' in erro
              ? String((erro as { message: unknown }).message)
              : String(erro)
          resultados.push(`remove:${codigo}:${mensagem}`)
        }

        return resultados
      })

      expect(bloqueioDivisao.some((r) => /ALTERACAO_PIZZA_BLOQUEADA|divisao/i.test(r))).toBe(
        true,
      )
      expect(bloqueioDivisao.every((r) => !r.endsWith('-ok') || r.includes('add:') || r.includes('remove:'))).toBe(
        true,
      )
      expect(bloqueioDivisao.some((r) => r === 'add-ok')).toBe(false)
      expect(bloqueioDivisao.some((r) => r === 'remove-ok')).toBe(false)

      await aplicativo.close()
    } finally {
      try {
        rmSync(diretorioDados, { recursive: true, force: true })
      } catch {
        // Windows pode manter lock no userData logo apos fechar o Electron.
      }
    }
  })
})
