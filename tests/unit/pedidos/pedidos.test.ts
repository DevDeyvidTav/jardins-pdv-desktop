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

  it('recalcula total ao cancelar item', async () => {
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
  })

  it('preserva item cancelado no banco com soft delete', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    const resumo = ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 1,
    })

    ambiente.cancelarItemPedido({
      pedidoId: pedido.id,
      itemId: resumo.itens[0]!.id,
    })

    const itensPersistidos = ambiente.repositorioItem.listarPorPedido(pedido.id, false)

    expect(itensPersistidos).toHaveLength(1)
    expect(itensPersistidos[0]?.canceladoEm).not.toBeNull()
    expect(itemPedidoEstaAtivo(itensPersistidos[0]!)).toBe(false)
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

    ambiente.cancelarItemPedido({
      pedidoId: pedido.id,
      itemId: resumo.itens[0]!.id,
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
    })

    ambiente.cancelarPedido({ pedidoId: pedido.id })

    const itensPersistidos = ambiente.repositorioItem.listarPorPedido(pedido.id, false)

    expect(itensPersistidos).toHaveLength(2)
    expect(itensPersistidos.every((item) => item.canceladoEm !== null)).toBe(true)
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

    ambiente.cancelarPedido({ pedidoId: pedido.id })

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

    ambiente.cancelarPedido({ pedidoId: pedido.id })
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
