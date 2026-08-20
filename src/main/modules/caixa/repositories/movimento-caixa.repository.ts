import { randomUUID } from 'node:crypto'
import {
  persistirConexaoBanco,
  type ConexaoSqlite,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import {
  ORIGEM_MOVIMENTO_CAIXA,
  TIPO_MOVIMENTO_CAIXA,
  type MovimentoCaixa,
  type TipoMovimentoCaixa,
} from '@shared/types/movimento-caixa'
import {
  mapearLinhaMovimentoCaixa,
  type LinhaMovimentoCaixaSql,
} from '../types/movimento-caixa.types'

export class MovimentoCaixaRepository {
  constructor(private readonly obterConexao = obterConexaoBancoLocal) {}

  inserir(dados: {
    sessaoCaixaId: string
    tipo: TipoMovimentoCaixa
    valorCentavos: number
    descricao: string | null
  }): MovimentoCaixa {
    const conexao = this.obterConexao()
    const agora = agoraEmIsoUtc()
    const movimento: MovimentoCaixa = {
      id: randomUUID(),
      sessaoCaixaId: dados.sessaoCaixaId,
      tipo: dados.tipo,
      valorCentavos: dados.valorCentavos,
      descricao: dados.descricao,
      origem: ORIGEM_MOVIMENTO_CAIXA.MANUAL,
      criadoEm: agora,
      atualizadoEm: agora,
    }

    conexao.instancia.run(
      `INSERT INTO movimento_caixa (
         id, sessao_caixa_id, tipo, valor_centavos, descricao, origem,
         criado_em, atualizado_em
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        movimento.id,
        movimento.sessaoCaixaId,
        movimento.tipo,
        movimento.valorCentavos,
        movimento.descricao,
        movimento.origem,
        movimento.criadoEm,
        movimento.atualizadoEm,
      ],
    )

    persistirConexaoBanco(conexao)

    return movimento
  }

  listarPorSessao(sessaoCaixaId: string): MovimentoCaixa[] {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT id, sessao_caixa_id, tipo, valor_centavos, descricao, origem,
              criado_em, atualizado_em
       FROM movimento_caixa
       WHERE sessao_caixa_id = ?
       ORDER BY criado_em ASC`,
    )

    consulta.bind([sessaoCaixaId])

    const movimentos: MovimentoCaixa[] = []

    while (consulta.step()) {
      const linha = consulta.getAsObject() as unknown as LinhaMovimentoCaixaSql
      movimentos.push(mapearLinhaMovimentoCaixa(linha))
    }

    consulta.free()

    return movimentos
  }

  listarTodos(): MovimentoCaixa[] {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT id, sessao_caixa_id, tipo, valor_centavos, descricao, origem,
              criado_em, atualizado_em
       FROM movimento_caixa
       ORDER BY criado_em ASC`,
    )
    const movimentos: MovimentoCaixa[] = []
    while (consulta.step()) {
      movimentos.push(
        mapearLinhaMovimentoCaixa(consulta.getAsObject() as LinhaMovimentoCaixaSql),
      )
    }
    consulta.free()
    return movimentos
  }

  calcularTotaisPorSessao(sessaoCaixaId: string): {
    totalSuprimentosCentavos: number
    totalSangriasCentavos: number
    totalRetiradasCentavos: number
  } {
    const movimentos = this.listarPorSessao(sessaoCaixaId)

    return movimentos.reduce(
      (totais, movimento) => {
        if (movimento.tipo === TIPO_MOVIMENTO_CAIXA.SUPRIMENTO) {
          totais.totalSuprimentosCentavos += movimento.valorCentavos
        }

        if (movimento.tipo === TIPO_MOVIMENTO_CAIXA.SANGRIA) {
          totais.totalSangriasCentavos += movimento.valorCentavos
        }

        if (movimento.tipo === TIPO_MOVIMENTO_CAIXA.RETIRADA) {
          totais.totalRetiradasCentavos += movimento.valorCentavos
        }

        return totais
      },
      {
        totalSuprimentosCentavos: 0,
        totalSangriasCentavos: 0,
        totalRetiradasCentavos: 0,
      },
    )
  }
}

export function criarMovimentoCaixaRepository(
  conexao?: ConexaoSqlite,
): MovimentoCaixaRepository {
  if (conexao) {
    return new MovimentoCaixaRepository(() => conexao)
  }

  return new MovimentoCaixaRepository()
}
