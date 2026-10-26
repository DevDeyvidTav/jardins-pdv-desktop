import { afterEach, describe, expect, it } from 'vitest'
import { criarMesaRepository } from '../../../src/main/modules/mesas/repositories/mesa.repository'
import { criarInativarMesa } from '../../../src/main/modules/mesas/use-cases/inativar-mesa'
import {
  CODIGOS_ERRO_PEDIDOS,
  ErroPedidos,
} from '../../../src/main/modules/pedidos/errors/erros-pedidos'
import { criarCriarPedidoMesa } from '../../../src/main/modules/pedidos/use-cases/criar-pedido-mesa'
import { criarCriarPedidoBalcao } from '../../../src/main/modules/pedidos/use-cases/criar-pedido-balcao'
import { STATUS_MESA } from '@shared/types/mesa'
import { itemPedidoEstaAtivo } from '@shared/types/pedido'
import { mapearPedidoParaComanda } from '../../../src/main/modules/impressao/templates/mapear-pedido-impressao'
import { montarComanda } from '../../../src/main/modules/impressao/templates/montar-comanda'
import { prepararAmbientePedidos } from '../../helpers/pedido-teste'
import { prepararBancoTeste } from '../../helpers/banco-teste'
import { criarCriarMesasPorIntervalo } from '../../../src/main/modules/mesas/use-cases/criar-mesas-por-intervalo'
import { criarObterResumoPedido } from '../../../src/main/modules/pedidos/use-cases/consultas-pedido'

