import { randomUUID } from 'node:crypto'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import type { PizzaTamanho } from '@shared/types/pizza'
import {
  persistirConexaoBanco,
  type ConexaoSqlite,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import {
  mapearLinhaPizzaTamanho,
  obterColunasPizzaTamanho,
  type LinhaPizzaTamanhoSql,
} from '../types/pizza.types'

export class PizzaTamanhoRepository {
  constructor(private readonly obterConexao = obterConexaoBancoLocal) {}

  buscarPorId(tamanhoId: string): PizzaTamanho | null {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT ${obterColunasPizzaTamanho()}
       FROM pizza_tamanho
       WHERE id = ?
       LIMIT 1`,
    )
    consulta.bind([tamanhoId])

    if (!consulta.step()) {
      consulta.free()
      return null
    }

    const linha = consulta.getAsObject() as unknown as LinhaPizzaTamanhoSql
    consulta.free()
    return mapearLinhaPizzaTamanho(linha)
  }

  listar(filtros?: { apenasAtivas?: boolean }): PizzaTamanho[] {
    const conexao = this.obterConexao()
    const condicoes: string[] = []
    const parametros: (string | number)[] = []

    if (filtros?.apenasAtivas) {
      condicoes.push('ativa = ?')
      parametros.push(1)
    }

    const where = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : ''
    const consulta = conexao.instancia.prepare(
      `SELECT ${obterColunasPizzaTamanho()}
       FROM pizza_tamanho
       ${where}
       ORDER BY ordem ASC, nome ASC`,
    )
    consulta.bind(parametros)

    const tamanhos: PizzaTamanho[] = []
    while (consulta.step()) {
      const linha = consulta.getAsObject() as unknown as LinhaPizzaTamanhoSql
      tamanhos.push(mapearLinhaPizzaTamanho(linha))
    }
    consulta.free()
    return tamanhos
  }

  inserir(dados: {
    nome: string
    sigla: string
    maximoSabores: number
    ordem: number
  }): PizzaTamanho {
    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()
    const tamanho: PizzaTamanho = {
      id: randomUUID(),
      nome: dados.nome,
      sigla: dados.sigla,
      maximoSabores: dados.maximoSabores,
      ativa: true,
      ordem: dados.ordem,
      criadoEm: agora,
      atualizadoEm: agora,
    }

    conexao.instancia.run(
      `INSERT INTO pizza_tamanho (
         id, nome, sigla, maximo_sabores, ativa, ordem, criado_em, atualizado_em
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tamanho.id,
        tamanho.nome,
        tamanho.sigla,
        tamanho.maximoSabores,
        1,
        tamanho.ordem,
        tamanho.criadoEm,
        tamanho.atualizadoEm,
      ],
    )

    persistirConexaoBanco(conexao)
    return tamanho
  }

  atualizar(dados: {
    tamanhoId: string
    nome?: string
    sigla?: string
    maximoSabores?: number
    ativa?: boolean
    ordem?: number
  }): PizzaTamanho {
    const existente = this.buscarPorId(dados.tamanhoId)
    if (!existente) {
      throw new Error('Tamanho de pizza nao encontrado.')
    }

    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()
    const atualizado: PizzaTamanho = {
      ...existente,
      nome: dados.nome ?? existente.nome,
      sigla: dados.sigla ?? existente.sigla,
      maximoSabores: dados.maximoSabores ?? existente.maximoSabores,
      ativa: dados.ativa ?? existente.ativa,
      ordem: dados.ordem ?? existente.ordem,
      atualizadoEm: agora,
    }

    conexao.instancia.run(
      `UPDATE pizza_tamanho
       SET nome = ?, sigla = ?, maximo_sabores = ?, ativa = ?, ordem = ?, atualizado_em = ?
       WHERE id = ?`,
      [
        atualizado.nome,
        atualizado.sigla,
        atualizado.maximoSabores,
        atualizado.ativa ? 1 : 0,
        atualizado.ordem,
        agora,
        dados.tamanhoId,
      ],
    )

    persistirConexaoBanco(conexao)
    return atualizado
  }
}

export function criarPizzaTamanhoRepository(
  conexao?: ConexaoSqlite,
): PizzaTamanhoRepository {
  if (conexao) {
    return new PizzaTamanhoRepository(() => conexao)
  }
  return new PizzaTamanhoRepository()
}
