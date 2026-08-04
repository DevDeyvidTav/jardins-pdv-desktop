import { randomUUID } from 'node:crypto'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import type { PizzaSabor } from '@shared/types/pizza'
import {
  persistirConexaoBanco,
  type ConexaoSqlite,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import {
  mapearLinhaPizzaSabor,
  obterColunasPizzaSabor,
  type LinhaPizzaSaborSql,
} from '../types/pizza.types'

export class PizzaSaborRepository {
  constructor(private readonly obterConexao = obterConexaoBancoLocal) {}

  buscarPorId(saborId: string): PizzaSabor | null {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT ${obterColunasPizzaSabor()}
       FROM pizza_sabor
       WHERE id = ?
       LIMIT 1`,
    )
    consulta.bind([saborId])

    if (!consulta.step()) {
      consulta.free()
      return null
    }

    const linha = consulta.getAsObject() as unknown as LinhaPizzaSaborSql
    consulta.free()
    return mapearLinhaPizzaSabor(linha)
  }

  listar(filtros?: { apenasAtivos?: boolean }): PizzaSabor[] {
    const conexao = this.obterConexao()
    const condicoes: string[] = []
    const parametros: (string | number)[] = []

    if (filtros?.apenasAtivos) {
      condicoes.push('ativa = ?')
      parametros.push(1)
    }

    const where = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : ''
    const consulta = conexao.instancia.prepare(
      `SELECT ${obterColunasPizzaSabor()}
       FROM pizza_sabor
       ${where}
       ORDER BY ordem ASC, nome ASC`,
    )
    consulta.bind(parametros)

    const sabores: PizzaSabor[] = []
    while (consulta.step()) {
      const linha = consulta.getAsObject() as unknown as LinhaPizzaSaborSql
      sabores.push(mapearLinhaPizzaSabor(linha))
    }
    consulta.free()
    return sabores
  }

  inserir(dados: {
    nome: string
    descricao: string | null
    ordem: number
  }): PizzaSabor {
    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()
    const sabor: PizzaSabor = {
      id: randomUUID(),
      nome: dados.nome,
      descricao: dados.descricao,
      ativa: true,
      ordem: dados.ordem,
      criadoEm: agora,
      atualizadoEm: agora,
    }

    conexao.instancia.run(
      `INSERT INTO pizza_sabor (
         id, nome, descricao, ativa, ordem, criado_em, atualizado_em
       ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        sabor.id,
        sabor.nome,
        sabor.descricao,
        1,
        sabor.ordem,
        sabor.criadoEm,
        sabor.atualizadoEm,
      ],
    )

    persistirConexaoBanco(conexao)
    return sabor
  }

  atualizar(dados: {
    saborId: string
    nome?: string
    descricao?: string | null
    ativa?: boolean
    ordem?: number
  }): PizzaSabor {
    const existente = this.buscarPorId(dados.saborId)
    if (!existente) {
      throw new Error('Sabor de pizza nao encontrado.')
    }

    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()
    const atualizado: PizzaSabor = {
      ...existente,
      nome: dados.nome ?? existente.nome,
      descricao: dados.descricao !== undefined ? dados.descricao : existente.descricao,
      ativa: dados.ativa ?? existente.ativa,
      ordem: dados.ordem ?? existente.ordem,
      atualizadoEm: agora,
    }

    conexao.instancia.run(
      `UPDATE pizza_sabor
       SET nome = ?, descricao = ?, ativa = ?, ordem = ?, atualizado_em = ?
       WHERE id = ?`,
      [
        atualizado.nome,
        atualizado.descricao,
        atualizado.ativa ? 1 : 0,
        atualizado.ordem,
        agora,
        dados.saborId,
      ],
    )

    persistirConexaoBanco(conexao)
    return atualizado
  }

  listarPorCategoria(
    categoriaId: string,
    filtros?: { apenasAtivos?: boolean; apenasVinculoAtivo?: boolean },
  ): PizzaSabor[] {
    const conexao = this.obterConexao()
    const condicoes = ['pcs.pizza_categoria_id = ?']
    const parametros: (string | number)[] = [categoriaId]

    if (filtros?.apenasVinculoAtivo !== false) {
      condicoes.push('pcs.ativo = ?')
      parametros.push(1)
    }

    if (filtros?.apenasAtivos) {
      condicoes.push('s.ativa = ?')
      parametros.push(1)
    }

    const consulta = conexao.instancia.prepare(
      `SELECT ${obterColunasPizzaSabor('s')}
       FROM pizza_sabor s
       INNER JOIN pizza_categoria_sabor pcs ON pcs.pizza_sabor_id = s.id
       WHERE ${condicoes.join(' AND ')}
       ORDER BY s.ordem ASC, s.nome ASC`,
    )
    consulta.bind(parametros)

    const sabores: PizzaSabor[] = []
    while (consulta.step()) {
      const linha = consulta.getAsObject() as unknown as LinhaPizzaSaborSql
      sabores.push(mapearLinhaPizzaSabor(linha))
    }
    consulta.free()
    return sabores
  }

  listarIdsCategoriasDoSabor(saborId: string): string[] {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT pizza_categoria_id
       FROM pizza_categoria_sabor
       WHERE pizza_sabor_id = ? AND ativo = 1`,
    )
    consulta.bind([saborId])
    const ids: string[] = []
    while (consulta.step()) {
      const linha = consulta.getAsObject() as { pizza_categoria_id: string }
      ids.push(linha.pizza_categoria_id)
    }
    consulta.free()
    return ids
  }

  vinculoAtivoExiste(categoriaId: string, saborId: string): boolean {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT 1 AS existe
       FROM pizza_categoria_sabor
       WHERE pizza_categoria_id = ? AND pizza_sabor_id = ? AND ativo = 1
       LIMIT 1`,
    )
    consulta.bind([categoriaId, saborId])
    const existe = consulta.step()
    consulta.free()
    return existe
  }

  vincularCategoria(dados: {
    categoriaId: string
    saborId: string
    ativo: boolean
  }): void {
    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()
    const consulta = conexao.instancia.prepare(
      `SELECT pizza_categoria_id
       FROM pizza_categoria_sabor
       WHERE pizza_categoria_id = ? AND pizza_sabor_id = ?
       LIMIT 1`,
    )
    consulta.bind([dados.categoriaId, dados.saborId])
    const existe = consulta.step()
    consulta.free()

    if (existe) {
      conexao.instancia.run(
        `UPDATE pizza_categoria_sabor
         SET ativo = ?
         WHERE pizza_categoria_id = ? AND pizza_sabor_id = ?`,
        [dados.ativo ? 1 : 0, dados.categoriaId, dados.saborId],
      )
    } else {
      conexao.instancia.run(
        `INSERT INTO pizza_categoria_sabor (
           pizza_categoria_id, pizza_sabor_id, ativo, criado_em
         ) VALUES (?, ?, ?, ?)`,
        [dados.categoriaId, dados.saborId, dados.ativo ? 1 : 0, agora],
      )
    }

    persistirConexaoBanco(conexao)
  }
}

export function criarPizzaSaborRepository(
  conexao?: ConexaoSqlite,
): PizzaSaborRepository {
  if (conexao) {
    return new PizzaSaborRepository(() => conexao)
  }
  return new PizzaSaborRepository()
}
