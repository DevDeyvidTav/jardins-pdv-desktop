import {
  consultarValorMetadata,
  type ConexaoSqlite,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import type { EmitenteDanfeNfce } from '../../impressao/templates/montar-danfe-nfce'

export const CHAVE_EMITENTE_FISCAL = 'fiscal_emitente'

export function obterEmitenteDanfe(
  env: NodeJS.ProcessEnv = process.env,
  conexao?: ConexaoSqlite,
): EmitenteDanfeNfce {
  const cache = lerEmitenteCache(conexao)

  return {
    nome: env.PDV_EMPRESA_NOME?.trim() || cache?.nome || 'Jardins',
    cnpj: env.PDV_EMPRESA_CNPJ?.trim() || cache?.cnpj || '',
    ie: env.PDV_EMPRESA_IE?.trim() || cache?.ie || '',
    endereco: env.PDV_EMPRESA_ENDERECO?.trim() || cache?.endereco || '',
    municipio: env.PDV_EMPRESA_MUNICIPIO?.trim() || cache?.municipio || '',
    uf: (env.PDV_EMPRESA_UF?.trim() || cache?.uf || 'RS').toUpperCase(),
    ambiente: (
      env.PDV_FISCAL_AMBIENTE?.trim() ||
      cache?.ambiente ||
      'HOMOLOGACAO'
    ).toUpperCase(),
    urlConsulta:
      env.PDV_NFCE_URL_CONSULTA?.trim() ||
      cache?.urlConsulta ||
      'www.sefaz.rs.gov.br/nfce/consulta',
  }
}

export function lerEmitenteCache(conexao?: ConexaoSqlite): EmitenteDanfeNfce | null {
  try {
    const banco = conexao ?? obterConexaoBancoLocal()
    const bruto = consultarValorMetadata(banco, CHAVE_EMITENTE_FISCAL)
    if (!bruto) {
      return null
    }

    const lido = JSON.parse(bruto) as EmitenteDanfeNfce
    return lido && typeof lido === 'object' ? lido : null
  } catch {
    return null
  }
}