describe('pedidos', () => {
  let encerrarBanco: (() => void) | undefined

  afterEach(() => {
    encerrarBanco?.()
    encerrarBanco = undefined
  })

  it('cria pedido de mesa com caixa aberto', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })

    expect(pedido.status).toBe('ABERTO')
    expect(pedido.mesaId).toBe(ambiente.mesa.id)
    expect(pedido.totalCentavos).toBe(0)
  })

  it('impede pedido sem caixa aberto', async () => {
    const banco = await prepararBancoTeste()
    encerrarBanco = banco.encerrar

    const criarMesasPorIntervalo = criarCriarMesasPorIntervalo()
    const [mesa] = criarMesasPorIntervalo({ numeroInicial: 3, numeroFinal: 3 })
    const criarPedidoMesa = criarCriarPedidoMesa()

    try {
      criarPedidoMesa({ mesaId: mesa.id })
    } catch (erro) {
      expect((erro as ErroPedidos).codigo).toBe(CODIGOS_ERRO_PEDIDOS.CAIXA_NAO_ABERTO)
    }
  })

  it('impede pedido em mesa inativa', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const inativarMesa = criarInativarMesa(ambiente.repositorioMesa)
    inativarMesa({ mesaId: ambiente.mesa.id })

    try {
      ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    } catch (erro) {
      expect((erro as ErroPedidos).codigo).toBe(CODIGOS_ERRO_PEDIDOS.MESA_INATIVA)
    }
  })

  it('cria pedido balcao', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const pedido = ambiente.criarPedidoBalcao()

    expect(pedido.tipo).toBe('BALCAO')
    expect(pedido.mesaId).toBeNull()
    expect(ambiente.criarPedidoBalcao().id).toBe(pedido.id)
  })

  it('adiciona produto ativo ao pedido', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    const resumo = ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 2,
    })

    expect(resumo.itens).toHaveLength(1)
    expect(resumo.itens[0]?.precoUnitarioCentavos).toBe(600)
    expect(resumo.pedido.totalCentavos).toBe(1200)
  })

  it('impede produto inativo no pedido', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    ambiente.inativarProduto({ produtoId: ambiente.produto.id })

    try {
      ambiente.adicionarItemPedido({
        pedidoId: pedido.id,
        produtoId: ambiente.produto.id,
        quantidade: 1,
      })
    } catch (erro) {
      expect((erro as ErroPedidos).codigo).toBe(CODIGOS_ERRO_PEDIDOS.PRODUTO_INATIVO)
    }
  })

  it('impede quantidade zero', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })

    try {
      ambiente.adicionarItemPedido({
        pedidoId: pedido.id,
        produtoId: ambiente.produto.id,
        quantidade: 0,
      })
    } catch (erro) {
      expect((erro as ErroPedidos).codigo).toBe(CODIGOS_ERRO_PEDIDOS.QUANTIDADE_INVALIDA)
    }
  })

  it('recalcula total ao alterar quantidade', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    const resumoInicial = ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 1,
    })

    const resumoAtualizado = ambiente.alterarQuantidadeItemPedido({
      pedidoId: pedido.id,
      itemId: resumoInicial.itens[0]!.id,
      quantidade: 3,
    })

    expect(resumoAtualizado.pedido.totalCentavos).toBe(1800)
  })

  it('grava observacao no item e ela sai na comanda', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    const inicial = ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 1,
    })
    const itemId = inicial.itens[0]!.id

    const comObservacao = ambiente.definirObservacaoItemPedido({
      pedidoId: pedido.id,
      itemId,
      observacao: 'sem gelo',
    })

    expect(comObservacao.itens[0]?.observacao).toBe('sem gelo')

    const texto = montarComanda(mapearPedidoParaComanda(comObservacao, ambiente.mesa)).join('\n')
    expect(texto).toContain('OBS: sem gelo')

    ambiente.repositorioItem.marcarEnviadosCozinha([itemId])
    const reenviado = ambiente.definirObservacaoItemPedido({
      pedidoId: pedido.id,
      itemId,
      observacao: 'sem gelo e sem limao',
    })

    expect(reenviado.itens[0]?.observacao).toBe('sem gelo e sem limao')
    expect(reenviado.itens[0]?.enviadoCozinhaEm).toBeNull()
  })

  it('abre nova linha ao adicionar o mesmo produto ja enviado para cozinha', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    const primeiro = ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 1,
    })
    ambiente.repositorioItem.marcarEnviadosCozinha([primeiro.itens[0]!.id])

    const resumo = ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 1,
    })

    expect(resumo.itens).toHaveLength(2)
    expect(resumo.itens.filter((item) => !item.enviadoCozinhaEm)).toHaveLength(1)
  })

  it('incrementa quantidade ao adicionar o mesmo produto ainda nao enviado', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 1,
    })
    const resumo = ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 1,
    })

    expect(resumo.itens).toHaveLength(1)
    expect(resumo.itens[0]?.quantidade).toBe(2)
    expect(resumo.pedido.totalCentavos).toBe(1200)
  })

  it('exclui item nao enviado sem persistir cancelamento', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    const resumo = ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 2,
    })

    const resumoFinal = ambiente.cancelarItemPedido({
      pedidoId: pedido.id,
      itemId: resumo.itens[0]!.id,
    })

    expect(resumoFinal.itens).toHaveLength(0)
    expect(resumoFinal.pedido.totalCentavos).toBe(0)
    expect(ambiente.repositorioItem.listarPorPedido(pedido.id, false)).toHaveLength(0)
  })

  it('cancela com motivo item ja enviado para cozinha', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    const resumo = ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 1,
    })
    const itemId = resumo.itens[0]!.id
    ambiente.repositorioItem.marcarEnviadosCozinha([itemId])

    ambiente.cancelarItemPedido({
      pedidoId: pedido.id,
      itemId,
      motivoCancelamento: 'Erro de lancamento',
    })

    const itensPersistidos = ambiente.repositorioItem.listarPorPedido(pedido.id, false)

    expect(itensPersistidos).toHaveLength(1)
    expect(itensPersistidos[0]?.canceladoEm).not.toBeNull()
    expect(itensPersistidos[0]?.motivoCancelamento).toBe('Erro de lancamento')
    expect(itemPedidoEstaAtivo(itensPersistidos[0]!)).toBe(false)
  })

  it('exige motivo para cancelar item enviado para cozinha', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    const resumo = ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 1,
    })
    const itemId = resumo.itens[0]!.id
    ambiente.repositorioItem.marcarEnviadosCozinha([itemId])

    try {
      ambiente.cancelarItemPedido({
        pedidoId: pedido.id,
        itemId,
      })
      throw new Error('deveria ter falhado')
    } catch (erro) {
      expect((erro as ErroPedidos).codigo).toBe(CODIGOS_ERRO_PEDIDOS.ENTRADA_INVALIDA)
    }
  })

  it('inclui itens cancelados no resumo detalhado', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const obterResumo = criarObterResumoPedido()
    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    const resumo = ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 1,
    })
    const itemId = resumo.itens[0]!.id
    ambiente.repositorioItem.marcarEnviadosCozinha([itemId])

    ambiente.cancelarItemPedido({
      pedidoId: pedido.id,
      itemId,
      motivoCancelamento: 'Troca de produto',
    })

    const resumoDetalhado = obterResumo({
      pedidoId: pedido.id,
      incluirItensCancelados: true,
    })

    expect(resumoDetalhado.itens).toHaveLength(1)
    expect(resumoDetalhado.itens[0]?.canceladoEm).not.toBeNull()
  })

  it('cancela todos os itens ativos ao cancelar pedido', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 1,
    })
    ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 2,
      observacao: 'sem gelo',
    })

    const pedidoCancelado = ambiente.cancelarPedido({
      pedidoId: pedido.id,
      motivoCancelamento: 'Mesa fechou sem consumo',
    })

    const itensPersistidos = ambiente.repositorioItem.listarPorPedido(pedido.id, false)

    expect(itensPersistidos).toHaveLength(2)
    expect(itensPersistidos.every((item) => item.canceladoEm !== null)).toBe(true)
    expect(
      itensPersistidos.every(
        (item) => item.motivoCancelamento === 'Mesa fechou sem consumo',
      ),
    ).toBe(true)
    expect(pedidoCancelado.motivoCancelamento).toBe('Mesa fechou sem consumo')
  })

  it('impede alteracao em pedido cancelado', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    const resumo = ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 1,
    })

    ambiente.cancelarPedido({
      pedidoId: pedido.id,
      motivoCancelamento: 'Pedido duplicado',
    })

    try {
      ambiente.alterarQuantidadeItemPedido({
        pedidoId: pedido.id,
        itemId: resumo.itens[0]!.id,
        quantidade: 2,
      })
    } catch (erro) {
      expect((erro as ErroPedidos).codigo).toBe(CODIGOS_ERRO_PEDIDOS.PEDIDO_NAO_ABERTO)
    }
  })

  it('ocupa mesa ao abrir pedido e libera ao cancelar', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    let mesa = ambiente.repositorioMesa.buscarPorId(ambiente.mesa.id)

    expect(mesa?.status).toBe(STATUS_MESA.OCUPADA)

    ambiente.cancelarPedido({
      pedidoId: pedido.id,
      motivoCancelamento: 'Cliente saiu',
    })
    mesa = ambiente.repositorioMesa.buscarPorId(ambiente.mesa.id)

    expect(mesa?.status).toBe(STATUS_MESA.LIVRE)
  })

  it('copia preco do produto no item', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 1,
    })

    ambiente.repositorioProduto.atualizar({
      produtoId: ambiente.produto.id,
      precoCentavos: 900,
    })

    const resumo = ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 1,
    })

    const precos = resumo.itens.map((item) => item.precoUnitarioCentavos)
    expect(precos).toContain(600)
    expect(precos).toContain(900)
  })
})
