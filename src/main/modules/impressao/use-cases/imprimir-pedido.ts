import {
  TIPO_DOCUMENTO_IMPRESSAO,
  type ImprimirPedidoEntrada,
  type ResultadoImpressao,
} from '@shared/types/impressao'
import { itemPedidoEstaAtivo } from '@shared/types/pedido'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../../pedidos/errors/erros-pedidos'
import { criarMesaRepository } from '../../mesas/repositories/mesa.repository'
import { criarPagamentoPedidoRepository } from '../../pagamentos/repositories/pagamento-pedido.repository'
import { obterResumoPedido } from '../../pedidos/use-cases/consultas-pedido'
import { registrarLog } from '../../../logging/logger'
import { CODIGOS_ERRO_IMPRESSAO, ErroImpressao } from '../errors/erros-impressao'
import { codificarCupomEscPos } from '../infraestrutura/encoder-escpos'
import { enviarBufferImpressora } from '../infraestrutura/enviar-impressora'
import {
  mapearPedidoParaComanda,
  mapearPedidoParaConta,
} from '../templates/mapear-pedido-impressao'
import { montarComanda } from '../templates/montar-comanda'
import { montarConta } from '../templates/montar-conta'

export function criarImprimirPedido(
  carregarResumo = obterResumoPedido,
  enviarBuffer = enviarBufferImpressora,
  repositorioMesa = criarMesaRepository(),
  repositorioPagamento = criarPagamentoPedidoRepository(),
) {
  return function imprimirPedido(
    entrada: ImprimirPedidoEntrada,
    tipo: typeof TIPO_DOCUMENTO_IMPRESSAO.CONTA | typeof TIPO_DOCUMENTO_IMPRESSAO.COMANDA,
  ): ResultadoImpressao {
    let resumo
    try {
      resumo = carregarResumo({
        pedidoId: entrada.pedidoId,
        incluirItensCancelados: true,
      })
    } catch (erro) {
      if (erro instanceof ErroPedidos && erro.codigo === CODIGOS_ERRO_PEDIDOS.PEDIDO_NAO_ENCONTRADO) {
        throw new ErroImpressao(
          CODIGOS_ERRO_IMPRESSAO.PEDIDO_NAO_ENCONTRADO,
          'Pedido nao encontrado.',
        )
      }
      throw erro
    }

    const itensAtivos = resumo.itens.filter(itemPedidoEstaAtivo)
    if (itensAtivos.length === 0) {
      throw new ErroImpressao(
        CODIGOS_ERRO_IMPRESSAO.PEDIDO_SEM_ITENS,
        'O pedido nao tem itens para imprimir.',
      )
    }

    const mesa = resumo.pedido.mesaId
      ? repositorioMesa.buscarPorId(resumo.pedido.mesaId)
      : null
    const pagamentos = repositorioPagamento.listarPorPedido(resumo.pedido.id)
    const linhas =
      tipo === TIPO_DOCUMENTO_IMPRESSAO.CONTA
        ? montarConta(mapearPedidoParaConta(resumo, mesa, pagamentos))
        : montarComanda(mapearPedidoParaComanda(resumo, mesa))

    const texto = linhas.join('\n')
    let impresso = false
    let aviso: string | null = null

    try {
      enviarBuffer(codificarCupomEscPos(linhas))
      impresso = true
      registrarLog('info', 'impressao_pedido_enviada', {
        operacao: 'impressao.imprimirPedido',
        pedidoId: entrada.pedidoId,
        tipo,
      })
    } catch (erro) {
      aviso =
        erro instanceof Error
          ? erro.message
          : 'Nao foi possivel enviar o cupom para a impressora.'
      registrarLog('warn', 'impressao_pedido_falhou_envio', {
        operacao: 'impressao.imprimirPedido',
        pedidoId: entrada.pedidoId,
        tipo,
        codigoErro: CODIGOS_ERRO_IMPRESSAO.FALHA_ENVIO_IMPRESSORA,
      })
    }

    return {
      tipo,
      setor: tipo === TIPO_DOCUMENTO_IMPRESSAO.COMANDA
        ? mapearPedidoParaComanda(resumo, mesa).setor
        : null,
      linhas,
      texto,
      impresso,
      aviso,
    }
  }
}

const imprimirPedido = criarImprimirPedido()

export function criarImprimirContaPedido(
  imprimir = imprimirPedido,
) {
  return function imprimirContaPedido(entrada: ImprimirPedidoEntrada): ResultadoImpressao {
    return imprimir(entrada, TIPO_DOCUMENTO_IMPRESSAO.CONTA)
  }
}

export function criarImprimirComandaPedido(
  imprimir = imprimirPedido,
) {
  return function imprimirComandaPedido(entrada: ImprimirPedidoEntrada): ResultadoImpressao {
    return imprimir(entrada, TIPO_DOCUMENTO_IMPRESSAO.COMANDA)
  }
}

export const imprimirContaPedido = criarImprimirContaPedido()
export const imprimirComandaPedido = criarImprimirComandaPedido()
