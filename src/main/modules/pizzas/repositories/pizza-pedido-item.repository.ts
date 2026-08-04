import { randomUUID } from 'node:crypto'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import type {
  PizzaPedidoItemResumo,
  RegraPrecificacaoPizza,
} from '@shared/types/pizza'
import {
  persistirConexaoBanco,
  type ConexaoSqlite,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import {
  mapearLinhaPizzaPedidoItem,
  mapearLinhaPizzaPedidoItemSabor,
  obterColunasPizzaPedidoItem,
  obterColunasPizzaPedidoItemSabor,
  type LinhaPizzaPedidoItemSql,
  type LinhaPizzaPedidoItemSaborSql,
} from '../types/pizza.types'

export class PizzaPedidoItemRepository {
  constructor(private readonly obterConexao = obterConexaoBancoLocal) {}

  private listarSaboresPorPizzaPedidoItemId(
    pizzaPedidoItemId: string,
  ): import('@shared/types/pizza').PizzaPedidoItemSaborResumo[] {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT ${obterColunasPizzaPedidoItemSabor()}
       FROM pizza_pedido_item_sabor
       WHERE pizza_pedido_item_id = ?
       ORDER BY ordem ASC`,
    )
    consulta.bind([pizzaPedidoItemId])

    const sabores: import('@shared/types/pizza').PizzaPedidoItemSaborResumo[] = []
    while (consulta.step()) {
      const linha = consulta.getAsObject() as unknown as LinhaPizzaPedidoItemSaborSql
      sabores.push(mapearLinhaPizzaPedidoItemSabor(linha))
    }
    consulta.free()
    return sabores
  }

  buscarPorPedidoItemId(pedidoItemId: string): PizzaPedidoItemResumo | null {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT ${obterColunasPizzaPedidoItem()}
       FROM pizza_pedido_item
       WHERE pedido_item_id = ?
       LIMIT 1`,
    )
    consulta.bind([pedidoItemId])

    if (!consulta.step()) {
      consulta.free()
      return null
    }

    const linha = consulta.getAsObject() as unknown as LinhaPizzaPedidoItemSql
    consulta.free()
    const sabores = this.listarSaboresPorPizzaPedidoItemId(linha.id)
    return mapearLinhaPizzaPedidoItem(linha, sabores)
  }

  listarPorPedidoItemIds(pedidoItemIds: string[]): Map<string, PizzaPedidoItemResumo> {
    const mapa = new Map<string, PizzaPedidoItemResumo>()
    if (pedidoItemIds.length === 0) {
      return mapa
    }

    for (const pedidoItemId of pedidoItemIds) {
      const pizza = this.buscarPorPedidoItemId(pedidoItemId)
      if (pizza) {
        mapa.set(pedidoItemId, pizza)
      }
    }

    return mapa
  }

  inserir(dados: {
    pedidoItemId: string
    pizzaCategoriaId: string
    pizzaTamanhoId: string
    regraPrecificacaoSnapshot: RegraPrecificacaoPizza
    valorCalculadoCentavos: number
    observacao: string | null
    categoriaNomeSnapshot: string
    tamanhoNomeSnapshot: string
    sabores: Array<{
      pizzaSaborId: string
      saborNomeSnapshot: string
      valorSaborSnapshotCentavos: number
      ordem: number
    }>
  }): PizzaPedidoItemResumo {
    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()
    const pizzaPedidoItemId = randomUUID()

    conexao.instancia.run(
      `INSERT INTO pizza_pedido_item (
         id, pedido_item_id, pizza_categoria_id, pizza_tamanho_id,
         regra_precificacao_snapshot, valor_calculado_centavos, observacao,
         categoria_nome_snapshot, tamanho_nome_snapshot, criado_em, atualizado_em
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pizzaPedidoItemId,
        dados.pedidoItemId,
        dados.pizzaCategoriaId,
        dados.pizzaTamanhoId,
        dados.regraPrecificacaoSnapshot,
        dados.valorCalculadoCentavos,
        dados.observacao,
        dados.categoriaNomeSnapshot,
        dados.tamanhoNomeSnapshot,
        agora,
        agora,
      ],
    )

    const saboresResumo: import('@shared/types/pizza').PizzaPedidoItemSaborResumo[] = []

    for (const sabor of dados.sabores) {
      const saborId = randomUUID()
      conexao.instancia.run(
        `INSERT INTO pizza_pedido_item_sabor (
           id, pizza_pedido_item_id, pizza_sabor_id, sabor_nome_snapshot,
           valor_sabor_snapshot_centavos, ordem, criado_em
         ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          saborId,
          pizzaPedidoItemId,
          sabor.pizzaSaborId,
          sabor.saborNomeSnapshot,
          sabor.valorSaborSnapshotCentavos,
          sabor.ordem,
          agora,
        ],
      )
      saboresResumo.push({
        id: saborId,
        pizzaSaborId: sabor.pizzaSaborId,
        saborNomeSnapshot: sabor.saborNomeSnapshot,
        valorSaborSnapshotCentavos: sabor.valorSaborSnapshotCentavos,
        ordem: sabor.ordem,
      })
    }

    persistirConexaoBanco(conexao)

    return {
      id: pizzaPedidoItemId,
      pedidoItemId: dados.pedidoItemId,
      pizzaCategoriaId: dados.pizzaCategoriaId,
      pizzaTamanhoId: dados.pizzaTamanhoId,
      regraPrecificacaoSnapshot: dados.regraPrecificacaoSnapshot,
      valorCalculadoCentavos: dados.valorCalculadoCentavos,
      observacao: dados.observacao,
      categoriaNomeSnapshot: dados.categoriaNomeSnapshot,
      tamanhoNomeSnapshot: dados.tamanhoNomeSnapshot,
      sabores: saboresResumo,
    }
  }
}

export function criarPizzaPedidoItemRepository(
  conexao?: ConexaoSqlite,
): PizzaPedidoItemRepository {
  if (conexao) {
    return new PizzaPedidoItemRepository(() => conexao)
  }
  return new PizzaPedidoItemRepository()
}
