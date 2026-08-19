/**
 * Popula o banco com catalogo de demonstracao (produtos, pizzas, mesas, caixa).
 *
 * Uso (feche o PDV antes):
 *   npm run seed:apresentacao
 *   npm run seed:apresentacao -- --db=C:\caminho\pdv-local.sqlite
 *   npm run seed:apresentacao -- --force
 */
import { homedir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'vitest'
import {
  encerrarBancoLocal,
  inicializarBancoLocal,
  obterConexaoBancoLocal,
} from '../../src/main/database/inicializar-banco'
import { executarSeedApresentacao } from '../../src/main/database/seeds/seed-apresentacao'

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

  return { caminhoBanco, forcar }
}

describe('seed apresentacao', () => {
  it('popula catalogo de demonstracao', async () => {
    const { caminhoBanco, forcar } = lerArgumentos()

    console.log('Seed de apresentacao — Jardins PDV')
    console.log('Banco:', caminhoBanco)
    if (forcar) console.log('Modo: --force')

    await inicializarBancoLocal(caminhoBanco)

    try {
      const resultado = executarSeedApresentacao(obterConexaoBancoLocal(), { forcar })

      if (!resultado.aplicado) {
        console.log('\n' + resultado.motivo)
        return
      }

      const { resumo } = resultado
      console.log('\nSeed aplicado com sucesso!')
      console.log(`  Categorias de produto: +${resumo.categoriasProduto}`)
      console.log(`  Produtos:            +${resumo.produtos}`)
      console.log(`  Categorias de pizza: +${resumo.categoriasPizza}`)
      console.log(`  Sabores de pizza:    +${resumo.saboresPizza}`)
      console.log(`  Mesas novas:         +${resumo.mesasNovas}`)
      console.log(`  Clientes:            +${resumo.clientes}`)
      console.log(`  Caixa aberto:        ${resumo.caixaAberto ? 'sim' : 'ja estava aberto'}`)
    } finally {
      encerrarBancoLocal()
    }
  })
})
