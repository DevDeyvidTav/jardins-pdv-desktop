import type { ConexaoSqlite } from '../../../database/conexao-sqlite'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import type { OperadorResumo, PerfilOperador } from '@shared/types/operador'

export interface OperadorUsuarioRegistro extends OperadorResumo {
  pinHash: string
  ativo: boolean
}

type LinhaOperadorSql = {
  id: string
  nome: string
  pin_hash: string
  perfil: PerfilOperador
  ativo: number
}

function mapearLinha(linha: LinhaOperadorSql): OperadorUsuarioRegistro {
  return {
    operadorId: linha.id,
    operadorNome: linha.nome,
    perfil: linha.perfil,
    pinHash: linha.pin_hash,
    ativo: linha.ativo === 1,
  }
}

export interface OperadorUsuarioRepository {
  contarAtivos(): number
  listarAtivos(): OperadorResumo[]
  buscarPorPinHashVerificavel(
    verificar: (pinHash: string) => boolean,
  ): OperadorUsuarioRegistro | null
  buscarPorId(id: string): OperadorUsuarioRegistro | null
  buscarPorNome(nome: string): OperadorUsuarioRegistro | null
  inserir(entrada: {
    id: string
    nome: string
    pinHash: string
    perfil: PerfilOperador
  }): OperadorResumo
  atualizarPin(id: string, pinHash: string): OperadorResumo
}

export function criarOperadorUsuarioRepository(conexao: ConexaoSqlite): OperadorUsuarioRepository {
  return {
    contarAtivos() {
      const consulta = conexao.instancia.prepare(
        `SELECT COUNT(*) AS total FROM operador_usuario WHERE ativo = 1`,
      )
      consulta.step()
      const total = Number((consulta.getAsObject() as { total: number }).total ?? 0)
      consulta.free()
      return total
    },

    listarAtivos() {
      const consulta = conexao.instancia.prepare(
        `SELECT id, nome, pin_hash, perfil, ativo
         FROM operador_usuario
         WHERE ativo = 1
         ORDER BY nome COLLATE NOCASE`,
      )

      const itens: OperadorResumo[] = []
      while (consulta.step()) {
        const registro = mapearLinha(consulta.getAsObject() as LinhaOperadorSql)
        itens.push({
          operadorId: registro.operadorId,
          operadorNome: registro.operadorNome,
          perfil: registro.perfil,
        })
      }
      consulta.free()
      return itens
    },

    buscarPorPinHashVerificavel(verificar) {
      const consulta = conexao.instancia.prepare(
        `SELECT id, nome, pin_hash, perfil, ativo
         FROM operador_usuario
         WHERE ativo = 1`,
      )

      while (consulta.step()) {
        const linha = consulta.getAsObject() as LinhaOperadorSql
        if (verificar(linha.pin_hash)) {
          consulta.free()
          return mapearLinha(linha)
        }
      }

      consulta.free()
      return null
    },

    buscarPorId(id) {
      const consulta = conexao.instancia.prepare(
        `SELECT id, nome, pin_hash, perfil, ativo
         FROM operador_usuario
         WHERE id = ?`,
      )
      consulta.bind([id])

      if (!consulta.step()) {
        consulta.free()
        return null
      }

      const registro = mapearLinha(consulta.getAsObject() as LinhaOperadorSql)
      consulta.free()
      return registro
    },

    buscarPorNome(nome) {
      const consulta = conexao.instancia.prepare(
        `SELECT id, nome, pin_hash, perfil, ativo
         FROM operador_usuario
         WHERE ativo = 1 AND lower(nome) = lower(?)`,
      )
      consulta.bind([nome.trim()])

      if (!consulta.step()) {
        consulta.free()
        return null
      }

      const registro = mapearLinha(consulta.getAsObject() as LinhaOperadorSql)
      consulta.free()
      return registro
    },

    inserir(entrada) {
      const agora = agoraEmIsoUtc()
      conexao.instancia.run(
        `INSERT INTO operador_usuario (id, nome, pin_hash, perfil, ativo, criado_em, atualizado_em)
         VALUES (?, ?, ?, ?, 1, ?, ?)`,
        [entrada.id, entrada.nome, entrada.pinHash, entrada.perfil, agora, agora],
      )

      return {
        operadorId: entrada.id,
        operadorNome: entrada.nome,
        perfil: entrada.perfil,
      }
    },

    atualizarPin(id, pinHash) {
      const agora = agoraEmIsoUtc()
      conexao.instancia.run(
        `UPDATE operador_usuario
         SET pin_hash = ?, atualizado_em = ?
         WHERE id = ? AND ativo = 1`,
        [pinHash, agora, id],
      )

      const registro = this.buscarPorId(id)
      if (!registro) {
        throw new Error('Operador nao encontrado.')
      }

      return {
        operadorId: registro.operadorId,
        operadorNome: registro.operadorNome,
        perfil: registro.perfil,
      }
    },
  }
}
