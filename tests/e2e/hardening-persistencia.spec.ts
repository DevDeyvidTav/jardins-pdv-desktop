import { mkdtempSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { _electron as electron } from '@playwright/test'
import { test, expect, type Page, type ElectronApplication } from '@playwright/test'
import {
  abrirConexaoSqlite,
  consultarValorMetadata,
  fecharConexaoSqlite,
} from '../../src/main/database/conexao-sqlite'
import { REGISTRO_MIGRACOES } from '../../src/main/database/migracoes/registro-migracoes'

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

async function tentarAbrirJanela(
  aplicativo: ElectronApplication,
): Promise<Page | null> {
  try {
    return await aplicativo.firstWindow({ timeout: 20_000 })
  } catch {
    return null
  }
}

async function garantirProdutoAtivo(janela: Page) {
  await janela.getByTestId('nav-produtos').click()
  await expect(janela.getByTestId('pagina-produtos')).toBeVisible()

  if ((await janela.getByTestId('item-produto').count()) === 0) {
    await janela.getByTestId('botao-toggle-categoria').click()
    await expect(janela.getByTestId('formulario-categoria')).toBeVisible()
    await janela.getByTestId('campo-nome-categoria').fill('Pratos')
    await janela.getByTestId('botao-criar-categoria').click()
    await expect(janela.getByTestId('feedback-sucesso-produtos')).toBeVisible({
      timeout: 10_000,
    })

    await janela.getByTestId('botao-toggle-produto').click()
    await expect(janela.getByTestId('formulario-produto')).toBeVisible()
    await janela.getByTestId('campo-nome-produto').fill('Yakisoba carne')
    await janela.getByTestId('campo-preco-produto').fill('32,00')
    await janela.getByTestId('botao-criar-produto').click()
    await expect(janela.getByTestId('feedback-sucesso-produtos')).toBeVisible({
      timeout: 10_000,
    })
  }
}

test.describe('hardening persistencia', () => {
  test('persiste pedido apos reinicio e mantem schema/migrations', async () => {
    const diretorioDados = mkdtempSync(join(tmpdir(), 'pdv-e2e-hard-'))
    const caminhoBanco = join(diretorioDados, 'pdv-local.sqlite')
    let aplicativo: ElectronApplication | undefined

    try {
      aplicativo = await abrirAplicativo(diretorioDados)
      let janela = await tentarAbrirJanela(aplicativo)

      test.skip(
        !janela,
        'Electron nao abriu janela — rode `npm run rebuild:native` com Visual Studio Build Tools para carregar better-sqlite3 no ABI do Electron. Cobertura equivalente: tests/integration/hardening-persistencia.test.ts',
      )

      await garantirCaixaAberto(janela!)
      await garantirProdutoAtivo(janela!)
      await janela!.getByTestId('nav-pedidos').click()
      await expect(janela!.getByTestId('pagina-pedidos')).toBeVisible({ timeout: 15_000 })

      await janela!.getByTestId('botao-cadastrar-mesas').click()
      await janela!.getByTestId('campo-numero-inicial-mesa').fill('1')
      await janela!.getByTestId('campo-numero-final-mesa').fill('1')
      await janela!.getByTestId('botao-criar-mesas').click()
      await expect(janela!.getByTestId('item-mesa')).toHaveCount(1)

      await janela!.getByTestId('item-mesa').click()
      await janela!.getByTestId('botao-abrir-mesa').click()
      await expect(janela!.getByTestId('pagina-pedido-aberto')).toBeVisible({
        timeout: 10_000,
      })

      await janela!.getByTestId('botao-adicionar-item-painel').click()
      await janela!.getByTestId('campo-produto-pedido').click()
      await janela!.getByTestId('opcao-produto-pedido').first().click()
      await janela!.getByTestId('botao-adicionar-item').click()
      await expect(janela!.getByTestId('item-pedido')).toHaveCount(1)

      await aplicativo.close()

      expect(existsSync(caminhoBanco)).toBe(true)

      aplicativo = await abrirAplicativo(diretorioDados)
      janela = await tentarAbrirJanela(aplicativo)
      expect(janela).not.toBeNull()

      await expect(janela!.getByTestId('app-carregando')).toBeHidden({ timeout: 15_000 })
      await janela!.getByTestId('nav-pedidos').click()
      await janela!.getByTestId('item-mesa').click()
      await expect(janela!.getByTestId('pagina-pedido-aberto')).toBeVisible({
        timeout: 10_000,
      })
      await expect(janela!.getByTestId('item-pedido')).toHaveCount(1)

      await aplicativo.close()
      aplicativo = undefined

      const conexao = await abrirConexaoSqlite(caminhoBanco)
      expect(consultarValorMetadata(conexao, 'schema_version')).toBe(
        String(REGISTRO_MIGRACOES.at(-1)!.versao),
      )
      const check = conexao.nativo.pragma('integrity_check') as Array<{
        integrity_check: string
      }>
      expect(check[0]?.integrity_check).toBe('ok')
      fecharConexaoSqlite(conexao)
    } finally {
      if (aplicativo) {
        await aplicativo.close().catch(() => undefined)
      }
      try {
        rmSync(diretorioDados, { recursive: true, force: true })
      } catch {
        // lock do userData / WAL no Windows
      }
    }
  })
})
