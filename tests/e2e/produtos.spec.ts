import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { _electron as electron } from '@playwright/test'
import { test, expect } from '@playwright/test'

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

test.describe('catalogo de produtos local', () => {
  test('cadastra categoria e produto, busca, inativa e persiste apos reiniciar', async () => {
    const diretorioDados = mkdtempSync(join(tmpdir(), 'pdv-e2e-prod-'))

    try {
      const aplicativo = await abrirAplicativo(diretorioDados)
      const janela = await aplicativo.firstWindow()

      await expect(janela.getByTestId('app-carregando')).toBeHidden({ timeout: 15_000 })
      await janela.getByTestId('nav-produtos').click()
      await expect(janela.getByTestId('pagina-produtos')).toBeVisible()

      await janela.getByTestId('botao-toggle-categoria').click()
      await janela.getByTestId('campo-nome-categoria').fill('Bebidas')
      await janela.getByTestId('campo-descricao-categoria').fill('Bebidas em geral')
      await janela.getByTestId('botao-criar-categoria').click()
      await expect(janela.getByTestId('feedback-sucesso-produtos')).toBeVisible({
        timeout: 10_000,
      })
      await expect(janela.getByTestId('item-categoria')).toHaveCount(1)

      await janela.getByTestId('botao-toggle-produto').click()
      await janela.getByTestId('campo-nome-produto').fill('Coca-Cola lata')
      await janela.getByTestId('campo-descricao-produto').fill('350ml')
      await janela.getByTestId('campo-preco-produto').fill('6,00')
      await janela.getByTestId('botao-criar-produto').click()
      await expect(janela.getByTestId('feedback-sucesso-produtos')).toBeVisible({
        timeout: 10_000,
      })

      const listaAtivos = janela.getByTestId('lista-produtos').getByTestId('item-produto')
      await expect(listaAtivos).toHaveCount(1)
      await expect(listaAtivos.getByTestId('produto-nome')).toHaveText('Coca-Cola lata')
      await expect(listaAtivos.getByTestId('produto-preco')).toHaveText(/R\$\s*6,00/)

      await janela.getByTestId('campo-busca-produto').fill('coca')
      await expect(listaAtivos).toHaveCount(1)

      await listaAtivos.getByTestId('botao-inativar-produto').click()
      await expect(listaAtivos).toHaveCount(0)

      await janela.getByTestId('filtro-produtos-todos').click()
      const listaTodos = janela.getByTestId('lista-produtos').getByTestId('item-produto')
      await expect(listaTodos).toHaveCount(1)
      await expect(listaTodos.getByTestId('status-produto')).toHaveText('Inativo')

      await listaTodos.getByTestId('botao-reativar-produto').click()
      await expect(janela.getByTestId('feedback-sucesso-produtos')).toBeVisible({
        timeout: 10_000,
      })
      await janela.getByTestId('filtro-produtos-ativos').click()
      await expect(listaAtivos).toHaveCount(1)

      await aplicativo.close()

      const aplicativoReaberto = await abrirAplicativo(diretorioDados)
      const janelaReaberta = await aplicativoReaberto.firstWindow()

      await expect(janelaReaberta.getByTestId('app-carregando')).toBeHidden({
        timeout: 15_000,
      })
      await janelaReaberta.getByTestId('nav-produtos').click()
      await expect(janelaReaberta.getByTestId('item-categoria')).toHaveCount(1)
      await expect(
        janelaReaberta.getByTestId('lista-produtos').getByTestId('item-produto'),
      ).toHaveCount(1)
      await expect(
        janelaReaberta.getByTestId('lista-produtos').getByTestId('produto-nome').first(),
      ).toHaveText('Coca-Cola lata')

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
