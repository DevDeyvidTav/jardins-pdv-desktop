import { randomUUID } from 'node:crypto'
import {
  persistirConexaoBanco,
  type ConexaoSqlite,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import { STATUS_PEDIDO, TIPO_PEDIDO } from '@shared/types/pedido'
import type { Pedido } from '@shared/types/pedido'
import {
  mapearLinhaPedido,
  obterColunasPedido,
  type LinhaPedidoSql,
} from '../types/pedido.types'

export class PedidoRepository {
  constructor(private readonly obterConexao = obterConexaoBancoLocal) {}

  private buscarPorConsulta(
    sql: string,
    parametros: (string | number | null)[] = [],
  ): Pedido | null {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(sql)
    consulta.bind(parametros)

    if (!consulta.step()) {
      consulta.free()
      return null
    }

    const linha = consulta.getAsObject() as unknown as LinhaPedidoSql
    consulta.free()

    return mapearLinhaPedido(linha)
  }

  buscarPorId(pedidoId: string): Pedido | null {
    return this.buscarPorConsulta(
      `SELECT ${obterColunasPedido()} FROM pedido WHERE id = ? LIMIT 1`,
      [pedidoId],
    )
  }

  buscarPedidoAbertoPorMesa(mesaId: string): Pedido | null {
    return this.buscarPorConsulta(
      `SELECT ${obterColunasPedido()}
       FROM pedido
       WHERE mesa_id = ? AND status = ?
       LIMIT 1`,
      [mesaId, STATUS_PEDIDO.ABERTO],
    )
  }

  listarPedidosAbertos(): Pedido[] {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT ${obterColunasPedido()}
       FROM pedido
       WHERE status = ?
       ORDER BY criado_em ASC`,
    )
    consulta.bind([STATUS_PEDIDO.ABERTO])

    const pedidos: Pedido[] = []

    while (consulta.step()) {
      const linha = consulta.getAsObject() as unknown as LinhaPedidoSql
      pedidos.push(mapearLinhaPedido(linha))
    }

    consulta.free()
    return pedidos
  }

  inserir(dados: {
    sessaoCaixaId: string
    mesaId: string | null
    tipo: Pedido['tipo']
  }): Pedido {
    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()
    const pedido: Pedido = {
      id: randomUUID(),
      sessaoCaixaId: dados.sessaoCaixaId,
      mesaId: dados.mesaId,
      tipo: dados.tipo,
      status: STATUS_PEDIDO.ABERTO,
      subtotalCentavos: 0,
      descontoCentavos: 0,
      totalCentavos: 0,
      criadoEm: agora,
      atualizadoEm: agora,
      finalizadoEm: null,
      canceladoEm: null,
    }

    conexao.instancia.run(
      `INSERT INTO pedido (
         id, sessao_caixa_id, mesa_id, tipo, status,
         subtotal_centavos, desconto_centavos, total_centavos,
         criado_em, atualizado_em, finalizado_em, cancelado_em
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pedido.id,
        pedido.sessaoCaixaId,
        pedido.mesaId,
        pedido.tipo,
        pedido.status,
        pedido.subtotalCentavos,
        pedido.descontoCentavos,
        pedido.totalCentavos,
        pedido.criadoEm,
        pedido.atualizadoEm,
        pedido.finalizadoEm,
        pedido.canceladoEm,
      ],
    )

    persistirConexaoBanco(conexao)
    return pedido
  }

  atualizarTotais(dados: {
    pedidoId: string
    subtotalCentavos: number
    totalCentavos: number
  }): Pedido {
    const existente = this.buscarPorId(dados.pedidoId)

    if (!existente) {
      throw new Error('Pedido nao encontrado.')
    }

    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()

    conexao.instancia.run(
      `UPDATE pedido
       SET subtotal_centavos = ?, total_centavos = ?, atualizado_em = ?
       WHERE id = ?`,
      [dados.subtotalCentavos, dados.totalCentavos, agora, dados.pedidoId],
    )

    persistirConexaoBanco(conexao)

    return {
      ...existente,
      subtotalCentavos: dados.subtotalCentavos,
      totalCentavos: dados.totalCentavos,
      atualizadoEm: agora,
    }
  }

  cancelar(pedidoId: string): Pedido {
    const existente = this.buscarPorId(pedidoId)

    if (!existente) {
      throw new Error('Pedido nao encontrado.')
    }

    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()

    conexao.instancia.run(
      `UPDATE pedido
       SET status = ?, cancelado_em = ?, atualizado_em = ?
       WHERE id = ?`,
      [STATUS_PEDIDO.CANCELADO, agora, agora, pedidoId],
    )

    persistirConexaoBanco(conexao)

    return {
      ...existente,
      status: STATUS_PEDIDO.CANCELADO,
      canceladoEm: agora,
      atualizadoEm: agora,
    }
  }

  finalizar(pedidoId: string, persistir = true): Pedido {
    const existente = this.buscarPorId(pedidoId)

    if (!existente) {
      throw new Error('Pedido nao encontrado.')
    }

    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()

    conexao.instancia.run(
      `UPDATE pedido
       SET status = ?, finalizado_em = ?, atualizado_em = ?
       WHERE id = ?`,
      [STATUS_PEDIDO.FINALIZADO, agora, agora, pedidoId],
    )

    if (persistir) persistirConexaoBanco(conexao)

    return {
      ...existente,
      status: STATUS_PEDIDO.FINALIZADO,
      finalizadoEm: agora,
      atualizadoEm: agora,
    }
  }
}

export function criarPedidoRepository(conexao?: ConexaoSqlite): PedidoRepository {
  if (conexao) {
    return new PedidoRepository(() => conexao)
  }

  return new PedidoRepository()
}
