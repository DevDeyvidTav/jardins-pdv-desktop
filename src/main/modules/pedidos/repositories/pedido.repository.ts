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

  buscarPedidoAbertoBalcao(): Pedido | null {
    return this.buscarPorConsulta(
      `SELECT ${obterColunasPedido()}
       FROM pedido
       WHERE tipo = ? AND status = ?
       ORDER BY criado_em DESC
       LIMIT 1`,
      [TIPO_PEDIDO.BALCAO, STATUS_PEDIDO.ABERTO],
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

  listarHistorico(filtros: {
    status: 'TODOS' | 'FINALIZADO' | 'CANCELADO'
    formaPagamento: string
  }): Array<{
    pedido: Pedido
    mesaNumero: number | null
    formasPagamento: string[]
    totalPagoCentavos: number
  }> {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT
         p.id, p.sessao_caixa_id, p.mesa_id, p.tipo, p.status,
         p.subtotal_centavos, p.desconto_centavos, p.total_centavos,
         p.desconto_itens_centavos, p.desconto_pedido_centavos,
         p.valor_pago_centavos, p.valor_cortesia_centavos, p.valor_restante_centavos,
         p.criado_em, p.atualizado_em, p.finalizado_em, p.cancelado_em,
         m.numero AS mesa_numero,
         COALESCE(GROUP_CONCAT(DISTINCT CASE
           WHEN pg.status = 'CONFIRMADO' AND pg.cancelado_em IS NULL
           THEN pg.forma_pagamento END), '') AS formas_pagamento,
         COALESCE(SUM(CASE
           WHEN pg.status = 'CONFIRMADO' AND pg.cancelado_em IS NULL
           THEN pg.valor_centavos ELSE 0 END), 0) AS total_pago_centavos
       FROM pedido p
       LEFT JOIN mesa m ON m.id = p.mesa_id
       LEFT JOIN pagamento_pedido pg ON pg.pedido_id = p.id
       WHERE p.status IN ('FINALIZADO', 'CANCELADO')
         AND (? = 'TODOS' OR p.status = ?)
         AND (
           ? = ''
           OR EXISTS (
             SELECT 1
             FROM pagamento_pedido pg2
             WHERE pg2.pedido_id = p.id
               AND pg2.forma_pagamento = ?
               AND pg2.status = 'CONFIRMADO'
               AND pg2.cancelado_em IS NULL
           )
         )
       GROUP BY p.id
       ORDER BY COALESCE(p.finalizado_em, p.cancelado_em, p.atualizado_em) DESC`,
    )

    consulta.bind([
      filtros.status,
      filtros.status,
      filtros.formaPagamento,
      filtros.formaPagamento,
    ])

    const itens: Array<{
      pedido: Pedido
      mesaNumero: number | null
      formasPagamento: string[]
      totalPagoCentavos: number
    }> = []

    while (consulta.step()) {
      const linha = consulta.getAsObject() as unknown as LinhaPedidoSql & {
        mesa_numero: number | null
        formas_pagamento: string
        total_pago_centavos: number
      }

      itens.push({
        pedido: mapearLinhaPedido(linha),
        mesaNumero: linha.mesa_numero ?? null,
        formasPagamento: linha.formas_pagamento
          ? linha.formas_pagamento.split(',').filter(Boolean)
          : [],
        totalPagoCentavos: Number(linha.total_pago_centavos) || 0,
      })
    }

    consulta.free()
    return itens
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
      descontoItensCentavos: 0,
      descontoPedidoCentavos: 0,
      totalCentavos: 0,
      valorPagoCentavos: 0,
      valorCortesiaCentavos: 0,
      valorRestanteCentavos: 0,
      criadoEm: agora,
      atualizadoEm: agora,
      finalizadoEm: null,
      canceladoEm: null,
      motivoCancelamento: null,
    }

    conexao.instancia.run(
      `INSERT INTO pedido (
         id, sessao_caixa_id, mesa_id, tipo, status,
         subtotal_centavos, desconto_centavos, total_centavos,
         desconto_itens_centavos, desconto_pedido_centavos,
         valor_pago_centavos, valor_cortesia_centavos, valor_restante_centavos,
         criado_em, atualizado_em, finalizado_em, cancelado_em
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pedido.id,
        pedido.sessaoCaixaId,
        pedido.mesaId,
        pedido.tipo,
        pedido.status,
        pedido.subtotalCentavos,
        pedido.descontoPedidoCentavos,
        pedido.totalCentavos,
        pedido.descontoItensCentavos,
        pedido.descontoPedidoCentavos,
        pedido.valorPagoCentavos,
        pedido.valorCortesiaCentavos,
        pedido.valorRestanteCentavos,
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
    descontoItensCentavos: number
    descontoPedidoCentavos: number
    totalCentavos: number
    valorRestanteCentavos: number
  }): Pedido {
    const existente = this.buscarPorId(dados.pedidoId)

    if (!existente) {
      throw new Error('Pedido nao encontrado.')
    }

    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()

    conexao.instancia.run(
      `UPDATE pedido
       SET subtotal_centavos = ?,
           desconto_itens_centavos = ?,
           desconto_pedido_centavos = ?,
           total_centavos = ?,
           valor_restante_centavos = ?,
           atualizado_em = ?
       WHERE id = ?`,
      [
        dados.subtotalCentavos,
        dados.descontoItensCentavos,
        dados.descontoPedidoCentavos,
        dados.totalCentavos,
        dados.valorRestanteCentavos,
        agora,
        dados.pedidoId,
      ],
    )

    persistirConexaoBanco(conexao)

    return {
      ...existente,
      subtotalCentavos: dados.subtotalCentavos,
      descontoItensCentavos: dados.descontoItensCentavos,
      descontoPedidoCentavos: dados.descontoPedidoCentavos,
      totalCentavos: dados.totalCentavos,
      valorRestanteCentavos: dados.valorRestanteCentavos,
      atualizadoEm: agora,
    }
  }

  atualizarValoresPagamento(dados: {
    pedidoId: string
    valorPagoCentavos: number
    valorCortesiaCentavos: number
  }): Pedido {
    const existente = this.buscarPorId(dados.pedidoId)

    if (!existente) {
      throw new Error('Pedido nao encontrado.')
    }

    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()

    conexao.instancia.run(
      `UPDATE pedido
       SET valor_pago_centavos = ?,
           valor_cortesia_centavos = ?,
           atualizado_em = ?
       WHERE id = ?`,
      [
        dados.valorPagoCentavos,
        dados.valorCortesiaCentavos,
        agora,
        dados.pedidoId,
      ],
    )

    persistirConexaoBanco(conexao)

    return {
      ...existente,
      valorPagoCentavos: dados.valorPagoCentavos,
      valorCortesiaCentavos: dados.valorCortesiaCentavos,
      atualizadoEm: agora,
    }
  }

  cancelar(pedidoId: string, motivoCancelamento: string): Pedido {
    const existente = this.buscarPorId(pedidoId)

    if (!existente) {
      throw new Error('Pedido nao encontrado.')
    }

    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()

    conexao.instancia.run(
      `UPDATE pedido
       SET status = ?, cancelado_em = ?, motivo_cancelamento = ?, atualizado_em = ?
       WHERE id = ?`,
      [STATUS_PEDIDO.CANCELADO, agora, motivoCancelamento, agora, pedidoId],
    )

    persistirConexaoBanco(conexao)

    return {
      ...existente,
      status: STATUS_PEDIDO.CANCELADO,
      canceladoEm: agora,
      motivoCancelamento,
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
