import { describe, expect, it } from 'vitest'
import { definirValorMetadata } from '../../../src/main/database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../src/main/database/inicializar-banco'
import { CHAVE_METADATA_SEED_CHINA_EXPRESS } from '../../../src/main/database/seeds/dados-china-express'
import {
  catalogoInicialEstaVazio,
  deveAplicarSeedCardapioInicial,
  garantirCardapioInicial,
} from '../../../src/main/database/seeds/garantir-cardapio-inicial'
import { criarCategoriaProdutoRepository } from '../../../src/main/modules/produtos/repositories/categoria-produto.repository'
import { criarProdutoRepository } from '../../../src/main/modules/produtos/repositories/produto.repository'
import { prepararBancoTeste } from '../../helpers/banco-teste'

describe('garantirCardapioInicial', () => {
  it('marca seed quando o catalogo esta vazio e ainda nao foi aplicado', async () => {
    const banco = await prepararBancoTeste()
    const conexao = obterConexaoBancoLocal()

    expect(catalogoInicialEstaVazio(conexao)).toBe(true)
    expect(deveAplicarSeedCardapioInicial(conexao)).toBe(true)

    banco.encerrar()
  })

  it('nao reaplica seed se o catalogo ja tem categorias', async () => {
    const banco = await prepararBancoTeste()
    const conexao = obterConexaoBancoLocal()

    criarCategoriaProdutoRepository(conexao).inserir({
      nome: 'Ja existia',
      descricao: null,
    })

    expect(catalogoInicialEstaVazio(conexao)).toBe(false)
    expect(deveAplicarSeedCardapioInicial(conexao)).toBe(false)

    banco.encerrar()
  })

  it('nao reaplica seed se o metadata ja foi gravado', async () => {
    const banco = await prepararBancoTeste()
    const conexao = obterConexaoBancoLocal()

    definirValorMetadata(conexao, CHAVE_METADATA_SEED_CHINA_EXPRESS, '1')

    expect(deveAplicarSeedCardapioInicial(conexao)).toBe(false)

    banco.encerrar()
  })

  it('no boot de teste nao importa o cardapio', async () => {
    const banco = await prepararBancoTeste()
    const conexao = obterConexaoBancoLocal()

    const resultado = garantirCardapioInicial(conexao)
    expect(resultado.aplicado).toBe(false)
    expect(criarProdutoRepository(conexao).listarComCategoria()).toHaveLength(0)

    banco.encerrar()
  })
})
