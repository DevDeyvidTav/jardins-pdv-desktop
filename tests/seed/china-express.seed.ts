/**
 * Limpa produtos/categorias do banco local e importa o cardápio China Express (PDF).
 *
 * Uso (feche o PDV antes):
 *   npm run seed:china-express
 *   npm run seed:china-express -- --db=C:\caminho\pdv-local.sqlite
 *   $env:SEED_FORCE='1'; npm run seed:china-express   (PowerShell, reimportar)
 *   SEED_FORCE=1 npm run seed:china-express          (bash, reimportar)
 */
import { homedir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'vitest'
import {
  encerrarBancoLocal,
  inicializarBancoLocal,
  obterConexaoBancoLocal,
} from '../../src/main/database/inicializar-banco'
import {
  TOTAL_CATEGORIAS_CHINA_EXPRESS,
  TOTAL_PRODUTOS_CHINA_EXPRESS,
} from '../../src/main/database/seeds/dados-china-express'
import {
  TOTAL_CATEGORIAS_PIZZA_CHINA_EXPRESS,
  TOTAL_SABORES_PIZZA_CHINA_EXPRESS,
} from '../../src/main/database/seeds/dados-china-express-pizzas'
import { executarSeedChinaExpress } from '../../src/main/database/seeds/seed-china-express'

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

  if (process.env.SEED_FORCE === '1') {
    forcar = true
  }

  return { caminhoBanco, forcar }
}

describe('seed china express', () => {
  it('substitui catalogo local pelo cardapio China Express', async () => {
    const { caminhoBanco, forcar } = lerArgumentos()

    console.log('Seed China Express — Jardins PDV')
    console.log('Banco:', caminhoBanco)
    if (forcar) console.log('Modo: --force')
    console.log(
      `Cardapio: ${TOTAL_CATEGORIAS_CHINA_EXPRESS} categorias de produto, ${TOTAL_PRODUTOS_CHINA_EXPRESS} produtos`,
    )
    console.log(
      `Pizzas: ${TOTAL_CATEGORIAS_PIZZA_CHINA_EXPRESS} categorias, ${TOTAL_SABORES_PIZZA_CHINA_EXPRESS} sabores`,
    )

    await inicializarBancoLocal(caminhoBanco)

    try {
      const resultado = executarSeedChinaExpress(obterConexaoBancoLocal(), { forcar })

      if (!resultado.aplicado) {
        console.log('\n' + resultado.motivo)
        return
      }

      const { resumo } = resultado
      console.log('\nCatalogo substituido com sucesso!')
      console.log(`  Produtos removidos:      ${resumo.produtosRemovidos}`)
      console.log(`  Categorias removidas:    ${resumo.categoriasRemovidas}`)
      console.log(`  Itens de pedido remov.:  ${resumo.itensPedidoRemovidos}`)
      console.log(`  Sabores pizza remov.:    ${resumo.pizzasRemovidas}`)
      console.log(`  Categorias criadas:      ${resumo.categoriasCriadas}`)
      console.log(`  Produtos criados:        ${resumo.produtosCriados}`)
      console.log(`  Categorias pizza:        ${resumo.categoriasPizzaCriadas}`)
      console.log(`  Sabores pizza:           ${resumo.saboresPizzaCriados}`)
    } finally {
      encerrarBancoLocal()
    }
  })
})
