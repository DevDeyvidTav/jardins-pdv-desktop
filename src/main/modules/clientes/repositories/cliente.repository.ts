import { randomUUID } from 'node:crypto'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import type { Cliente } from '@shared/types/cliente'
import {
  persistirConexaoBanco,
  type ConexaoSqlite,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'

type LinhaClienteSql = {
  id: string
  nome: string
  telefone: string | null
  documento: string | null
  endereco: string | null
  libera_talao: number
  ativo: number
  criado_em: string
  atualizado_em: string
}

function mapear(linha: LinhaClienteSql): Cliente {
  return {
    id: linha.id,
    nome: linha.nome,
    telefone: linha.telefone,
    documento: linha.documento,
    endereco: linha.endereco,
    liberaTalao: Number(linha.libera_talao) === 1,
    ativo: Number(linha.ativo) === 1,
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
  }
}

const COLUNAS = `
  id, nome, telefone, documento, endereco, libera_talao, ativo, criado_em, atualizado_em
`.trim()

export class ClienteRepository {
  constructor(private readonly obterConexao = obterConexaoBancoLocal) {}

  buscarPorId(clienteId: string): Cliente | null {
    const consulta = this.obterConexao().instancia.prepare(
      `SELECT ${COLUNAS} FROM cliente WHERE id = ? LIMIT 1`,
    )
    consulta.bind([clienteId])
    if (!consulta.step()) {
      consulta.free()
      return null
    }
    const linha = consulta.getAsObject() as LinhaClienteSql
    consulta.free()
    return mapear(linha)
  }

  listar(filtros: {
    apenasAtivos?: boolean
    apenasComTalao?: boolean
    termo?: string
  } = {}): Cliente[] {
    const condicoes: string[] = []
    const parametros: (string | number)[] = []

    if (filtros.apenasAtivos) {
      condicoes.push('ativo = ?')
      parametros.push(1)
    }
    if (filtros.apenasComTalao) {
      condicoes.push('libera_talao = ?')
      parametros.push(1)
    }
    if (filtros.termo && filtros.termo.trim() !== '') {
      condicoes.push('(LOWER(nome) LIKE LOWER(?) OR LOWER(COALESCE(telefone, \'\')) LIKE LOWER(?) OR LOWER(COALESCE(documento, \'\')) LIKE LOWER(?))')
      const termo = `%${filtros.termo.trim()}%`
      parametros.push(termo, termo, termo)
    }

    const where = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : ''
    const consulta = this.obterConexao().instancia.prepare(
      `SELECT ${COLUNAS} FROM cliente ${where} ORDER BY nome COLLATE NOCASE ASC`,
    )
    consulta.bind(parametros)

    const clientes: Cliente[] = []
    while (consulta.step()) {
      clientes.push(mapear(consulta.getAsObject() as LinhaClienteSql))
    }
    consulta.free()
    return clientes
  }

  inserir(dados: {
    nome: string
    telefone?: string | null
    documento?: string | null
    endereco?: string | null
    liberaTalao?: boolean
  }): Cliente {
    const agora = agoraEmIsoUtc()
    const registro: Cliente = {
      id: randomUUID(),
      nome: dados.nome,
      telefone: dados.telefone ?? null,
      documento: dados.documento ?? null,
      endereco: dados.endereco ?? null,
      liberaTalao: Boolean(dados.liberaTalao),
      ativo: true,
      criadoEm: agora,
      atualizadoEm: agora,
    }

    this.obterConexao().instancia.run(
      `INSERT INTO cliente (
         id, nome, telefone, documento, endereco, libera_talao, ativo, criado_em, atualizado_em
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        registro.id,
        registro.nome,
        registro.telefone,
        registro.documento,
        registro.endereco,
        registro.liberaTalao ? 1 : 0,
        1,
        registro.criadoEm,
        registro.atualizadoEm,
      ],
    )
    persistirConexaoBanco(this.obterConexao())
    return registro
  }

  atualizar(dados: {
    clienteId: string
    nome: string
    telefone?: string | null
    documento?: string | null
    endereco?: string | null
    liberaTalao: boolean
  }): Cliente {
    const existente = this.buscarPorId(dados.clienteId)
    if (!existente) {
      throw new Error('Cliente nao encontrado.')
    }

    const agora = agoraEmIsoUtc()
    this.obterConexao().instancia.run(
      `UPDATE cliente
       SET nome = ?, telefone = ?, documento = ?, endereco = ?, libera_talao = ?, atualizado_em = ?
       WHERE id = ?`,
      [
        dados.nome,
        dados.telefone ?? null,
        dados.documento ?? null,
        dados.endereco ?? null,
        dados.liberaTalao ? 1 : 0,
        agora,
        dados.clienteId,
      ],
    )
    persistirConexaoBanco(this.obterConexao())
    return {
      ...existente,
      nome: dados.nome,
      telefone: dados.telefone ?? null,
      documento: dados.documento ?? null,
      endereco: dados.endereco ?? null,
      liberaTalao: dados.liberaTalao,
      atualizadoEm: agora,
    }
  }

  definirAtivo(clienteId: string, ativo: boolean): Cliente {
    const existente = this.buscarPorId(clienteId)
    if (!existente) {
      throw new Error('Cliente nao encontrado.')
    }
    const agora = agoraEmIsoUtc()
    this.obterConexao().instancia.run(
      `UPDATE cliente SET ativo = ?, atualizado_em = ? WHERE id = ?`,
      [ativo ? 1 : 0, agora, clienteId],
    )
    persistirConexaoBanco(this.obterConexao())
    return { ...existente, ativo, atualizadoEm: agora }
  }
}

export function criarClienteRepository(conexao?: ConexaoSqlite): ClienteRepository {
  return conexao
    ? new ClienteRepository(() => conexao)
    : new ClienteRepository()
}
