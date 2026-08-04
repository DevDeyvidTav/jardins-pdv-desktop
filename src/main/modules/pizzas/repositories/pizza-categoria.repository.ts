import { randomUUID } from 'node:crypto'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import type { PizzaCategoria, RegraPrecificacaoPizza } from '@shared/types/pizza'
import {
  persistirConexaoBanco,
  type ConexaoSqlite,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import {
  mapearLinhaPizzaCategoria,
  obterColunasPizzaCategoria,
  type LinhaPizzaCategoriaSql,
} from '../types/pizza.types'

export class PizzaCategoriaRepository {
  constructor(private readonly obterConexao = obterConexaoBancoLocal) {}

  buscarPorId(categoriaId: string): PizzaCategoria | null {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT ${obterColunasPizzaCategoria()}
       FROM pizza_categoria
       WHERE id = ?
       LIMIT 1`,
    )
    consulta.bind([categoriaId])

    if (!consulta.step()) {
      consulta.free()
      return null
    }

    const linha = consulta.getAsObject() as unknown as LinhaPizzaCategoriaSql
    consulta.free()
    return mapearLinhaPizzaCategoria(linha)
  }

  listar(filtros?: { apenasAtivas?: boolean }): PizzaCategoria[] {
    const conexao = this.obterConexao()
    const condicoes: string[] = []
    const parametros: (string | number)[] = []

    if (filtros?.apenasAtivas) {
      condicoes.push('ativa = ?')
      parametros.push(1)
    }

    const where = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : ''
    const consulta = conexao.instancia.prepare(
      `SELECT ${obterColunasPizzaCategoria()}
       FROM pizza_categoria
       ${where}
       ORDER BY ordem ASC, nome ASC`,
    )
    consulta.bind(parametros)

    const categorias: PizzaCategoria[] = []
    while (consulta.step()) {
      const linha = consulta.getAsObject() as unknown as LinhaPizzaCategoriaSql
      categorias.push(mapearLinhaPizzaCategoria(linha))
    }
    consulta.free()
    return categorias
  }

  inserir(dados: {
    nome: string
    descricao: string | null
    regraPrecificacao: RegraPrecificacaoPizza
    ordem: number
  }): PizzaCategoria {
    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()
    const categoria: PizzaCategoria = {
      id: randomUUID(),
      nome: dados.nome,
      descricao: dados.descricao,
      regraPrecificacao: dados.regraPrecificacao,
      ativa: true,
      ordem: dados.ordem,
      criadoEm: agora,
      atualizadoEm: agora,
    }

    conexao.instancia.run(
      `INSERT INTO pizza_categoria (
         id, nome, descricao, regra_precificacao, ativa, ordem, criado_em, atualizado_em
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        categoria.id,
        categoria.nome,
        categoria.descricao,
        categoria.regraPrecificacao,
        1,
        categoria.ordem,
        categoria.criadoEm,
        categoria.atualizadoEm,
      ],
    )

    persistirConexaoBanco(conexao)
    return categoria
  }

  atualizar(dados: {
    categoriaId: string
    nome?: string
    descricao?: string | null
    regraPrecificacao?: RegraPrecificacaoPizza
    ativa?: boolean
    ordem?: number
  }): PizzaCategoria {
    const existente = this.buscarPorId(dados.categoriaId)
    if (!existente) {
      throw new Error('Categoria de pizza nao encontrada.')
    }

    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()
    const atualizada: PizzaCategoria = {
      ...existente,
      nome: dados.nome ?? existente.nome,
      descricao: dados.descricao !== undefined ? dados.descricao : existente.descricao,
      regraPrecificacao: dados.regraPrecificacao ?? existente.regraPrecificacao,
      ativa: dados.ativa ?? existente.ativa,
      ordem: dados.ordem ?? existente.ordem,
      atualizadoEm: agora,
    }

    conexao.instancia.run(
      `UPDATE pizza_categoria
       SET nome = ?, descricao = ?, regra_precificacao = ?, ativa = ?, ordem = ?, atualizado_em = ?
       WHERE id = ?`,
      [
        atualizada.nome,
        atualizada.descricao,
        atualizada.regraPrecificacao,
        atualizada.ativa ? 1 : 0,
        atualizada.ordem,
        agora,
        dados.categoriaId,
      ],
    )

    persistirConexaoBanco(conexao)
    return atualizada
  }
}

export function criarPizzaCategoriaRepository(
  conexao?: ConexaoSqlite,
): PizzaCategoriaRepository {
  if (conexao) {
    return new PizzaCategoriaRepository(() => conexao)
  }
  return new PizzaCategoriaRepository()
}
