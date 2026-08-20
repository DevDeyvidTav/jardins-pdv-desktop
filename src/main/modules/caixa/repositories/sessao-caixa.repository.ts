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
  obterColunasSessaoCaixa,
  type LinhaSessaoCaixaSql,
} from '../types/caixa.types'

export class SessaoCaixaRepository {
  constructor(private readonly obterConexao = obterConexaoBancoLocal) {}

  private buscarPorConsulta(
    sql: string,
    parametros: (string | number | null)[] = [],
  ): SessaoCaixa | null {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(sql)
    consulta.bind(parametros)

    if (!consulta.step()) {
      consulta.free()
      return null
    }

    const linha = consulta.getAsObject() as unknown as LinhaSessaoCaixaSql
    consulta.free()

    return mapearLinhaSessaoCaixa(linha)
  }

  buscarSessaoAberta(): SessaoCaixa | null {
    return this.buscarPorConsulta(
      `SELECT ${obterColunasSessaoCaixa()}
       FROM sessao_caixa
       WHERE status = ?
       LIMIT 1`,
      [STATUS_SESSAO_CAIXA.ABERTO],
    )
  }

  buscarUltimaSessao(): SessaoCaixa | null {
    return this.buscarPorConsulta(
      `SELECT ${obterColunasSessaoCaixa()}
       FROM sessao_caixa
       ORDER BY criado_em DESC
       LIMIT 1`,
    )
  }

  listarTodas(): SessaoCaixa[] {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT ${obterColunasSessaoCaixa()}
       FROM sessao_caixa
       ORDER BY criado_em ASC`,
    )
    const sessoes: SessaoCaixa[] = []
    while (consulta.step()) {
      sessoes.push(
        mapearLinhaSessaoCaixa(consulta.getAsObject() as unknown as LinhaSessaoCaixaSql),
      )
    }
    consulta.free()
    return sessoes
  }

  buscarPorId(sessaoCaixaId: string): SessaoCaixa | null {
    return this.buscarPorConsulta(
      `SELECT ${obterColunasSessaoCaixa()}
       FROM sessao_caixa
       WHERE id = ?
       LIMIT 1`,
      [sessaoCaixaId],
    )
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
      saldoFinalInformadoCentavos: null,
      saldoFinalEsperadoCentavos: null,
      diferencaCentavos: null,
      observacaoFechamento: null,
      criadoEm: agora,
      atualizadoEm: agora,
    }

    conexao.instancia.run(
      `INSERT INTO sessao_caixa (
         id, operador_id, operador_nome, saldo_inicial_centavos, status,
         aberto_em, fechado_em, saldo_final_informado_centavos,
         saldo_final_esperado_centavos, diferenca_centavos, observacao_fechamento,
         criado_em, atualizado_em
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sessao.id,
        sessao.operadorId,
        sessao.operadorNome,
        sessao.saldoInicialCentavos,
        sessao.status,
        sessao.abertoEm,
        sessao.fechadoEm,
        sessao.saldoFinalInformadoCentavos,
        sessao.saldoFinalEsperadoCentavos,
        sessao.diferencaCentavos,
        sessao.observacaoFechamento,
        sessao.criadoEm,
        sessao.atualizadoEm,
      ],
    )

    persistirConexaoBanco(conexao)

    return sessao
  }

  fecharSessao(dados: {
    sessaoCaixaId: string
    saldoFinalInformadoCentavos: number
    saldoFinalEsperadoCentavos: number
    diferencaCentavos: number
    observacaoFechamento: string | null
  }): SessaoCaixa {
    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()

    conexao.instancia.run(
      `UPDATE sessao_caixa
       SET status = ?,
           fechado_em = ?,
           saldo_final_informado_centavos = ?,
           saldo_final_esperado_centavos = ?,
           diferenca_centavos = ?,
           observacao_fechamento = ?,
           atualizado_em = ?
       WHERE id = ? AND status = ?`,
      [
        STATUS_SESSAO_CAIXA.FECHADO,
        agora,
        dados.saldoFinalInformadoCentavos,
        dados.saldoFinalEsperadoCentavos,
        dados.diferencaCentavos,
        dados.observacaoFechamento,
        agora,
        dados.sessaoCaixaId,
        STATUS_SESSAO_CAIXA.ABERTO,
      ],
    )

    const alteracoes = conexao.instancia.getRowsModified()

    if (alteracoes === 0) {
      throw new Error('Sessao de caixa nao encontrada ou ja fechada.')
    }

    persistirConexaoBanco(conexao)

    const sessaoFechada = this.buscarPorId(dados.sessaoCaixaId)

    if (!sessaoFechada) {
      throw new Error('Sessao de caixa nao encontrada apos fechamento.')
    }

    return sessaoFechada
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
