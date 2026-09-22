import {
  consultarValorMetadata,
  definirValorMetadata,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { registrarErro, registrarInfo } from '../../../logging/logger'
import type { ConfiguracaoSincronizacao } from '../../../config/sincronizacao'
import { aplicarMudancasCatalogo } from './aplicar-mudanca-catalogo'
import { buscarMudancasCatalogoApi } from './cliente-sync-api'

export const CHAVE_SYNC_CATALOGO_CURSOR = 'sync_catalogo_cursor'
const MAX_LOTES_POR_CICLO = 10

export async function puxarMudancasCatalogo(
  config: ConfiguracaoSincronizacao,
): Promise<{ aplicados: number; cursor: number }> {
  const conexao = obterConexaoBancoLocal()
  let cursor = Number(consultarValorMetadata(conexao, CHAVE_SYNC_CATALOGO_CURSOR) ?? 0)
  if (!Number.isFinite(cursor) || cursor < 0) {
    cursor = 0
  }

  let aplicados = 0

  try {
    for (let lote = 0; lote < MAX_LOTES_POR_CICLO; lote += 1) {
      const resposta = await buscarMudancasCatalogoApi(config, cursor)
      if (resposta.mudancas.length > 0) {
        const resultado = aplicarMudancasCatalogo(conexao, resposta.mudancas)
        aplicados += resultado.aplicados
      }

      if (resposta.cursor > cursor) {
        cursor = resposta.cursor
        definirValorMetadata(conexao, CHAVE_SYNC_CATALOGO_CURSOR, String(cursor))
      }

      const snapshot = resposta.mudancas.every((item) => item.id === 0)
      if (resposta.mudancas.length === 0 || snapshot || resposta.mudancas.length < 50) {
        break
      }
    }

    if (aplicados > 0) {
      registrarInfo('Cardapio puxado da nuvem', {
        operacao: 'sync.catalogo.pull',
        quantidade: aplicados,
        cursor,
      })
    }
  } catch (erro) {
    registrarErro('Falha ao puxar cardapio da nuvem', { operacao: 'sync.catalogo.pull' }, erro)
    throw erro
  }

  return { aplicados, cursor }
}
