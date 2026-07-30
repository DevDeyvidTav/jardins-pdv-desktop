import { randomUUID } from 'node:crypto'
import {
  persistirConexaoBanco,
  type ConexaoSqlite,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import { STATUS_SESSAO_CAIXA } from '@shared/types/sessao-caixa'
import type { SessaoCaixa } from '@shared/types/sessao-caixa'
import {
  mapearLinhaSessaoCaixa,
  type LinhaSessaoCaixaSql,
} from '../types/caixa.types'

export class SessaoCaixaRepository {
  constructor(private readonly obterConexao = obterConexaoBancoLocal) {}

  buscarSessaoAberta(): SessaoCaixa | null {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT id, operador_id, operador_nome, saldo_inicial_centavos, status,
              aberto_em, fechado_em, criado_em, atualizado_em
       FROM sessao_caixa
       WHERE status = ?
       LIMIT 1`,
    )

    consulta.bind([STATUS_SESSAO_CAIXA.ABERTO])

    if (!consulta.step()) {
      consulta.free()
      return null
    }

    const linha = consulta.getAsObject() as unknown as LinhaSessaoCaixaSql
    consulta.free()

    return mapearLinhaSessaoCaixa(linha)
  }

  inserirSessaoAberta(dados: {
    operadorId: string
    operadorNome: string
    saldoInicialCentavos: number
  }): SessaoCaixa {
    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()
    const sessao: SessaoCaixa = {
      id: randomUUID(),
      operadorId: dados.operadorId,
      operadorNome: dados.operadorNome,
      saldoInicialCentavos: dados.saldoInicialCentavos,
      status: STATUS_SESSAO_CAIXA.ABERTO,
      abertoEm: agora,
      fechadoEm: null,
      criadoEm: agora,
      atualizadoEm: agora,
    }

    conexao.instancia.run(
      `INSERT INTO sessao_caixa (
         id, operador_id, operador_nome, saldo_inicial_centavos, status,
         aberto_em, fechado_em, criado_em, atualizado_em
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sessao.id,
        sessao.operadorId,
        sessao.operadorNome,
        sessao.saldoInicialCentavos,
        sessao.status,
        sessao.abertoEm,
        sessao.fechadoEm,
        sessao.criadoEm,
        sessao.atualizadoEm,
      ],
    )

    persistirConexaoBanco(conexao)

    return sessao
  }
}

export function criarSessaoCaixaRepository(
  conexao?: ConexaoSqlite,
): SessaoCaixaRepository {
  if (conexao) {
    return new SessaoCaixaRepository(() => conexao)
  }

  return new SessaoCaixaRepository()
}
