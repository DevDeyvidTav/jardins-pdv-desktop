import { randomUUID } from 'node:crypto'
import {
  persistirConexaoBanco,
  type ConexaoSqlite,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import type { Produto, ProdutoComCategoria } from '@shared/types/produto'
import {
  mapearLinhaProduto,
  mapearLinhaProdutoComCategoria,
  obterColunasProduto,
  type LinhaProdutoComCategoriaSql,
  type LinhaProdutoSql,
} from '../types/produto.types'

interface FiltrosProduto {
  categoriaId?: string
  apenasAtivos?: boolean
  termo?: string
}

export class ProdutoRepository {
  constructor(private readonly obterConexao = obterConexaoBancoLocal) {}

  private buscarPorConsulta(
    sql: string,
    parametros: (string | number | null)[] = [],
  ): Produto | null {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(sql)
    consulta.bind(parametros)

    if (!consulta.step()) {
      consulta.free()
      return null
    }

    const linha = consulta.getAsObject() as unknown as LinhaProdutoSql
    consulta.free()

    return mapearLinhaProduto(linha)
  }

  buscarPorId(produtoId: string): Produto | null {
    return this.buscarPorConsulta(
      `SELECT ${obterColunasProduto()}
       FROM produto
       WHERE id = ?
       LIMIT 1`,
      [produtoId],
    )
  }

  private montarFiltros(filtros: FiltrosProduto = {}): {
    condicoes: string[]
    parametros: (string | number)[]
  } {
    const condicoes: string[] = []
    const parametros: (string | number)[] = []

    if (filtros.apenasAtivos) {
      condicoes.push('p.ativo = ?')
      parametros.push(1)
    }

    if (filtros.categoriaId) {
      condicoes.push('p.categoria_id = ?')
      parametros.push(filtros.categoriaId)
    }

    if (filtros.termo && filtros.termo.trim() !== '') {
      condicoes.push('LOWER(p.nome) LIKE LOWER(?)')
      parametros.push(`%${filtros.termo.trim()}%`)
    }

    return { condicoes, parametros }
  }

  listarComCategoria(filtros: FiltrosProduto = {}): ProdutoComCategoria[] {
    const conexao = this.obterConexao()
    const { condicoes, parametros } = this.montarFiltros(filtros)
    const where = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : ''

    const consulta = conexao.instancia.prepare(
      `SELECT p.id, p.categoria_id, p.nome, p.descricao, p.preco_centavos,
              p.ativo, p.criado_em, p.atualizado_em, c.nome AS categoria_nome
       FROM produto p
       INNER JOIN categoria_produto c ON c.id = p.categoria_id
       ${where}
       ORDER BY p.nome ASC`,
    )
    consulta.bind(parametros)

    const produtos: ProdutoComCategoria[] = []

    while (consulta.step()) {
      const linha = consulta.getAsObject() as unknown as LinhaProdutoComCategoriaSql
      produtos.push(mapearLinhaProdutoComCategoria(linha))
    }

    consulta.free()
    return produtos
  }

  inserir(dados: {
    categoriaId: string
    nome: string
    descricao: string | null
    precoCentavos: number
  }): Produto {
    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()
    const produto: Produto = {
      id: randomUUID(),
      categoriaId: dados.categoriaId,
      nome: dados.nome,
      descricao: dados.descricao,
      precoCentavos: dados.precoCentavos,
      ativo: true,
      criadoEm: agora,
      atualizadoEm: agora,
    }

    conexao.instancia.run(
      `INSERT INTO produto (
         id, categoria_id, nome, descricao, preco_centavos, ativo, criado_em, atualizado_em
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        produto.id,
        produto.categoriaId,
        produto.nome,
        produto.descricao,
        produto.precoCentavos,
        1,
        produto.criadoEm,
        produto.atualizadoEm,
      ],
    )

    persistirConexaoBanco(conexao)
    return produto
  }

  atualizar(dados: {
    produtoId: string
    categoriaId?: string
    nome?: string
    descricao?: string | null
    precoCentavos?: number
  }): Produto {
    const conexao = this.obterConexao()
    const existente = this.buscarPorId(dados.produtoId)

    if (!existente) {
      throw new Error('Produto nao encontrado.')
    }

    const agora = agoraEmIsoUtc()
    const atualizado: Produto = {
      ...existente,
      categoriaId: dados.categoriaId ?? existente.categoriaId,
      nome: dados.nome ?? existente.nome,
      descricao: dados.descricao !== undefined ? dados.descricao : existente.descricao,
      precoCentavos: dados.precoCentavos ?? existente.precoCentavos,
      atualizadoEm: agora,
    }

    conexao.instancia.run(
      `UPDATE produto
       SET categoria_id = ?, nome = ?, descricao = ?, preco_centavos = ?, atualizado_em = ?
       WHERE id = ?`,
      [
        atualizado.categoriaId,
        atualizado.nome,
        atualizado.descricao,
        atualizado.precoCentavos,
        agora,
        dados.produtoId,
      ],
    )

    persistirConexaoBanco(conexao)
    return atualizado
  }

  inativar(produtoId: string): Produto {
    const conexao = this.obterConexao()
    const existente = this.buscarPorId(produtoId)

    if (!existente) {
      throw new Error('Produto nao encontrado.')
    }

    const agora = agoraEmIsoUtc()

    conexao.instancia.run(
      `UPDATE produto
       SET ativo = ?, atualizado_em = ?
       WHERE id = ?`,
      [0, agora, produtoId],
    )

    persistirConexaoBanco(conexao)

    return {
      ...existente,
      ativo: false,
      atualizadoEm: agora,
    }
  }

  /** Soft delete em lote de todos os produtos ativos da categoria. */
  inativarPorCategoria(categoriaId: string): void {
    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()

    conexao.instancia.run(
      `UPDATE produto
       SET ativo = ?, atualizado_em = ?
       WHERE categoria_id = ? AND ativo = 1`,
      [0, agora, categoriaId],
    )

    persistirConexaoBanco(conexao)
  }

  reativar(produtoId: string): Produto {
    const conexao = this.obterConexao()
    const existente = this.buscarPorId(produtoId)

    if (!existente) {
      throw new Error('Produto nao encontrado.')
    }

    const agora = agoraEmIsoUtc()

    conexao.instancia.run(
      `UPDATE produto
       SET ativo = ?, atualizado_em = ?
       WHERE id = ?`,
      [1, agora, produtoId],
    )

    persistirConexaoBanco(conexao)

    return {
      ...existente,
      ativo: true,
      atualizadoEm: agora,
    }
  }

  contarPorCategoria(categoriaId: string): number {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT COUNT(*) AS total FROM produto WHERE categoria_id = ?`,
    )
    consulta.bind([categoriaId])

    if (!consulta.step()) {
      consulta.free()
      return 0
    }

    const linha = consulta.getAsObject() as { total: number }
    consulta.free()
    return Number(linha.total) || 0
  }

  estaReferenciadoEmPedido(produtoId: string): boolean {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT 1 AS existe FROM pedido_item WHERE produto_id = ? LIMIT 1`,
    )
    consulta.bind([produtoId])
    const existe = consulta.step()
    consulta.free()
    return existe
  }

  excluir(produtoId: string): void {
    const existente = this.buscarPorId(produtoId)

    if (!existente) {
      throw new Error('Produto nao encontrado.')
    }

    const conexao = this.obterConexao()
    conexao.instancia.run(`DELETE FROM produto WHERE id = ?`, [produtoId])
    persistirConexaoBanco(conexao)
  }
}

export function criarProdutoRepository(conexao?: ConexaoSqlite): ProdutoRepository {
  if (conexao) {
    return new ProdutoRepository(() => conexao)
  }

  return new ProdutoRepository()
}
