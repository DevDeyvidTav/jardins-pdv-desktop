import {
  TIPO_DOCUMENTO_IMPRESSAO,
  type ImprimirPedidoEntrada,
  type ResultadoImpressao,
} from '@shared/types/impressao'
import { itemPedidoEstaAtivo } from '@shared/types/pedido'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../../pedidos/errors/erros-pedidos'
import { criarMesaRepository } from '../../mesas/repositories/mesa.repository'
import { criarPagamentoPedidoRepository } from '../../pagamentos/repositories/pagamento-pedido.repository'
import { criarCategoriaProdutoRepository } from '../../produtos/repositories/categoria-produto.repository'
import { criarProdutoRepository } from '../../produtos/repositories/produto.repository'
import { obterResumoPedido } from '../../pedidos/use-cases/consultas-pedido'
import { registrarLog } from '../../../logging/logger'
import { CODIGOS_ERRO_IMPRESSAO, ErroImpressao } from '../errors/erros-impressao'
import { codificarCupomEscPos } from '../infraestrutura/encoder-escpos'
import { enviarBufferImpressora } from '../infraestrutura/enviar-impressora'
import {
  itemPedidoNaoEntraNaComanda,
  mapearPedidoParaComanda,
  mapearPedidoParaConta,
  type ConsultarNomeCategoriaProduto,
} from '../templates/mapear-pedido-impressao'
import { montarComanda } from '../templates/montar-comanda'
import { montarConta } from '../templates/montar-conta'

export function consultarNomeCategoriaProduto(
  produtoId: string,
  repositorioProduto = criarProdutoRepository(),
  repositorioCategoria = criarCategoriaProdutoRepository(),
): string | null {
  try {
    const produto = repositorioProduto.buscarPorId(produtoId)
    if (!produto) {
      return null
    }

    return repositorioCategoria.buscarPorId(produto.categoriaId)?.nome ?? null
  } catch {
    return null
  }
}

function comCacheDeCategoria(
  consultar: ConsultarNomeCategoriaProduto,
): ConsultarNomeCategoriaProduto {
  const cache = new Map<string, string | null>()

  return (produtoId) => {
    if (cache.has(produtoId)) {
      return cache.get(produtoId) ?? null
    }

    const nome = consultar(produtoId)
    cache.set(produtoId, nome)
    return nome
  }
}

export function criarImprimirPedido(
  carregarResumo = obterResumoPedido,
  enviarBuffer = enviarBufferImpressora,
  repositorioMesa = criarMesaRepository(),
  repositorioPagamento = criarPagamentoPedidoRepository(),
  consultarNomeCategoria: ConsultarNomeCategoriaProduto = consultarNomeCategoriaProduto,
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

    const consultarCategoria = comCacheDeCategoria(consultarNomeCategoria)
    const itensAtivos = resumo.itens.filter(itemPedidoEstaAtivo)
    const resumoDocumento =
      tipo === TIPO_DOCUMENTO_IMPRESSAO.COMANDA
        ? {
            ...resumo,
            itens: resumo.itens.filter(
              (item) => !itemPedidoNaoEntraNaComanda(item, consultarCategoria),
            ),
          }
        : resumo
    const itensParaImprimir = resumoDocumento.itens.filter(itemPedidoEstaAtivo)

    if (itensAtivos.length === 0 || itensParaImprimir.length === 0) {
      throw new ErroImpressao(
        CODIGOS_ERRO_IMPRESSAO.PEDIDO_SEM_ITENS,
        tipo === TIPO_DOCUMENTO_IMPRESSAO.COMANDA && itensAtivos.length > 0
          ? 'Nao ha itens de cozinha para imprimir. Bebidas nao saem na comanda.'
          : 'O pedido nao tem itens para imprimir.',
      )
    }

    const mesa = resumo.pedido.mesaId
      ? repositorioMesa.buscarPorId(resumo.pedido.mesaId)
      : null
    const pagamentos = repositorioPagamento.listarPorPedido(resumo.pedido.id)

    const documentoComanda =
      tipo === TIPO_DOCUMENTO_IMPRESSAO.COMANDA
        ? mapearPedidoParaComanda(resumoDocumento, mesa)
        : null
    const linhas =
      documentoComanda
        ? montarComanda(documentoComanda)
        : montarConta(mapearPedidoParaConta(resumoDocumento, mesa, pagamentos))

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
      setor: documentoComanda?.setor ?? null,
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
