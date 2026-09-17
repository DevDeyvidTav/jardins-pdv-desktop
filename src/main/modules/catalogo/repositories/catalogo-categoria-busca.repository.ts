import type {
  BuscarCategoriasCatalogoEntrada,
  CategoriaCatalogo,
  TipoCategoriaCatalogo,
} from '@shared/types/categoria-catalogo'
import { montarConsultaFts } from '@shared/utils/fts-consulta'
import {
  type ConexaoSqlite,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'

const LIMITE_PADRAO = 40

function mapearLinha(linha: {
  id: string
  tipo: string
  nome: string
}): CategoriaCatalogo {
  return {
    id: linha.id,
    tipo: linha.tipo as TipoCategoriaCatalogo,
    nome: linha.nome,
  }
}

export class CatalogoCategoriaBuscaRepository {
  constructor(private readonly obterConexao = obterConexaoBancoLocal) {}

  buscar(entrada: BuscarCategoriasCatalogoEntrada = {}): CategoriaCatalogo[] {
    const conexao = this.obterConexao()
    const limite = entrada.limite ?? LIMITE_PADRAO
    const consultaFts = montarConsultaFts(entrada.termo ?? '')

    if (!consultaFts) {
      return this.listarAtivas(conexao, limite)
    }

    const stmt = conexao.nativo.prepare(
      `SELECT id, tipo, nome
       FROM catalogo_categoria_fts
       WHERE catalogo_categoria_fts MATCH ?
         AND ativo = 1
       ORDER BY rank, nome ASC
       LIMIT ?`,
    )

    return stmt.all(consultaFts, limite).map((linha) =>
      mapearLinha(linha as { id: string; tipo: string; nome: string }),
    )
  }

  private listarAtivas(conexao: ConexaoSqlite, limite: number): CategoriaCatalogo[] {
    const stmt = conexao.nativo.prepare(
      `SELECT id, tipo, nome
       FROM catalogo_categoria_fts
       WHERE ativo = 1
       ORDER BY tipo ASC, nome ASC
       LIMIT ?`,
    )

    return stmt.all(limite).map((linha) =>
      mapearLinha(linha as { id: string; tipo: string; nome: string }),
    )
  }
}

export function criarCatalogoCategoriaBuscaRepository(
  conexao?: ConexaoSqlite,
): CatalogoCategoriaBuscaRepository {
  if (conexao) {
    return new CatalogoCategoriaBuscaRepository(() => conexao)
  }
  return new CatalogoCategoriaBuscaRepository()
}
