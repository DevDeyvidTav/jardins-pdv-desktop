import { randomUUID } from 'node:crypto'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import type { PizzaSaborPreco } from '@shared/types/pizza'
import {
  persistirConexaoBanco,
  type ConexaoSqlite,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import {
  mapearLinhaPizzaSaborPreco,
  obterColunasPizzaSaborPreco,
  type LinhaPizzaSaborPrecoSql,
} from '../types/pizza.types'

export class PizzaSaborPrecoRepository {
  constructor(private readonly obterConexao = obterConexaoBancoLocal) {}

  buscarPorSaborETamanho(
    saborId: string,
    tamanhoId: string,
  ): PizzaSaborPreco | null {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT ${obterColunasPizzaSaborPreco()}
       FROM pizza_sabor_preco
       WHERE pizza_sabor_id = ? AND pizza_tamanho_id = ?
       LIMIT 1`,
    )
    consulta.bind([saborId, tamanhoId])

    if (!consulta.step()) {
      consulta.free()
      return null
    }

    const linha = consulta.getAsObject() as unknown as LinhaPizzaSaborPrecoSql
    consulta.free()
    return mapearLinhaPizzaSaborPreco(linha)
  }

  buscarAtivoPorSaborETamanho(
    saborId: string,
    tamanhoId: string,
  ): PizzaSaborPreco | null {
    const preco = this.buscarPorSaborETamanho(saborId, tamanhoId)
    if (!preco || !preco.ativo) {
      return null
    }
    return preco
  }

  listarPorSabor(saborId: string, filtros?: { apenasAtivos?: boolean }): PizzaSaborPreco[] {
    const conexao = this.obterConexao()
    const condicoes = ['pizza_sabor_id = ?']
    const parametros: (string | number)[] = [saborId]

    if (filtros?.apenasAtivos) {
      condicoes.push('ativo = ?')
      parametros.push(1)
    }

    const consulta = conexao.instancia.prepare(
      `SELECT ${obterColunasPizzaSaborPreco()}
       FROM pizza_sabor_preco
       WHERE ${condicoes.join(' AND ')}
       ORDER BY criado_em ASC`,
    )
    consulta.bind(parametros)

    const precos: PizzaSaborPreco[] = []
    while (consulta.step()) {
      const linha = consulta.getAsObject() as unknown as LinhaPizzaSaborPrecoSql
      precos.push(mapearLinhaPizzaSaborPreco(linha))
    }
    consulta.free()
    return precos
  }

  definir(dados: {
    saborId: string
    tamanhoId: string
    valorCentavos: number
  }): PizzaSaborPreco {
    const existente = this.buscarPorSaborETamanho(dados.saborId, dados.tamanhoId)
    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()

    if (existente) {
      conexao.instancia.run(
        `UPDATE pizza_sabor_preco
         SET valor_centavos = ?, ativo = 1, atualizado_em = ?
         WHERE id = ?`,
        [dados.valorCentavos, agora, existente.id],
      )
      persistirConexaoBanco(conexao)
      return {
        ...existente,
        valorCentavos: dados.valorCentavos,
        ativo: true,
        atualizadoEm: agora,
      }
    }

    const preco: PizzaSaborPreco = {
      id: randomUUID(),
      pizzaSaborId: dados.saborId,
      pizzaTamanhoId: dados.tamanhoId,
      valorCentavos: dados.valorCentavos,
      ativo: true,
      criadoEm: agora,
      atualizadoEm: agora,
    }

    conexao.instancia.run(
      `INSERT INTO pizza_sabor_preco (
         id, pizza_sabor_id, pizza_tamanho_id, valor_centavos, ativo, criado_em, atualizado_em
       ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        preco.id,
        preco.pizzaSaborId,
        preco.pizzaTamanhoId,
        preco.valorCentavos,
        1,
        preco.criadoEm,
        preco.atualizadoEm,
      ],
    )

    persistirConexaoBanco(conexao)
    return preco
  }
}

export function criarPizzaSaborPrecoRepository(
  conexao?: ConexaoSqlite,
): PizzaSaborPrecoRepository {
  if (conexao) {
    return new PizzaSaborPrecoRepository(() => conexao)
  }
  return new PizzaSaborPrecoRepository()
}
