import {
  TIPO_DOCUMENTO_IMPRESSAO,
  type ImprimirPedidoEntrada,
  type ResultadoImpressao,
  type SetorComanda,
} from '@shared/types/impressao'
import type { SetorImpressao } from '@shared/types/config-impressora'
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
import {
  enviarBufferImpressora,
  type DestinoImpressao,
} from '../infraestrutura/enviar-impressora'
import {
  resolverDestinoConta,
  resolverDestinoImpressoraPorSetor,
} from '../infraestrutura/resolver-destino-impressora'
import {
  itemPedidoNaoEntraNaComanda,
  mapearPedidoParaComanda,
  mapearPedidoParaConta,
  type ConsultarNomeCategoriaProduto,
  type ConsultarSetorCategoriaProduto,
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

export function consultarSetorCategoriaProduto(
  produtoId: string,
  repositorioProduto = criarProdutoRepository(),
  repositorioCategoria = criarCategoriaProdutoRepository(),
): SetorImpressao | null {
  try {
    const produto = repositorioProduto.buscarPorId(produtoId)
    if (!produto) {
      return null
    }

    return repositorioCategoria.buscarPorId(produto.categoriaId)?.setorImpressao ?? null
  } catch {
    return null
  }
}

function comCacheDeCategoria<T>(
  consultar: (produtoId: string) => T | null,
): (produtoId: string) => T | null {
  const cache = new Map<string, T | null>()

  return (produtoId) => {
    if (cache.has(produtoId)) {
      return cache.get(produtoId) ?? null
    }

    const valor = consultar(produtoId)
    cache.set(produtoId, valor)
    return valor
  }
}

function setorComandaParaImpressao(setor: SetorComanda): SetorImpressao {
  return setor
}

function obterSetoresComandaAtivos(
  resumoDocumento: ReturnType<typeof obterResumoPedido>,
  consultarSetor: ConsultarSetorCategoriaProduto,
): SetorComanda[] {
  const itens = mapearPedidoParaComanda(resumoDocumento, null, consultarSetor).itens.filter(
    (item) => !item.cancelado,
  )
  const setores = new Set(itens.map((item) => item.setor))
  return [...setores]
}

function combinarResultadosImpressao(
  resultados: ResultadoImpressao[],
  tipo: typeof TIPO_DOCUMENTO_IMPRESSAO.CONTA | typeof TIPO_DOCUMENTO_IMPRESSAO.COMANDA,
): ResultadoImpressao {
  const linhas = resultados.flatMap((resultado) => resultado.linhas)
  const avisos = resultados
    .map((resultado) => resultado.aviso)
    .filter((aviso): aviso is string => Boolean(aviso))

  return {
    tipo,
    setor: resultados.length === 1 ? resultados[0]?.setor ?? null : null,
    linhas,
    texto: linhas.join('\n'),
    impresso: resultados.every((resultado) => resultado.impresso),
    aviso: avisos.length > 0 ? avisos.join(' | ') : null,
  }
}

export function criarImprimirPedido(
  carregarResumo = obterResumoPedido,
  enviarBuffer = enviarBufferImpressora,
  repositorioMesa = criarMesaRepository(),
  repositorioPagamento = criarPagamentoPedidoRepository(),
  consultarNomeCategoria: ConsultarNomeCategoriaProduto = consultarNomeCategoriaProduto,
  consultarSetorCategoria: ConsultarSetorCategoriaProduto = consultarSetorCategoriaProduto,
  resolverDestinoContaImpressao = resolverDestinoConta,
  resolverDestinoSetor = resolverDestinoImpressoraPorSetor,
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
    const consultarSetor = comCacheDeCategoria(consultarSetorCategoria)
    const itensAtivos = resumo.itens.filter(itemPedidoEstaAtivo)
    const resumoDocumento =
      tipo === TIPO_DOCUMENTO_IMPRESSAO.COMANDA
        ? {
            ...resumo,
            itens: resumo.itens.filter(
              (item) => !itemPedidoNaoEntraNaComanda(item, consultarCategoria, consultarSetor),
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

    if (tipo === TIPO_DOCUMENTO_IMPRESSAO.CONTA) {
      const linhas = montarConta(
        mapearPedidoParaConta(resumoDocumento, mesa, pagamentos, consultarSetor),
      )
      const resultado = enviarDocumento(
        linhas,
        resolverDestinoContaImpressao(),
        enviarBuffer,
        entrada.pedidoId,
        tipo,
        null,
      )

      return {
        tipo,
        setor: null,
        linhas,
        texto: linhas.join('\n'),
        ...resultado,
      }
    }

    const setores = obterSetoresComandaAtivos(resumoDocumento, consultarSetor)
    const resultados = setores.map((setor) => {
      const documentoComanda = mapearPedidoParaComanda(
        resumoDocumento,
        mesa,
        consultarSetor,
        setor,
      )
      const linhas = montarComanda(documentoComanda)
      const destino = resolverDestinoSetor(setorComandaParaImpressao(setor))
      const envio = enviarDocumento(
        linhas,
        destino,
        enviarBuffer,
        entrada.pedidoId,
        tipo,
        setor,
      )

      return {
        tipo,
        setor,
        linhas,
        texto: linhas.join('\n'),
        ...envio,
      }
    })

    return combinarResultadosImpressao(resultados, tipo)
  }
}

function enviarDocumento(
  linhas: string[],
  destino: DestinoImpressao,
  enviarBuffer: typeof enviarBufferImpressora,
  pedidoId: string,
  tipo: typeof TIPO_DOCUMENTO_IMPRESSAO.CONTA | typeof TIPO_DOCUMENTO_IMPRESSAO.COMANDA,
  setor: SetorComanda | null,
): Pick<ResultadoImpressao, 'impresso' | 'aviso'> {
  if (destino.tipo === 'NAO_CONFIGURADO') {
    return { impresso: true, aviso: null }
  }

  let impresso = false
  let aviso: string | null = null

  try {
    enviarBuffer(codificarCupomEscPos(linhas), destino)
    impresso = true
    registrarLog('info', 'impressao_pedido_enviada', {
      operacao: 'impressao.imprimirPedido',
      pedidoId,
      tipo,
      setor,
    })
  } catch (erro) {
    aviso =
      erro instanceof Error
        ? erro.message
        : 'Nao foi possivel enviar o cupom para a impressora.'
    registrarLog('warn', 'impressao_pedido_falhou_envio', {
      operacao: 'impressao.imprimirPedido',
      pedidoId,
      tipo,
      setor,
      codigoErro: CODIGOS_ERRO_IMPRESSAO.FALHA_ENVIO_IMPRESSORA,
    })
  }

  return { impresso, aviso }
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
