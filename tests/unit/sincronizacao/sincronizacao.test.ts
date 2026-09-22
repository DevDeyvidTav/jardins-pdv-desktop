import { afterEach, describe, expect, it } from 'vitest'
import { OPERACAO_SYNC, STATUS_SYNC_OUTBOX, ENTIDADE_SYNC } from '@shared/types/sincronizacao'
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
    const eventoPedido = pendentes.find((evento) => evento.entidade === ENTIDADE_SYNC.PEDIDO)

    expect(eventoPedido).toBeDefined()
    expect(eventoPedido?.entidadeId).toBe(pedido.id)
    expect(eventoPedido?.operacao).toBe(OPERACAO_SYNC.CREATE)
    expect(eventoPedido?.status).toBe(STATUS_SYNC_OUTBOX.PENDENTE)
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
      pagamentos: Record<string, unknown>[]
      pizzas: Record<string, unknown>[]
    }

    expect(payload.pedido.id).toBe(pedido.id)
    expect(payload.pedido.sessaoCaixaId).toBe(pedido.sessaoCaixaId)
    expect(payload.itens).toHaveLength(1)
    expect(payload.itens[0]?.produtoNome).toBe(ambiente.produto.nome)
    expect(payload.itens[0]?.pedidoId).toBe(pedido.id)
    expect(payload.pagamentos).toEqual([])
    expect(payload.pizzas).toEqual([])
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

  it('fechar sessao de caixa registra evento SESSAO_CAIXA UPDATE', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const { criarFecharSessaoCaixa } = await import(
      '../../../src/main/modules/caixa/use-cases/fechar-sessao-caixa'
    )
    const fecharSessaoCaixa = criarFecharSessaoCaixa()

    fecharSessaoCaixa({ saldoFinalInformadoCentavos: 0 })

    const pendentes = criarSyncOutboxRepository().listarPendentes(20)
    const eventoFechamento = pendentes.find(
      (evento) =>
        evento.entidade === ENTIDADE_SYNC.SESSAO_CAIXA &&
        evento.operacao === OPERACAO_SYNC.UPDATE,
    )

    expect(eventoFechamento).toBeDefined()
    expect(eventoFechamento?.payload.status).toBe('FECHADO')
  })

  it('movimento manual registra evento MOVIMENTO_CAIXA CREATE', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const { criarRegistrarMovimentoCaixa } = await import(
      '../../../src/main/modules/caixa/use-cases/registrar-movimento-caixa'
    )
    const registrarMovimento = criarRegistrarMovimentoCaixa()

    registrarMovimento({
      tipo: 'SUPRIMENTO',
      valorCentavos: 2000,
      descricao: 'Troco inicial extra',
    })

    const pendentes = criarSyncOutboxRepository().listarPendentes(20)
    const eventoMovimento = pendentes.find(
      (evento) => evento.entidade === ENTIDADE_SYNC.MOVIMENTO_CAIXA,
    )

    expect(eventoMovimento?.operacao).toBe(OPERACAO_SYNC.CREATE)
    expect(eventoMovimento?.payload.tipo).toBe('SUPRIMENTO')
  })

  it('cadastro de produto e categoria entram na outbox mesmo sem venda', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const pendentes = criarSyncOutboxRepository().listarPendentes(50)

    expect(
      pendentes.some((evento) => evento.entidade === ENTIDADE_SYNC.CATEGORIA_PRODUTO),
    ).toBe(true)
    expect(
      pendentes.some(
        (evento) =>
          evento.entidade === ENTIDADE_SYNC.PRODUTO &&
          evento.payload.nome === ambiente.produto.nome,
      ),
    ).toBe(true)
    expect(pendentes.some((evento) => evento.entidade === ENTIDADE_SYNC.MESA)).toBe(true)
  })

  it('backfill enfileira historico de pedidos e sessoes uma unica vez', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    const { enfileirarHistoricoInicial } = await import(
      '../../../src/main/modules/sincronizacao/services/enfileirar-historico-sync'
    )

    enfileirarHistoricoInicial()
    const depoisDoPrimeiro = criarSyncOutboxRepository().listarPendentes(200)
    const pedidosNoPrimeiro = depoisDoPrimeiro.filter(
      (evento) =>
        evento.entidade === ENTIDADE_SYNC.PEDIDO && evento.entidadeId === pedido.id,
    )
    const sessoesNoPrimeiro = depoisDoPrimeiro.filter(
      (evento) => evento.entidade === ENTIDADE_SYNC.SESSAO_CAIXA,
    )

    expect(pedidosNoPrimeiro.length).toBeGreaterThanOrEqual(1)
    expect(sessoesNoPrimeiro.length).toBeGreaterThanOrEqual(1)

    enfileirarHistoricoInicial()
    const depoisDoSegundo = criarSyncOutboxRepository().listarPendentes(200)
    expect(depoisDoSegundo).toHaveLength(depoisDoPrimeiro.length)
  })

  it('pagamento e pizza entram no payload do pedido', async () => {
    const { prepararAmbientePizzas } = await import('../../helpers/pizza-teste')
    const ambiente = await prepararAmbientePizzas()
    encerrarBanco = ambiente.encerrar

    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    ambiente.adicionarPizza({
      pedidoId: pedido.id,
      categoriaId: ambiente.categoria.id,
      tamanhoId: ambiente.tamanhoG.id,
      saborIds: [ambiente.sabores.calabresa.id],
    })
    ambiente.registrarPagamentoPedido({
      pedidoId: pedido.id,
      formaPagamento: 'DINHEIRO',
      valorCentavos: 5000,
    })

    const payload = montarPayloadPedidoSync(pedido.id) as {
      pedido: Record<string, unknown>
      pagamentos: Record<string, unknown>[]
      pizzas: Array<{
        tamanhoNomeSnapshot: string
        sabores: Array<{ saborNomeSnapshot: string }>
      }>
    }

    expect(payload.pedido.status).toBe('FINALIZADO')
    expect(payload.pagamentos).toHaveLength(1)
    expect(payload.pagamentos[0]?.formaPagamento).toBe('DINHEIRO')
    expect(payload.pagamentos[0]?.valorCentavos).toBe(5000)
    expect(payload.pagamentos[0]?.valorRecebidoCentavos).toBe(5000)
    expect(payload.pagamentos[0]?.trocoCentavos).toBe(0)
    expect(payload.pizzas).toHaveLength(1)
    expect(payload.pizzas[0]?.tamanhoNomeSnapshot).toBe('Grande')
    expect(payload.pizzas[0]?.sabores[0]?.saborNomeSnapshot).toBe('Calabresa')
    expect(payload.pedido.fiscalSolicitado).toBe(false)
    expect(
      (payload as unknown as { itens: Array<{ fiscalNcm: string | null }> }).itens[0]?.fiscalNcm,
    ).toBe('19059090')
  })
})
