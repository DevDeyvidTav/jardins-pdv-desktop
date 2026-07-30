import { randomUUID } from 'node:crypto'
import {
  persistirConexaoBanco,
  type ConexaoSqlite,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import { STATUS_MESA } from '@shared/types/mesa'
import type { Mesa } from '@shared/types/mesa'
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

  inserir(dados: { numero: number }): Mesa {
    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()
    const mesa: Mesa = {
      id: randomUUID(),
      numero: dados.numero,
      nome: String(dados.numero),
      status: STATUS_MESA.LIVRE,
      ativo: true,
      criadoEm: agora,
      atualizadoEm: agora,
    }

    conexao.instancia.run(
      `INSERT INTO mesa (id, numero, nome, status, ativo, criado_em, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [mesa.id, mesa.numero, mesa.nome, mesa.status, 1, mesa.criadoEm, mesa.atualizadoEm],
    )

    persistirConexaoBanco(conexao)
    return mesa
  }

  atualizar(dados: { mesaId: string; numero?: number; nome?: string }): Mesa {
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
      atualizadoEm: agora,
    }

    conexao.instancia.run(
      `UPDATE mesa SET numero = ?, nome = ?, atualizado_em = ? WHERE id = ?`,
      [atualizada.numero, atualizada.nome, agora, dados.mesaId],
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
}

export function criarMesaRepository(conexao?: ConexaoSqlite): MesaRepository {
  if (conexao) {
    return new MesaRepository(() => conexao)
  }

  return new MesaRepository()
}
