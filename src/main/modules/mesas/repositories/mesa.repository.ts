import { randomUUID } from 'node:crypto'
import {
  persistirConexaoBanco,
  type ConexaoSqlite,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import { STATUS_MESA, TIPO_USO_MESA } from '@shared/types/mesa'
import type { Mesa, TipoUsoMesa } from '@shared/types/mesa'
import {
  mapearLinhaMesa,
  obterColunasMesa,
  type LinhaMesaSql,
} from '../types/mesa.types'

export class MesaRepository {
  constructor(private readonly obterConexao = obterConexaoBancoLocal) {}

  private buscarPorConsulta(
    sql: string,
    parametros: (string | number | null)[] = [],
  ): Mesa | null {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(sql)
    consulta.bind(parametros)

    if (!consulta.step()) {
      consulta.free()
      return null
    }

    const linha = consulta.getAsObject() as unknown as LinhaMesaSql
    consulta.free()

    return mapearLinhaMesa(linha)
  }

  buscarPorId(mesaId: string): Mesa | null {
    return this.buscarPorConsulta(
      `SELECT ${obterColunasMesa()} FROM mesa WHERE id = ? LIMIT 1`,
      [mesaId],
    )
  }

  buscarPorNumero(numero: number): Mesa | null {
    return this.buscarPorConsulta(
      `SELECT ${obterColunasMesa()} FROM mesa WHERE numero = ? LIMIT 1`,
      [numero],
    )
  }

  listar(): Mesa[] {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT ${obterColunasMesa()} FROM mesa ORDER BY numero ASC`,
    )

    const mesas: Mesa[] = []

    while (consulta.step()) {
      const linha = consulta.getAsObject() as unknown as LinhaMesaSql
      mesas.push(mapearLinhaMesa(linha))
    }

    consulta.free()
    return mesas
  }

  inserir(dados: { numero: number; tipoUso?: TipoUsoMesa }): Mesa {
    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()
    const tipoUso = dados.tipoUso ?? TIPO_USO_MESA.COMUM
    const mesa: Mesa = {
      id: randomUUID(),
      numero: dados.numero,
      nome: String(dados.numero),
      status: STATUS_MESA.LIVRE,
      tipoUso,
      ativo: true,
      criadoEm: agora,
      atualizadoEm: agora,
    }

    conexao.instancia.run(
      `INSERT INTO mesa (id, numero, nome, status, tipo_uso, ativo, criado_em, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        mesa.id,
        mesa.numero,
        mesa.nome,
        mesa.status,
        mesa.tipoUso,
        1,
        mesa.criadoEm,
        mesa.atualizadoEm,
      ],
    )

    persistirConexaoBanco(conexao)
    return mesa
  }

  atualizar(dados: {
    mesaId: string
    numero?: number
    nome?: string
    tipoUso?: TipoUsoMesa
  }): Mesa {
    const existente = this.buscarPorId(dados.mesaId)

    if (!existente) {
      throw new Error('Mesa nao encontrada.')
    }

    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()
    const atualizada: Mesa = {
      ...existente,
      numero: dados.numero ?? existente.numero,
      nome: dados.nome ?? existente.nome,
      tipoUso: dados.tipoUso ?? existente.tipoUso,
      atualizadoEm: agora,
    }

    conexao.instancia.run(
      `UPDATE mesa SET numero = ?, nome = ?, tipo_uso = ?, atualizado_em = ? WHERE id = ?`,
      [
        atualizada.numero,
        atualizada.nome,
        atualizada.tipoUso,
        agora,
        dados.mesaId,
      ],
    )

    persistirConexaoBanco(conexao)
    return atualizada
  }

  atualizarStatus(mesaId: string, status: Mesa['status']): Mesa {
    const existente = this.buscarPorId(mesaId)

    if (!existente) {
      throw new Error('Mesa nao encontrada.')
    }

    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()

    conexao.instancia.run(
      `UPDATE mesa SET status = ?, atualizado_em = ? WHERE id = ?`,
      [status, agora, mesaId],
    )

    persistirConexaoBanco(conexao)

    return { ...existente, status, atualizadoEm: agora }
  }

  inativar(mesaId: string): Mesa {
    const conexao = this.obterConexao()
    const existente = this.buscarPorId(mesaId)

    if (!existente) {
      throw new Error('Mesa nao encontrada.')
    }

    const agora = agoraEmIsoUtc()

    conexao.instancia.run(
      `UPDATE mesa SET ativo = ?, status = ?, atualizado_em = ? WHERE id = ?`,
      [0, STATUS_MESA.INATIVA, agora, mesaId],
    )

    persistirConexaoBanco(conexao)

    return {
      ...existente,
      ativo: false,
      status: STATUS_MESA.INATIVA,
      atualizadoEm: agora,
    }
  }

  listarPorIntervaloETipo(
    numeroInicial: number,
    numeroFinal: number,
    tipoUso: TipoUsoMesa,
  ): Mesa[] {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT ${obterColunasMesa()}
       FROM mesa
       WHERE numero >= ? AND numero <= ? AND tipo_uso = ? AND ativo = 1
       ORDER BY numero ASC`,
    )
    consulta.bind([numeroInicial, numeroFinal, tipoUso])

    const mesas: Mesa[] = []
    while (consulta.step()) {
      const linha = consulta.getAsObject() as unknown as LinhaMesaSql
      mesas.push(mapearLinhaMesa(linha))
    }
    consulta.free()
    return mesas
  }

  /** Bloqueia exclusão só com pedido aberto ou agrupamento ativo. */
  possuiPedidoAbertoVinculado(mesaId: string): boolean {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT 1 AS ok WHERE EXISTS (
         SELECT 1 FROM pedido WHERE mesa_id = ? AND status = 'ABERTO'
       )
       OR EXISTS (
         SELECT 1
         FROM mesa_agrupada ma
         INNER JOIN mesa_agrupamento ag ON ag.id = ma.mesa_agrupamento_id
         WHERE ma.mesa_id = ? AND ag.status = 'ATIVO' AND ma.removida_em IS NULL
       )
       OR EXISTS (
         SELECT 1 FROM mesa_agrupamento
         WHERE mesa_principal_id = ? AND status = 'ATIVO'
       )
       LIMIT 1`,
    )
    consulta.bind([mesaId, mesaId, mesaId])
    const existe = consulta.step()
    consulta.free()
    return existe
  }

  /**
   * Solta vínculos históricos (pedidos fechados/cancelados e movimentações)
   * para permitir hard delete sem quebrar FK. Nao mexe em pedido ABERTO.
   */
  desvincularHistoricoParaExclusao(mesaId: string): void {
    const conexao = this.obterConexao()
    conexao.instancia.run(
      `UPDATE pedido SET mesa_id = NULL WHERE mesa_id = ? AND status <> 'ABERTO'`,
      [mesaId],
    )
    conexao.instancia.run(
      `UPDATE pedido_mesa_movimentacao SET mesa_origem_id = NULL WHERE mesa_origem_id = ?`,
      [mesaId],
    )
    conexao.instancia.run(
      `UPDATE pedido_mesa_movimentacao SET mesa_destino_id = NULL WHERE mesa_destino_id = ?`,
      [mesaId],
    )
    conexao.instancia.run(
      `DELETE FROM mesa_agrupada
       WHERE mesa_agrupamento_id IN (
         SELECT id FROM mesa_agrupamento
         WHERE status <> 'ATIVO' AND mesa_principal_id = ?
       )`,
      [mesaId],
    )
    conexao.instancia.run(
      `DELETE FROM mesa_agrupada
       WHERE mesa_id = ?
         AND mesa_agrupamento_id IN (
           SELECT id FROM mesa_agrupamento WHERE status <> 'ATIVO'
         )`,
      [mesaId],
    )
    conexao.instancia.run(
      `UPDATE pedido_mesa_movimentacao SET mesa_agrupamento_id = NULL
       WHERE mesa_agrupamento_id IN (
         SELECT id FROM mesa_agrupamento
         WHERE status <> 'ATIVO' AND mesa_principal_id = ?
       )`,
      [mesaId],
    )
    conexao.instancia.run(
      `DELETE FROM mesa_agrupamento
       WHERE status <> 'ATIVO' AND mesa_principal_id = ?`,
      [mesaId],
    )
    persistirConexaoBanco(conexao)
  }

  excluir(mesaId: string): void {
    this.desvincularHistoricoParaExclusao(mesaId)
    const conexao = this.obterConexao()
    conexao.instancia.run(`DELETE FROM mesa WHERE id = ?`, [mesaId])
    persistirConexaoBanco(conexao)
  }
}

export function criarMesaRepository(conexao?: ConexaoSqlite): MesaRepository {
  if (conexao) {
    return new MesaRepository(() => conexao)
  }

  return new MesaRepository()
}
