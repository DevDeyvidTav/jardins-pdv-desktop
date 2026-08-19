import { afterEach, describe, expect, it } from 'vitest'
import { OPERACAO_SYNC, STATUS_SYNC_OUTBOX } from '@shared/types/sincronizacao'
import { montarPayloadPedidoSync } from '../../../src/main/modules/sincronizacao/services/montar-payload-pedido-sync'
import { criarSyncOutboxRepository } from '../../../src/main/modules/sincronizacao/repositories/sync-outbox.repository'
import { prepararAmbientePedidos } from '../../helpers/pedido-teste'
import { prepararBancoTeste } from '../../helpers/banco-teste'

describe('sincronizacao', () => {
  let encerrarBanco: (() => void) | undefined

  afterEach(() => {
    encerrarBanco?.()
    encerrarBanco = undefined
  })

  it('criar pedido de mesa registra evento PENDENTE na outbox', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    const repositorio = criarSyncOutboxRepository()
    const pendentes = repositorio.listarPendentes(10)

    expect(pendentes).toHaveLength(1)
    expect(pendentes[0]?.entidade).toBe('PEDIDO')
    expect(pendentes[0]?.entidadeId).toBe(pedido.id)
    expect(pendentes[0]?.operacao).toBe(OPERACAO_SYNC.CREATE)
    expect(pendentes[0]?.status).toBe(STATUS_SYNC_OUTBOX.PENDENTE)
  })

  it('monta payload de pedido com itens em camelCase', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 2,
    })

    const payload = montarPayloadPedidoSync(pedido.id) as {
      pedido: Record<string, unknown>
      itens: Record<string, unknown>[]
    }

    expect(payload.pedido.id).toBe(pedido.id)
    expect(payload.pedido.sessaoCaixaId).toBe(pedido.sessaoCaixaId)
    expect(payload.itens).toHaveLength(1)
    expect(payload.itens[0]?.produtoNome).toBe(ambiente.produto.nome)
    expect(payload.itens[0]?.pedidoId).toBe(pedido.id)
  })

  it('adicionar item gera evento UPDATE na outbox', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 1,
    })

    const pendentes = criarSyncOutboxRepository().listarPendentes(20)
    expect(pendentes.length).toBeGreaterThanOrEqual(2)
    expect(pendentes.some((evento) => evento.operacao === OPERACAO_SYNC.UPDATE)).toBe(true)
  })

  it('obterEstado reflete contagem de pendentes', async () => {
    const banco = await prepararBancoTeste()
    encerrarBanco = banco.encerrar

    const { obterEstadoSincronizacao } = await import(
      '../../../src/main/modules/sincronizacao/services/sincronizador.service'
    )

    const estado = obterEstadoSincronizacao()
    expect(estado.pendente).toBe(0)
    expect(estado.sincronizado).toBe(0)
    expect(typeof estado.apiConfigurada).toBe('boolean')
  })
})
