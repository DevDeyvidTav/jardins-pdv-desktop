import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  encerrarBancoLocal,
  inicializarBancoLocal,
  obterConexaoBancoLocal,
} from '../../src/main/database/inicializar-banco'
import { consultarValorMetadata } from '../../src/main/database/conexao-sqlite'
import { CHAVE_METADATA_SEED_APRESENTACAO } from '../../src/main/database/seeds/dados-apresentacao'
import { executarSeedApresentacao } from '../../src/main/database/seeds/seed-apresentacao'
import { criarListarCategoriasProduto } from '../../src/main/modules/produtos/use-cases/listar-categorias-produto'
import { criarListarPizzaCategorias } from '../../src/main/modules/pizzas/use-cases/categorias-pizza'

describe('seed apresentacao (isolado)', () => {
  it('popula catalogo e impede reexecucao sem --force', async () => {
    const diretorio = mkdtempSync(join(tmpdir(), 'pdv-seed-'))
    const caminhoBanco = join(diretorio, 'pdv-local.sqlite')

    try {
      await inicializarBancoLocal(caminhoBanco)
      const primeira = executarSeedApresentacao(obterConexaoBancoLocal())
      expect(primeira.aplicado).toBe(true)
      expect(primeira.resumo.produtos).toBeGreaterThan(10)
      expect(primeira.resumo.saboresPizza).toBeGreaterThan(10)
      expect(primeira.resumo.clientes).toBe(2)

      const categorias = criarListarCategoriasProduto()({ apenasAtivas: false })
      const pizzas = criarListarPizzaCategorias()({ apenasAtivas: false })
      expect(categorias.length).toBeGreaterThanOrEqual(4)
      expect(pizzas.length).toBeGreaterThanOrEqual(3)

      const segunda = executarSeedApresentacao(obterConexaoBancoLocal())
      expect(segunda.aplicado).toBe(false)

      expect(consultarValorMetadata(obterConexaoBancoLocal(), CHAVE_METADATA_SEED_APRESENTACAO)).toBe(
        '1',
      )
    } finally {
      encerrarBancoLocal()
      rmSync(diretorio, { recursive: true, force: true })
    }
  })
})
