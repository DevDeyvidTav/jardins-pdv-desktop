import { consultarValorMetadata, type ConexaoSqlite } from '../conexao-sqlite'
import { aplicarCardapioJardins } from './aplicar-cardapio-jardins'

const CHAVE_METADATA_SEED_CHINA_EXPRESS = 'seed_china_express_v1'

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

function ambienteDeTeste(): boolean {
  return process.env.VITEST === 'true' || process.env.NODE_ENV === 'test'
}

export async function garantirCardapioInicial(
  conexao: ConexaoSqlite,
  opcoes: { ignorarAmbienteTeste?: boolean } = {},
): Promise<{ aplicado: boolean; motivo?: string; resumo?: { produtosCriados: number; saboresPizzaCriados: number } }> {
  if (ambienteDeTeste() && !opcoes.ignorarAmbienteTeste) {
    aplicarCardapioJardins(conexao)
    return { aplicado: false, motivo: 'ambiente de teste' }
  }

  if (deveAplicarSeedCardapioInicial(conexao)) {
    const { executarSeedChinaExpress } = await import('./seed-china-express')
    return executarSeedChinaExpress(conexao)
  }

  aplicarCardapioJardins(conexao)
  return { aplicado: false, motivo: 'catalogo ja presente' }
}
