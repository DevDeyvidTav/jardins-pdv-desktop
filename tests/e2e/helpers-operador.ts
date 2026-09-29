import { expect, type Page } from '@playwright/test'

/**
 * O PDV abre na tela de login do operador. Nos testes e2e o banco novo
 * recebe os operadores padrao; entramos com a admin (Nathalia) para
 * liberar todas as telas, inclusive Configuracoes.
 *
 * Aguarda a tela de login OU uma tela do app ja liberado — o que aparecer
 * primeiro — para nao correr o risco de procurar o login antes de renderizar.
 */
export async function entrarComOperadorPadrao(janela: Page) {
  const telaLogin = janela.getByTestId('tela-login-operador')
  const appLiberado = janela.locator(
    '[data-testid="pagina-abertura-caixa"], [data-testid="pagina-caixa-atual"], [data-testid="pagina-pos-fechamento"], [data-testid="pagina-pedidos"], [data-testid="pagina-produtos"], [data-testid="pagina-cardapio"]',
  )

  const aguardarLogin = telaLogin
    .waitFor({ state: 'visible', timeout: 15_000 })
    .then(() => 'login' as const)
    .catch(() => null)
  const aguardarApp = appLiberado
    .first()
    .waitFor({ state: 'visible', timeout: 15_000 })
    .then(() => 'app' as const)
    .catch(() => null)

  const resultado = await Promise.race([aguardarLogin, aguardarApp])
  if (resultado !== 'login') {
    return
  }

  await janela.getByTestId('campo-usuario-operador').fill('Nathalia')
  await janela.getByTestId('campo-pin-operador').fill('369369')
  await janela.getByTestId('botao-entrar-operador').click()
  await expect(telaLogin).toBeHidden({ timeout: 10_000 })
}
