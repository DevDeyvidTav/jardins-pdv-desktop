/**
 * Preenche colunas fiscais (NCM, CEST, CSOSN) dos produtos existentes no SQLite local.
 *
 * Uso (feche o PDV antes):
 *   npm run seed:fiscal-produtos
 *   npm run seed:fiscal-produtos -- --db=C:\caminho\pdv-local.sqlite
 *   npm run seed:fiscal-produtos -- --force
 */
import { homedir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'vitest'
import {
  encerrarBancoLocal,
  inicializarBancoLocal,
} from '../../src/main/database/inicializar-banco'
import { criarProdutoRepository } from '../../src/main/modules/produtos/repositories/produto.repository'
import { preencherFiscalProduto } from '../../src/shared/utils/preencher-fiscal-produto'

function caminhoBancoPadrao(): string {
  return join(homedir(), 'AppData', 'Roaming', '@pdv', 'desktop', 'pdv-local.sqlite')
}

function lerArgumentos() {
  const args = process.argv.slice(2)
  let caminhoBanco = caminhoBancoPadrao()
  let forcar = false

  for (const arg of args) {
    if (arg === '--force') {
      forcar = true
      continue
    }
    if (arg.startsWith('--db=')) {
      caminhoBanco = arg.slice('--db='.length)
    }
  }

  if (process.env.FISCAL_FORCE === '1') {
    forcar = true
  }

  return { caminhoBanco, forcar }
}

describe('preencher fiscal produtos', () => {
  it('aplica NCM sugerido aos produtos do banco local', async () => {
    const { caminhoBanco, forcar } = lerArgumentos()

    console.log('Preencher fiscal — Jardins PDV')
    console.log('Banco:', caminhoBanco)
    if (forcar) console.log('Modo: --force')

    await inicializarBancoLocal(caminhoBanco)

    try {
      const repositorio = criarProdutoRepository()
      const produtos = repositorio.listarComCategoria({ apenasAtivos: false })

      let atualizados = 0
      let jaPreenchidos = 0
      let semSugestao = 0

      for (const produto of produtos) {
        const resultado = preencherFiscalProduto(produto, { forcar })

        if (resultado.motivo === 'ja_preenchido') {
          jaPreenchidos++
          continue
        }

        if (resultado.motivo === 'sem_sugestao') {
          semSugestao++
          console.log(`  ? Sem sugestão: ${produto.nome} (${produto.categoriaNome})`)
          continue
        }

        if (!resultado.atualizado || !resultado.dadosFiscais) {
          continue
        }

        repositorio.atualizar({
          produtoId: produto.id,
          ...resultado.dadosFiscais,
        })

        atualizados++
        console.log(
          `  ✓ ${produto.nome}: NCM ${resultado.dadosFiscais.fiscalNcm}` +
            (resultado.dadosFiscais.fiscalCest
              ? ` | CEST ${resultado.dadosFiscais.fiscalCest}`
              : '') +
            ` | CFOP ${resultado.dadosFiscais.fiscalCfop}` +
            ` | CSOSN ${resultado.dadosFiscais.fiscalIcmsCsosn}` +
            ` — ${resultado.sugestao?.fonte ?? ''}`,
        )
      }

      console.log('\nResumo:')
      console.log(`  Produtos no banco:     ${produtos.length}`)
      console.log(`  Atualizados:           ${atualizados}`)
      console.log(`  Já tinham NCM:         ${jaPreenchidos}`)
      console.log(`  Sem sugestão:          ${semSugestao}`)
      console.log('\nRevise com o contador antes de emitir NFC-e em produção.')
    } finally {
      encerrarBancoLocal()
    }
  })
})
