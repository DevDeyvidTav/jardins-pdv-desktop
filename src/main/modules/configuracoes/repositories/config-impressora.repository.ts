import { randomUUID } from 'node:crypto'
import {
  persistirConexaoBanco,
  type ConexaoSqlite,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import type { ConfigImpressora, SetorImpressao } from '@shared/types/config-impressora'

interface LinhaConfigImpressoraSql {
  id: string
  setor: string
  nome_impressora: string
  porta_com: string | null
  endereco_ip: string | null
}

function mapearLinha(linha: LinhaConfigImpressoraSql): ConfigImpressora {
  return {
    id: linha.id,
    setor: linha.setor as SetorImpressao,
    nomeImpressora: linha.nome_impressora,
    portaCom: linha.porta_com,
    enderecoIp: linha.endereco_ip,
  }
}

export class ConfigImpressoraRepository {
  constructor(private readonly obterConexao = obterConexaoBancoLocal) {}

  listar(): ConfigImpressora[] {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT id, setor, nome_impressora, porta_com, endereco_ip
       FROM config_impressora
       ORDER BY setor ASC`,
    )

    const configs: ConfigImpressora[] = []

    while (consulta.step()) {
      const linha = consulta.getAsObject() as unknown as LinhaConfigImpressoraSql
      configs.push(mapearLinha(linha))
    }

    consulta.free()
    return configs
  }

  buscarPorSetor(setor: SetorImpressao): ConfigImpressora | null {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT id, setor, nome_impressora, porta_com, endereco_ip
       FROM config_impressora
       WHERE setor = ?
       LIMIT 1`,
    )
    consulta.bind([setor])

    if (!consulta.step()) {
      consulta.free()
      return null
    }

    const linha = consulta.getAsObject() as unknown as LinhaConfigImpressoraSql
    consulta.free()
    return mapearLinha(linha)
  }

  salvarTodas(
    configs: Array<{
      setor: SetorImpressao
      nomeImpressora: string
      portaCom: string | null
      enderecoIp?: string | null
    }>,
  ): ConfigImpressora[] {
    const conexao = this.obterConexao()

    conexao.nativo.exec('BEGIN')
    try {
      conexao.instancia.run('DELETE FROM config_impressora')

      const inseridas: ConfigImpressora[] = []

      for (const config of configs) {
        const registro: ConfigImpressora = {
          id: randomUUID(),
          setor: config.setor,
          nomeImpressora: config.nomeImpressora.trim(),
          portaCom: config.portaCom?.trim() || null,
          enderecoIp: config.enderecoIp?.trim() || null,
        }

        conexao.instancia.run(
          `INSERT INTO config_impressora (id, setor, nome_impressora, porta_com, endereco_ip)
           VALUES (?, ?, ?, ?, ?)`,
          [
            registro.id,
            registro.setor,
            registro.nomeImpressora,
            registro.portaCom,
            registro.enderecoIp,
          ],
        )

        inseridas.push(registro)
      }

      conexao.nativo.exec('COMMIT')
      persistirConexaoBanco(conexao)
      return inseridas
    } catch (erro) {
      conexao.nativo.exec('ROLLBACK')
      throw erro
    }
  }
}

export function criarConfigImpressoraRepository(
  conexao?: ConexaoSqlite,
): ConfigImpressoraRepository {
  if (conexao) {
    return new ConfigImpressoraRepository(() => conexao)
  }

  return new ConfigImpressoraRepository()
}
