import { randomUUID } from 'node:crypto'
import {
  persistirConexaoBanco,
  type ConexaoSqlite,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import type { PedidoItem } from '@shared/types/pedido'
import {
  mapearLinhaPedidoItem,
  obterColunasPedidoItem,
  type LinhaPedidoItemSql,
} from '../types/pedido.types'
import { calcularTotalItemCentavos } from '../types/pedido-calculos.types'

export class PedidoItemRepository {
  constructor(private readonly obterConexao = obterConexaoBancoLocal) {}

  listarPorPedido(pedidoId: string, apenasAtivos = false): PedidoItem[] {
    const conexao = this.obterConexao()
    const condicaoAtivo = apenasAtivos ? 'AND cancelado_em IS NULL' : ''
    const consulta = conexao.instancia.prepare(
      `SELECT ${obterColunasPedidoItem()}
       FROM pedido_item
       WHERE pedido_id = ? ${condicaoAtivo}
       ORDER BY criado_em ASC`,
    )
    consulta.bind([pedidoId])

    const itens: PedidoItem[] = []

    while (consulta.step()) {
      const linha = consulta.getAsObject() as unknown as LinhaPedidoItemSql
      itens.push(mapearLinhaPedidoItem(linha))
    }

    consulta.free()
    return itens
  }

  buscarPorId(itemId: string): PedidoItem | null {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT ${obterColunasPedidoItem()} FROM pedido_item WHERE id = ? LIMIT 1`,
    )
    consulta.bind([itemId])

    if (!consulta.step()) {
      consulta.free()
      return null
    }

    const linha = consulta.getAsObject() as unknown as LinhaPedidoItemSql
    consulta.free()

    return mapearLinhaPedidoItem(linha)
  }

  somarTotaisAtivos(pedidoId: string): number {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT COALESCE(SUM(total_centavos), 0) AS total
       FROM pedido_item
       WHERE pedido_id = ? AND cancelado_em IS NULL`,
    )
    consulta.bind([pedidoId])

    if (!consulta.step()) {
      consulta.free()
      return 0
    }

    const linha = consulta.getAsObject() as { total: number }
    consulta.free()

    return linha.total ?? 0
  }

  inserir(dados: {
    pedidoId: string
    produtoId: string
    produtoNome: string
    quantidade: number
    precoUnitarioCentavos: number
    observacao: string | null
  }): PedidoItem {
    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()
    const totalCentavos = calcularTotalItemCentavos(
      dados.quantidade,
      dados.precoUnitarioCentavos,
    )

    const item: PedidoItem = {
      id: randomUUID(),
      pedidoId: dados.pedidoId,
      produtoId: dados.produtoId,
      produtoNome: dados.produtoNome,
      quantidade: dados.quantidade,
      precoUnitarioCentavos: dados.precoUnitarioCentavos,
      totalCentavos,
      observacao: dados.observacao,
      criadoEm: agora,
      atualizadoEm: agora,
      canceladoEm: null,
    }

    conexao.instancia.run(
      `INSERT INTO pedido_item (
         id, pedido_id, produto_id, produto_nome, quantidade,
         preco_unitario_centavos, total_centavos, observacao,
         criado_em, atualizado_em, cancelado_em
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.pedidoId,
        item.produtoId,
        item.produtoNome,
        item.quantidade,
        item.precoUnitarioCentavos,
        item.totalCentavos,
        item.observacao,
        item.criadoEm,
        item.atualizadoEm,
        item.canceladoEm,
      ],
    )

    persistirConexaoBanco(conexao)
    return item
  }

  atualizarQuantidade(itemId: string, quantidade: number): PedidoItem {
    const existente = this.buscarPorId(itemId)

    if (!existente) {
      throw new Error('Item nao encontrado.')
    }

    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()
    const totalCentavos = calcularTotalItemCentavos(
      quantidade,
      existente.precoUnitarioCentavos,
    )

    conexao.instancia.run(
      `UPDATE pedido_item
       SET quantidade = ?, total_centavos = ?, atualizado_em = ?
       WHERE id = ?`,
      [quantidade, totalCentavos, agora, itemId],
    )

    persistirConexaoBanco(conexao)

    return {
      ...existente,
      quantidade,
      totalCentavos,
      atualizadoEm: agora,
    }
  }

  cancelar(itemId: string): PedidoItem {
    const existente = this.buscarPorId(itemId)

    if (!existente) {
      throw new Error('Item nao encontrado.')
    }

    if (existente.canceladoEm) {
      return existente
    }

    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()

    conexao.instancia.run(
      `UPDATE pedido_item SET cancelado_em = ?, atualizado_em = ? WHERE id = ?`,
      [agora, agora, itemId],
    )

    persistirConexaoBanco(conexao)

    return { ...existente, canceladoEm: agora, atualizadoEm: agora }
  }

  cancelarItensAtivosPorPedido(pedidoId: string): void {
    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()

    conexao.instancia.run(
      `UPDATE pedido_item
       SET cancelado_em = ?, atualizado_em = ?
       WHERE pedido_id = ? AND cancelado_em IS NULL`,
      [agora, agora, pedidoId],
    )

    persistirConexaoBanco(conexao)
  }
}

export function criarPedidoItemRepository(
  conexao?: ConexaoSqlite,
): PedidoItemRepository {
  if (conexao) {
    return new PedidoItemRepository(() => conexao)
  }

  return new PedidoItemRepository()
}
