import {
  persistirConexaoBanco,
  type ConexaoSqlite,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import type {
  DocumentoFiscalInbox,
  DocumentoFiscalLocal,
  StatusDocumentoFiscal,
} from '@shared/types/documento-fiscal'

interface LinhaDocumentoFiscalSql {
  id: string
  pedido_id: string
  tipo: string
  status: string
  numero: number | null
  serie: number | null
  chave_acesso: string | null
  protocolo_autorizacao: string | null
  qr_code: string | null
  xml_url: string | null
  danfe_url: string | null
  valor_total: string
  codigo_rejeicao: string | null
  mensagem_rejeicao: string | null
  impresso_em: string | null
  autorizado_em: string | null
  cancelado_em: string | null
  atualizado_em: string
  criado_em: string
}

function mapear(linha: LinhaDocumentoFiscalSql): DocumentoFiscalLocal {
  return {
    id: linha.id,
    pedidoId: linha.pedido_id,
    tipo: linha.tipo,
    status: linha.status as StatusDocumentoFiscal,
    numero: linha.numero,
    serie: linha.serie,
    chaveAcesso: linha.chave_acesso,
    protocoloAutorizacao: linha.protocolo_autorizacao,
    qrCode: linha.qr_code,
    xmlUrl: linha.xml_url,
    danfeUrl: linha.danfe_url,
    valorTotal: linha.valor_total,
    codigoRejeicao: linha.codigo_rejeicao,
    mensagemRejeicao: linha.mensagem_rejeicao,
    impressoEm: linha.impresso_em,
    autorizadoEm: linha.autorizado_em,
    canceladoEm: linha.cancelado_em,
    atualizadoEm: linha.atualizado_em,
    criadoEm: linha.criado_em,
  }
}

export class DocumentoFiscalRepository {
  constructor(private readonly obterConexao = obterConexaoBancoLocal) {}

  buscarPorPedidoId(pedidoId: string): DocumentoFiscalLocal | null {
    const conexao = this.obterConexao()
    const consulta = conexao.instancia.prepare(
      `SELECT * FROM documento_fiscal WHERE pedido_id = ? LIMIT 1`,
    )
    consulta.bind([pedidoId])
    if (!consulta.step()) {
      consulta.free()
      return null
    }
    const linha = consulta.getAsObject() as unknown as LinhaDocumentoFiscalSql
    consulta.free()
    return mapear(linha)
  }

  upsertDaInbox(documento: DocumentoFiscalInbox): { novoAutorizado: boolean } {
    const existente = this.buscarPorPedidoId(documento.pedidoId)
    const conexao = this.obterConexao()
    const novoAutorizado =
      documento.status === 'AUTORIZADO' && existente?.status !== 'AUTORIZADO'

    conexao.instancia.run(
      `INSERT INTO documento_fiscal (
         id, pedido_id, tipo, status, numero, serie, chave_acesso,
         protocolo_autorizacao, qr_code, xml_url, danfe_url, valor_total,
         codigo_rejeicao, mensagem_rejeicao, impresso_em, autorizado_em,
         cancelado_em, atualizado_em, criado_em
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(pedido_id) DO UPDATE SET
         id = excluded.id,
         status = excluded.status,
         numero = excluded.numero,
         serie = excluded.serie,
         chave_acesso = excluded.chave_acesso,
         protocolo_autorizacao = excluded.protocolo_autorizacao,
         qr_code = excluded.qr_code,
         xml_url = excluded.xml_url,
         danfe_url = excluded.danfe_url,
         valor_total = excluded.valor_total,
         codigo_rejeicao = excluded.codigo_rejeicao,
         mensagem_rejeicao = excluded.mensagem_rejeicao,
         autorizado_em = excluded.autorizado_em,
         cancelado_em = excluded.cancelado_em,
         atualizado_em = excluded.atualizado_em`,
      [
        documento.id,
        documento.pedidoId,
        documento.tipo,
        documento.status,
        documento.numero,
        documento.serie,
        documento.chaveAcesso,
        documento.protocoloAutorizacao,
        documento.qrCode,
        documento.xmlUrl,
        documento.danfeUrl,
        documento.valorTotal,
        documento.codigoRejeicao,
        documento.mensagemRejeicao,
        existente?.impressoEm ?? null,
        documento.autorizadoEm,
        documento.canceladoEm,
        documento.atualizadoEm,
        documento.criadoEm,
      ],
    )
    persistirConexaoBanco(conexao)
    return { novoAutorizado }
  }

  marcarImpresso(pedidoId: string, impressoEm: string): void {
    const conexao = this.obterConexao()
    conexao.instancia.run(
      `UPDATE documento_fiscal SET impresso_em = ?, atualizado_em = ? WHERE pedido_id = ?`,
      [impressoEm, impressoEm, pedidoId],
    )
    persistirConexaoBanco(conexao)
  }
}

export function criarDocumentoFiscalRepository(
  conexao?: ConexaoSqlite,
): DocumentoFiscalRepository {
  if (conexao) {
    return new DocumentoFiscalRepository(() => conexao)
  }
  return new DocumentoFiscalRepository()
}
