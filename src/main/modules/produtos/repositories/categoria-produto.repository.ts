import { randomUUID } from 'node:crypto'
import {
  persistirConexaoBanco,
  type ConexaoSqlite,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import type { CategoriaProduto } from '@shared/types/categoria-produto'
import {
  mapearLinhaCategoriaProduto,
  obterColunasCategoriaProduto,
  type LinhaCategoriaProdutoSql,
} from '../types/produto.types'

export class CategoriaProdutoRepository {
  constructor(private readonly obterConexao = obterConexaoBancoLocal) {}

  private buscarPorConsulta(
    sql: string,
    parametros: (string | number | null)[] = [],
  ): CategoriaProduto | null {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(sql)
    consulta.bind(parametros)

    if (!consulta.step()) {
      consulta.free()
      return null
    }

    const linha = consulta.getAsObject() as unknown as LinhaCategoriaProdutoSql
    consulta.free()

    return mapearLinhaCategoriaProduto(linha)
  }

  buscarPorId(categoriaId: string): CategoriaProduto | null {
    return this.buscarPorConsulta(
      `SELECT ${obterColunasCategoriaProduto()}
       FROM categoria_produto
       WHERE id = ?
       LIMIT 1`,
      [categoriaId],
    )
  }

  listar(filtros?: { apenasAtivas?: boolean }): CategoriaProduto[] {
    const conexao = this.obterConexao()
    const condicoes: string[] = []
    const parametros: (string | number)[] = []

    if (filtros?.apenasAtivas) {
      condicoes.push('ativo = ?')
      parametros.push(1)
    }

    const where = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : ''
    const consulta = conexao.instancia.prepare(
      `SELECT ${obterColunasCategoriaProduto()}
       FROM categoria_produto
       ${where}
       ORDER BY nome ASC`,
    )
    consulta.bind(parametros)

    const categorias: CategoriaProduto[] = []

    while (consulta.step()) {
      const linha = consulta.getAsObject() as unknown as LinhaCategoriaProdutoSql
      categorias.push(mapearLinhaCategoriaProduto(linha))
    }

    consulta.free()
    return categorias
  }

  inserir(dados: { nome: string; descricao: string | null }): CategoriaProduto {
    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()
    const categoria: CategoriaProduto = {
      id: randomUUID(),
      nome: dados.nome,
      descricao: dados.descricao,
      setorImpressao: null,
      ativo: true,
      criadoEm: agora,
      atualizadoEm: agora,
    }

    conexao.instancia.run(
      `INSERT INTO categoria_produto (
         id, nome, descricao, setor_impressao, ativo, criado_em, atualizado_em
       ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        categoria.id,
        categoria.nome,
        categoria.descricao,
        null,
        1,
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
  }): CategoriaProduto {
    const conexao = this.obterConexao()
    const existente = this.buscarPorId(dados.categoriaId)

    if (!existente) {
      throw new Error('Categoria nao encontrada.')
    }

    const agora = agoraEmIsoUtc()
    const atualizada: CategoriaProduto = {
      ...existente,
      nome: dados.nome ?? existente.nome,
      descricao: dados.descricao !== undefined ? dados.descricao : existente.descricao,
      atualizadoEm: agora,
    }

    conexao.instancia.run(
      `UPDATE categoria_produto
       SET nome = ?, descricao = ?, atualizado_em = ?
       WHERE id = ?`,
      [atualizada.nome, atualizada.descricao, agora, dados.categoriaId],
    )

    persistirConexaoBanco(conexao)
    return atualizada
  }

  inativar(categoriaId: string): CategoriaProduto {
    const conexao = this.obterConexao()
    const existente = this.buscarPorId(categoriaId)

    if (!existente) {
      throw new Error('Categoria nao encontrada.')
    }

    const agora = agoraEmIsoUtc()

    conexao.instancia.run(
      `UPDATE categoria_produto
       SET ativo = ?, atualizado_em = ?
       WHERE id = ?`,
      [0, agora, categoriaId],
    )

    persistirConexaoBanco(conexao)

    return {
      ...existente,
      ativo: false,
      atualizadoEm: agora,
    }
  }

  reativar(categoriaId: string): CategoriaProduto {
    const conexao = this.obterConexao()
    const existente = this.buscarPorId(categoriaId)

    if (!existente) {
      throw new Error('Categoria nao encontrada.')
    }

    const agora = agoraEmIsoUtc()

    conexao.instancia.run(
      `UPDATE categoria_produto
       SET ativo = ?, atualizado_em = ?
       WHERE id = ?`,
      [1, agora, categoriaId],
    )

    persistirConexaoBanco(conexao)

    return {
      ...existente,
      ativo: true,
      atualizadoEm: agora,
    }
  }

  atualizarSetorImpressao(
    categoriaId: string,
    setorImpressao: CategoriaProduto['setorImpressao'],
  ): CategoriaProduto {
    const conexao = this.obterConexao()
    const existente = this.buscarPorId(categoriaId)

    if (!existente) {
      throw new Error('Categoria nao encontrada.')
    }

    const agora = agoraEmIsoUtc()

    conexao.instancia.run(
      `UPDATE categoria_produto
       SET setor_impressao = ?, atualizado_em = ?
       WHERE id = ?`,
      [setorImpressao, agora, categoriaId],
    )

    persistirConexaoBanco(conexao)

    return {
      ...existente,
      setorImpressao,
      atualizadoEm: agora,
    }
  }

  excluir(categoriaId: string): void {
    const existente = this.buscarPorId(categoriaId)

    if (!existente) {
      throw new Error('Categoria nao encontrada.')
    }

    const conexao = this.obterConexao()
    conexao.instancia.run(`DELETE FROM categoria_produto WHERE id = ?`, [categoriaId])
    persistirConexaoBanco(conexao)
  }
}

export function criarCategoriaProdutoRepository(
  conexao?: ConexaoSqlite,
): CategoriaProdutoRepository {
  if (conexao) {
    return new CategoriaProdutoRepository(() => conexao)
  }

  return new CategoriaProdutoRepository()
}
