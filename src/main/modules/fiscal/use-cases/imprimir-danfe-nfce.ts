import type { ResultadoImpressao } from '@shared/types/impressao'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import { criarPagamentoPedidoRepository } from '../../pagamentos/repositories/pagamento-pedido.repository'
import { obterResumoPedido } from '../../pedidos/use-cases/consultas-pedido'
import { CODIGOS_ERRO_IMPRESSAO, ErroImpressao } from '../../impressao/errors/erros-impressao'
import { enviarBufferImpressora } from '../../impressao/infraestrutura/enviar-impressora'
import { codificarCupomEscPosComQr } from '../../impressao/infraestrutura/encoder-escpos'
import {
  conteudoQrDanfe,
  mapearItensPedidoParaDanfe,
  mapearPagamentosParaDanfe,
  montarDanfeNfce,
} from '../../impressao/templates/montar-danfe-nfce'
import { criarDocumentoFiscalRepository } from '../repositories/documento-fiscal.repository'
import { obterEmitenteDanfe } from '../services/obter-emitente-danfe'

export function criarImprimirDanfeNfce(
  repositorioDocumento = criarDocumentoFiscalRepository(),
  obterResumo = obterResumoPedido,
  repositorioPagamento = criarPagamentoPedidoRepository(),
  enviarBuffer = enviarBufferImpressora,
  obterEmitente = obterEmitenteDanfe,
) {
  return async function imprimirDanfeNfce(pedidoId: string): Promise<ResultadoImpressao> {
    const documento = repositorioDocumento.buscarPorPedidoId(pedidoId)
    if (!documento || documento.status !== 'AUTORIZADO') {
      throw new ErroImpressao(
        CODIGOS_ERRO_IMPRESSAO.ENTRADA_INVALIDA,
        'NFC-e ainda nao foi autorizada.',
      )
    }

    let itens: ReturnType<typeof mapearItensPedidoParaDanfe> = []
    let pagamentos: ReturnType<typeof mapearPagamentosParaDanfe> = []
    let cpfDestinatario: string | null = null

    try {
      const resumo = obterResumo({ pedidoId, incluirItensCancelados: false })
      itens = mapearItensPedidoParaDanfe(resumo.itens)
      cpfDestinatario = resumo.pedido.fiscalCpfDestinatario
      pagamentos = mapearPagamentosParaDanfe(repositorioPagamento.listarPorPedido(pedidoId))
    } catch {
      pagamentos = mapearPagamentosParaDanfe(repositorioPagamento.listarPorPedido(pedidoId))
    }

    const linhas = montarDanfeNfce({
      emitente: obterEmitente(),
      itens,
      pagamentos,
      cpfDestinatario,
      valorTotalCentavos: Math.round(Number(documento.valorTotal) * 100),
      numero: documento.numero,
      serie: documento.serie,
      chaveAcesso: documento.chaveAcesso,
      protocoloAutorizacao: documento.protocoloAutorizacao,
      autorizadoEm: documento.autorizadoEm,
    })
    const qr = conteudoQrDanfe(documento)
    const buffer = codificarCupomEscPosComQr(linhas, qr)
    await enviarBuffer(buffer)
    repositorioDocumento.marcarImpresso(pedidoId, agoraEmIsoUtc())

    return {
      tipo: 'CONTA',
      setor: null,
      linhas,
      texto: linhas.join('\n'),
      impresso: true,
      aviso: null,
    }
  }
}

export const imprimirDanfeNfce = criarImprimirDanfeNfce()
