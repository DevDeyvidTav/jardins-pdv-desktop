import { consultarValorMetadata, type ConexaoSqlite } from '../conexao-sqlite'
import { CHAVE_METADATA_SEED_CHINA_EXPRESS } from './dados-china-express'
import { aplicarCardapioJardins } from './aplicar-cardapio-jardins'
import {
  executarSeedChinaExpress,
  type ResultadoSeedChinaExpress,
} from './seed-china-express'

export function catalogoInicialEstaVazio(conexao: ConexaoSqlite): boolean {
  const linha = conexao.nativo
    .prepare('SELECT COUNT(*) AS n FROM categoria_produto')
    .get() as { n: number }
  return Number(linha.n) === 0
}

export function deveAplicarSeedCardapioInicial(conexao: ConexaoSqlite): boolean {
  if (consultarValorMetadata(conexao, CHAVE_METADATA_SEED_CHINA_EXPRESS) === '1') {
    return false
  }

  return catalogoInicialEstaVazio(conexao)
}

export function garantirCardapioInicial(
  conexao: ConexaoSqlite,
  opcoes: { ignorarAmbienteTeste?: boolean } = {},
): ResultadoSeedChinaExpress | { aplicado: boolean; motivo: string } {
  if (process.env.NODE_ENV === 'test' && !opcoes.ignorarAmbienteTeste) {
    aplicarCardapioJardins(conexao)
    return { aplicado: false, motivo: 'ambiente de teste' }
  }

  if (deveAplicarSeedCardapioInicial(conexao)) {
    return executarSeedChinaExpress(conexao)
  }

  aplicarCardapioJardins(conexao)
  return { aplicado: false, motivo: 'catalogo ja presente' }
}
