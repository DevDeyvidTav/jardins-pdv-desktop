import { afterEach, describe, expect, it } from 'vitest'
import {
  MOTIVO_ENCERRAMENTO_AGRUPAMENTO,
  STATUS_MESA,
  TIPO_MOVIMENTACAO_MESA,
} from '@shared/types/mesa'
import { STATUS_PEDIDO } from '@shared/types/pedido'
import { FORMA_PAGAMENTO } from '@shared/types/pagamento-pedido'
import {
  CODIGOS_ERRO_MESAS,
  ErroMesas,
} from '../../../src/main/modules/mesas/errors/erros-mesas'
import {
  criarAgruparMesasPedido,
  criarTransferirPedidoMesa,
} from '../../../src/main/modules/mesas/use-cases/transferir-e-agrupar-mesas'
import {
  criarEncerrarAgrupamentoMesa,
  criarListarHistoricoPedidoMesa,
  criarObterResumoAgrupamentoMesa,
} from '../../../src/main/modules/mesas/use-cases/encerrar-e-historico-mesas'
import { criarInativarMesa } from '../../../src/main/modules/mesas/use-cases/inativar-mesa'
import { criarAplicarDescontoPedido } from '../../../src/main/modules/pedidos/use-cases/aplicar-desconto-pedido'
import { criarObterResumoPedido } from '../../../src/main/modules/pedidos/use-cases/consultas-pedido'
import { prepararAmbientePedidos } from '../../helpers/pedido-teste'

async function prepararAmbienteTransferencia() {
  const ambiente = await prepararAmbientePedidos()
  const [mesa2, mesa3, mesa4] = ambiente.criarMesasPorIntervalo({
    numeroInicial: 2,
    numeroFinal: 4,
  })

  const transferir = criarTransferirPedidoMesa(
    ambiente.repositorioPedido,
    ambiente.repositorioMesa,
    ambiente.repositorioSessao,
  )
  const agrupar = criarAgruparMesasPedido(
    ambiente.repositorioPedido,
    ambiente.repositorioMesa,
    ambiente.repositorioSessao,
  )
  const encerrarAgrupamento = criarEncerrarAgrupamentoMesa(ambiente.repositorioPedido)
  const listarHistorico = criarListarHistoricoPedidoMesa()
  const obterAgrupamento = criarObterResumoAgrupamentoMesa(
    ambiente.repositorioPedido,
    ambiente.repositorioMesa,
  )
  const obterResumoPedido = criarObterResumoPedido(
    ambiente.repositorioPedido,
    ambiente.repositorioItem,
  )
  const obterResumo = (pedidoId: string) => obterResumoPedido({ pedidoId })
  const aplicarDesconto = criarAplicarDescontoPedido(
    ambiente.repositorioPedido,
    ambiente.repositorioItem,
    ambiente.repositorioSessao,
    ambiente.repositorioMesa,
  )
  const inativarMesa = criarInativarMesa(ambiente.repositorioMesa)

  return {
    ...ambiente,
    mesa1: ambiente.mesa,
    mesa2,
    mesa3,
    mesa4,
    transferir,
    agrupar,
    encerrarAgrupamento,
    listarHistorico,
    obterAgrupamento,
    obterResumo,
    aplicarDesconto,
    inativarMesa,
  }
}

function esperarErroMesas(acao: () => unknown, codigo: string) {
  try {
    acao()
    expect.fail('deveria ter lancado ErroMesas')
  } catch (erro) {
    expect(erro).toBeInstanceOf(ErroMesas)
    expect((erro as ErroMesas).codigo).toBe(codigo)
  }
}

describe('transferencia e agrupamento de mesas', () => {
  let encerrarBanco: (() => void) | undefined

  afterEach(() => {
    encerrarBanco?.()
    encerrarBanco = undefined
  })

  async function setup() {
    const ambiente = await prepararAmbienteTransferencia()
    encerrarBanco = ambiente.encerrar
    return ambiente
  }

  describe('transferirPedidoMesa', () => {
    it('transfere pedido aberto para mesa livre mantendo o mesmo pedidoId', async () => {
      const ambiente = await setup()
      const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa1.id })

      const resultado = ambiente.transferir({
        pedidoId: pedido.id,
        mesaDestinoId: ambiente.mesa2.id,
      })

      expect(resultado.pedidoId).toBe(pedido.id)
      expect(resultado.mesaOrigem.id).toBe(ambiente.mesa1.id)
      expect(resultado.mesaDestino.id).toBe(ambiente.mesa2.id)

      const pedidoAtual = ambiente.repositorioPedido.buscarPorId(pedido.id)
      expect(pedidoAtual?.mesaId).toBe(ambiente.mesa2.id)
      expect(ambiente.repositorioMesa.buscarPorId(ambiente.mesa1.id)?.status).toBe(
        STATUS_MESA.LIVRE,
      )
      expect(ambiente.repositorioMesa.buscarPorId(ambiente.mesa2.id)?.status).toBe(
        STATUS_MESA.OCUPADA,
      )
    })

    it('preserva itens, descontos, pagamentos e totais apos transferencia', async () => {
      const ambiente = await setup()
      const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa1.id })
      ambiente.adicionarItemPedido({
        pedidoId: pedido.id,
        produtoId: ambiente.produto.id,
        quantidade: 2,
        descontoCentavos: 100,
      })
      ambiente.aplicarDesconto({
        pedidoId: pedido.id,
        descontoCentavos: 200,
        motivoDesconto: 'Promocao',
      })
      ambiente.registrarPagamentoPedido({
        pedidoId: pedido.id,
        formaPagamento: FORMA_PAGAMENTO.PIX,
        valorCentavos: 300,
      })

      const antes = ambiente.obterResumo(pedido.id)
      const pagamentosAntes = ambiente.repositorioPagamento.listarPorPedido(pedido.id)

      ambiente.transferir({
        pedidoId: pedido.id,
        mesaDestinoId: ambiente.mesa2.id,
      })

      const depois = ambiente.obterResumo(pedido.id)
      const pagamentosDepois = ambiente.repositorioPagamento.listarPorPedido(pedido.id)

      expect(depois.pedido.id).toBe(antes.pedido.id)
      expect(depois.pedido.mesaId).toBe(ambiente.mesa2.id)
      expect(depois.pedido.subtotalCentavos).toBe(antes.pedido.subtotalCentavos)
      expect(depois.pedido.descontoItensCentavos).toBe(antes.pedido.descontoItensCentavos)
      expect(depois.pedido.descontoPedidoCentavos).toBe(antes.pedido.descontoPedidoCentavos)
      expect(depois.pedido.totalCentavos).toBe(antes.pedido.totalCentavos)
      expect(depois.pedido.valorPagoCentavos).toBe(antes.pedido.valorPagoCentavos)
      expect(depois.pedido.valorRestanteCentavos).toBe(antes.pedido.valorRestanteCentavos)
      expect(depois.itens).toHaveLength(antes.itens.length)
      expect(depois.itens[0]?.quantidade).toBe(antes.itens[0]?.quantidade)
      expect(depois.itens[0]?.descontoCentavos).toBe(antes.itens[0]?.descontoCentavos)
      expect(pagamentosDepois).toHaveLength(pagamentosAntes.length)
      expect(pagamentosDepois[0]?.valorCentavos).toBe(pagamentosAntes[0]?.valorCentavos)
      expect(pagamentosDepois[0]?.formaPagamento).toBe(FORMA_PAGAMENTO.PIX)
    })

    it('bloqueia transferencia para a mesma mesa', async () => {
      const ambiente = await setup()
      const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa1.id })

      esperarErroMesas(
        () =>
          ambiente.transferir({
            pedidoId: pedido.id,
            mesaDestinoId: ambiente.mesa1.id,
          }),
        CODIGOS_ERRO_MESAS.MESA_DESTINO_IGUAL_ORIGEM,
      )
    })

    it('bloqueia transferencia para mesa inativa', async () => {
      const ambiente = await setup()
      const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa1.id })
      ambiente.inativarMesa({ mesaId: ambiente.mesa2.id })

      esperarErroMesas(
        () =>
          ambiente.transferir({
            pedidoId: pedido.id,
            mesaDestinoId: ambiente.mesa2.id,
          }),
        CODIGOS_ERRO_MESAS.MESA_DESTINO_INATIVA,
      )
    })

    it('bloqueia transferencia para mesa ocupada', async () => {
      const ambiente = await setup()
      const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa1.id })
      ambiente.criarPedidoMesa({ mesaId: ambiente.mesa2.id })

      esperarErroMesas(
        () =>
          ambiente.transferir({
            pedidoId: pedido.id,
            mesaDestinoId: ambiente.mesa2.id,
          }),
        CODIGOS_ERRO_MESAS.MESA_DESTINO_NAO_ESTA_LIVRE,
      )
    })

    it('bloqueia transferencia de pedido cancelado', async () => {
      const ambiente = await setup()
      const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa1.id })
      ambiente.cancelarPedido({
        pedidoId: pedido.id,
        motivoCancelamento: 'Cliente desistiu',
      })

      esperarErroMesas(
        () =>
          ambiente.transferir({
            pedidoId: pedido.id,
            mesaDestinoId: ambiente.mesa2.id,
          }),
        CODIGOS_ERRO_MESAS.PEDIDO_NAO_ESTA_ABERTO,
      )
      expect(ambiente.repositorioPedido.buscarPorId(pedido.id)?.status).toBe(
        STATUS_PEDIDO.CANCELADO,
      )
    })

    it('bloqueia transferencia de pedido finalizado', async () => {
      const ambiente = await setup()
      const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa1.id })
      ambiente.adicionarItemPedido({
        pedidoId: pedido.id,
        produtoId: ambiente.produto.id,
        quantidade: 1,
      })
      ambiente.registrarPagamentoPedido({
        pedidoId: pedido.id,
        formaPagamento: FORMA_PAGAMENTO.DINHEIRO,
        valorCentavos: 600,
      })

      expect(ambiente.repositorioPedido.buscarPorId(pedido.id)?.status).toBe(
        STATUS_PEDIDO.FINALIZADO,
      )

      esperarErroMesas(
        () =>
          ambiente.transferir({
            pedidoId: pedido.id,
            mesaDestinoId: ambiente.mesa2.id,
          }),
        CODIGOS_ERRO_MESAS.PEDIDO_NAO_ESTA_ABERTO,
      )
    })

    it('bloqueia transferencia de pedido agrupado', async () => {
      const ambiente = await setup()
      const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa1.id })
      ambiente.agrupar({
        pedidoId: pedido.id,
        mesaIds: [ambiente.mesa1.id, ambiente.mesa2.id],
      })

      esperarErroMesas(
        () =>
          ambiente.transferir({
            pedidoId: pedido.id,
            mesaDestinoId: ambiente.mesa3.id,
          }),
        CODIGOS_ERRO_MESAS.TRANSFERENCIA_DE_PEDIDO_AGRUPADO_NAO_SUPORTADA,
      )
    })

    it('cria registro de auditoria PEDIDO_TRANSFERIDO', async () => {
      const ambiente = await setup()
      const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa1.id })

      ambiente.transferir({
        pedidoId: pedido.id,
        mesaDestinoId: ambiente.mesa2.id,
        motivo: 'Cliente mudou de lugar',
      })

      const historico = ambiente.listarHistorico({ pedidoId: pedido.id })
      const transferencia = historico.find(
        (item) => item.tipo === TIPO_MOVIMENTACAO_MESA.PEDIDO_TRANSFERIDO,
      )

      expect(transferencia).toBeDefined()
      expect(transferencia?.mesaOrigemId).toBe(ambiente.mesa1.id)
      expect(transferencia?.mesaDestinoId).toBe(ambiente.mesa2.id)
      expect(transferencia?.motivo).toBe('Cliente mudou de lugar')
    })
  })

  describe('agruparMesasPedido', () => {
    it('agrupa duas mesas com um pedido aberto', async () => {
      const ambiente = await setup()
      const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa1.id })

      const resultado = ambiente.agrupar({
        pedidoId: pedido.id,
        mesaIds: [ambiente.mesa1.id, ambiente.mesa2.id],
      })

      expect(resultado.pedidoId).toBe(pedido.id)
      expect(resultado.mesas).toHaveLength(2)
      expect(resultado.mesaPrincipal.id).toBe(ambiente.mesa1.id)
      expect(ambiente.repositorioPedido.buscarPorId(pedido.id)?.mesaAgrupamentoId).toBe(
        resultado.agrupamentoId,
      )
    })

    it('agrupa mais de duas mesas', async () => {
      const ambiente = await setup()
      const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa1.id })

      const resultado = ambiente.agrupar({
        pedidoId: pedido.id,
        mesaIds: [ambiente.mesa1.id, ambiente.mesa2.id, ambiente.mesa3.id, ambiente.mesa4.id],
      })

      expect(resultado.mesas).toHaveLength(4)
      expect(resultado.mesas.filter((m) => m.ehPrincipal)).toHaveLength(1)
    })

    it('mantem mesa do pedido como principal e secundarias como AGRUPADA', async () => {
      const ambiente = await setup()
      const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa1.id })

      ambiente.agrupar({
        pedidoId: pedido.id,
        mesaIds: [ambiente.mesa2.id, ambiente.mesa1.id, ambiente.mesa3.id],
      })

      expect(ambiente.repositorioPedido.buscarPorId(pedido.id)?.mesaId).toBe(
        ambiente.mesa1.id,
      )
      expect(ambiente.repositorioMesa.buscarPorId(ambiente.mesa1.id)?.status).toBe(
        STATUS_MESA.OCUPADA,
      )
      expect(ambiente.repositorioMesa.buscarPorId(ambiente.mesa2.id)?.status).toBe(
        STATUS_MESA.AGRUPADA,
      )
      expect(ambiente.repositorioMesa.buscarPorId(ambiente.mesa3.id)?.status).toBe(
        STATUS_MESA.AGRUPADA,
      )
    })

    it('bloqueia agrupamento com menos de duas mesas', async () => {
      const ambiente = await setup()
      const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa1.id })

      esperarErroMesas(
        () =>
          ambiente.agrupar({
            pedidoId: pedido.id,
            mesaIds: [ambiente.mesa1.id],
          }),
        CODIGOS_ERRO_MESAS.QUANTIDADE_MESAS_AGRUPAMENTO_INVALIDA,
      )
    })

    it('bloqueia IDs de mesa duplicados', async () => {
      const ambiente = await setup()
      const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa1.id })

      esperarErroMesas(
        () =>
          ambiente.agrupar({
            pedidoId: pedido.id,
            mesaIds: [ambiente.mesa1.id, ambiente.mesa1.id],
          }),
        CODIGOS_ERRO_MESAS.ENTRADA_INVALIDA,
      )
    })

    it('bloqueia agrupamento sem a mesa principal do pedido na lista', async () => {
      const ambiente = await setup()
      const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa1.id })

      esperarErroMesas(
        () =>
          ambiente.agrupar({
            pedidoId: pedido.id,
            mesaIds: [ambiente.mesa2.id, ambiente.mesa3.id],
          }),
        CODIGOS_ERRO_MESAS.MESA_PRINCIPAL_NAO_INFORMADA,
      )
    })

    it('bloqueia quando secundaria possui pedido aberto', async () => {
      const ambiente = await setup()
      const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa1.id })
      ambiente.criarPedidoMesa({ mesaId: ambiente.mesa2.id })

      esperarErroMesas(
        () =>
          ambiente.agrupar({
            pedidoId: pedido.id,
            mesaIds: [ambiente.mesa1.id, ambiente.mesa2.id],
          }),
        CODIGOS_ERRO_MESAS.MESCLAGEM_DE_PEDIDOS_NAO_SUPORTADA,
      )
    })

    it('bloqueia mesa inativa no agrupamento', async () => {
      const ambiente = await setup()
      const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa1.id })
      ambiente.inativarMesa({ mesaId: ambiente.mesa2.id })

      esperarErroMesas(
        () =>
          ambiente.agrupar({
            pedidoId: pedido.id,
            mesaIds: [ambiente.mesa1.id, ambiente.mesa2.id],
          }),
        CODIGOS_ERRO_MESAS.MESA_DESTINO_INATIVA,
      )
    })

    it('bloqueia mesa ja pertencente a agrupamento', async () => {
      const ambiente = await setup()
      const pedidoA = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa1.id })
      ambiente.agrupar({
        pedidoId: pedidoA.id,
        mesaIds: [ambiente.mesa1.id, ambiente.mesa2.id],
      })

      const pedidoB = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa3.id })

      esperarErroMesas(
        () =>
          ambiente.agrupar({
            pedidoId: pedidoB.id,
            mesaIds: [ambiente.mesa3.id, ambiente.mesa2.id],
          }),
        CODIGOS_ERRO_MESAS.MESA_DESTINO_NAO_ESTA_LIVRE,
      )
    })

    it('cria vinculos mesa_agrupada e auditoria MESAS_AGRUPADAS', async () => {
      const ambiente = await setup()
      const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa1.id })

      const resultado = ambiente.agrupar({
        pedidoId: pedido.id,
        mesaIds: [ambiente.mesa1.id, ambiente.mesa2.id],
        motivo: 'Familia grande',
      })

      const resumo = ambiente.obterAgrupamento({ pedidoId: pedido.id })
      expect(resumo?.agrupamento.id).toBe(resultado.agrupamentoId)
      expect(resumo?.agrupamento.status).toBe('ATIVO')
      expect(resumo?.mesas).toHaveLength(2)
      expect(resumo?.mesas.find((m) => m.ehPrincipal)?.id).toBe(ambiente.mesa1.id)
      expect(resumo?.mesas.find((m) => !m.ehPrincipal)?.id).toBe(ambiente.mesa2.id)

      const historico = ambiente.listarHistorico({ pedidoId: pedido.id })
      const agrupamento = historico.find(
        (item) => item.tipo === TIPO_MOVIMENTACAO_MESA.MESAS_AGRUPADAS,
      )
      expect(agrupamento).toBeDefined()
      expect(agrupamento?.mesaAgrupamentoId).toBe(resultado.agrupamentoId)
      expect(agrupamento?.motivo).toBe('Familia grande')
    })
  })

  describe('encerrarAgrupamentoMesa', () => {
    it('encerra manualmente liberando secundarias e mantendo principal ocupada com pedido aberto', async () => {
      const ambiente = await setup()
      const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa1.id })
      ambiente.agrupar({
        pedidoId: pedido.id,
        mesaIds: [ambiente.mesa1.id, ambiente.mesa2.id, ambiente.mesa3.id],
      })

      const encerrado = ambiente.encerrarAgrupamento({
        pedidoId: pedido.id,
        motivo: MOTIVO_ENCERRAMENTO_AGRUPAMENTO.ENCERRAMENTO_MANUAL,
        observacao: 'Separacao solicitada',
      })

      expect(encerrado.status).toBe('ENCERRADO')
      expect(encerrado.motivoEncerramento).toBe(
        MOTIVO_ENCERRAMENTO_AGRUPAMENTO.ENCERRAMENTO_MANUAL,
      )
      expect(ambiente.repositorioPedido.buscarPorId(pedido.id)?.status).toBe(
        STATUS_PEDIDO.ABERTO,
      )
      expect(ambiente.repositorioPedido.buscarPorId(pedido.id)?.mesaAgrupamentoId).toBeNull()
      expect(ambiente.repositorioMesa.buscarPorId(ambiente.mesa1.id)?.status).toBe(
        STATUS_MESA.OCUPADA,
      )
      expect(ambiente.repositorioMesa.buscarPorId(ambiente.mesa2.id)?.status).toBe(
        STATUS_MESA.LIVRE,
      )
      expect(ambiente.repositorioMesa.buscarPorId(ambiente.mesa3.id)?.status).toBe(
        STATUS_MESA.LIVRE,
      )
    })

    it('encerra agrupamento ao finalizar via registrarPagamentoPedido liberando todas as mesas', async () => {
      const ambiente = await setup()
      const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa1.id })
      ambiente.adicionarItemPedido({
        pedidoId: pedido.id,
        produtoId: ambiente.produto.id,
        quantidade: 1,
      })
      ambiente.agrupar({
        pedidoId: pedido.id,
        mesaIds: [ambiente.mesa1.id, ambiente.mesa2.id],
      })

      ambiente.registrarPagamentoPedido({
        pedidoId: pedido.id,
        formaPagamento: FORMA_PAGAMENTO.DINHEIRO,
        valorCentavos: 600,
      })

      expect(ambiente.repositorioPedido.buscarPorId(pedido.id)?.status).toBe(
        STATUS_PEDIDO.FINALIZADO,
      )
      expect(ambiente.repositorioPedido.buscarPorId(pedido.id)?.mesaAgrupamentoId).toBeNull()
      expect(ambiente.repositorioMesa.buscarPorId(ambiente.mesa1.id)?.status).toBe(
        STATUS_MESA.LIVRE,
      )
      expect(ambiente.repositorioMesa.buscarPorId(ambiente.mesa2.id)?.status).toBe(
        STATUS_MESA.LIVRE,
      )
    })

    it('encerra agrupamento ao cancelarPedido liberando todas as mesas', async () => {
      const ambiente = await setup()
      const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa1.id })
      ambiente.agrupar({
        pedidoId: pedido.id,
        mesaIds: [ambiente.mesa1.id, ambiente.mesa2.id],
      })

      ambiente.cancelarPedido({
        pedidoId: pedido.id,
        motivoCancelamento: 'Pedido cancelado',
      })

      expect(ambiente.repositorioPedido.buscarPorId(pedido.id)?.status).toBe(
        STATUS_PEDIDO.CANCELADO,
      )
      expect(ambiente.repositorioPedido.buscarPorId(pedido.id)?.mesaAgrupamentoId).toBeNull()
      expect(ambiente.repositorioMesa.buscarPorId(ambiente.mesa1.id)?.status).toBe(
        STATUS_MESA.LIVRE,
      )
      expect(ambiente.repositorioMesa.buscarPorId(ambiente.mesa2.id)?.status).toBe(
        STATUS_MESA.LIVRE,
      )
    })
  })

  describe('historico e rollback', () => {
    it('registra historico completo: abertura, transferencia, agrupamento e encerramento', async () => {
      const ambiente = await setup()
      const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa1.id })

      ambiente.transferir({
        pedidoId: pedido.id,
        mesaDestinoId: ambiente.mesa2.id,
      })
      ambiente.agrupar({
        pedidoId: pedido.id,
        mesaIds: [ambiente.mesa2.id, ambiente.mesa3.id],
      })
      ambiente.encerrarAgrupamento({
        pedidoId: pedido.id,
        motivo: MOTIVO_ENCERRAMENTO_AGRUPAMENTO.ENCERRAMENTO_MANUAL,
      })

      const tipos = ambiente.listarHistorico({ pedidoId: pedido.id }).map((item) => item.tipo)
      expect(tipos).toContain(TIPO_MOVIMENTACAO_MESA.PEDIDO_ABERTO_NA_MESA)
      expect(tipos).toContain(TIPO_MOVIMENTACAO_MESA.PEDIDO_TRANSFERIDO)
      expect(tipos).toContain(TIPO_MOVIMENTACAO_MESA.MESAS_AGRUPADAS)
      expect(tipos).toContain(TIPO_MOVIMENTACAO_MESA.AGRUPAMENTO_ENCERRADO)
    })

    it('mantem estado inalterado apos tentativa de transferencia para mesa ocupada', async () => {
      const ambiente = await setup()
      const pedidoOrigem = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa1.id })
      ambiente.adicionarItemPedido({
        pedidoId: pedidoOrigem.id,
        produtoId: ambiente.produto.id,
        quantidade: 2,
      })
      const pedidoDestino = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa2.id })

      const snapshotAntes = {
        origem: ambiente.repositorioMesa.buscarPorId(ambiente.mesa1.id),
        destino: ambiente.repositorioMesa.buscarPorId(ambiente.mesa2.id),
        pedidoOrigem: ambiente.repositorioPedido.buscarPorId(pedidoOrigem.id),
        pedidoDestino: ambiente.repositorioPedido.buscarPorId(pedidoDestino.id),
        totalOrigem: ambiente.obterResumo(pedidoOrigem.id).pedido.totalCentavos,
        historicoLen: ambiente.listarHistorico({ pedidoId: pedidoOrigem.id }).length,
      }

      esperarErroMesas(
        () =>
          ambiente.transferir({
            pedidoId: pedidoOrigem.id,
            mesaDestinoId: ambiente.mesa2.id,
          }),
        CODIGOS_ERRO_MESAS.MESA_DESTINO_NAO_ESTA_LIVRE,
      )

      expect(ambiente.repositorioMesa.buscarPorId(ambiente.mesa1.id)?.status).toBe(
        snapshotAntes.origem?.status,
      )
      expect(ambiente.repositorioMesa.buscarPorId(ambiente.mesa2.id)?.status).toBe(
        snapshotAntes.destino?.status,
      )
      expect(ambiente.repositorioPedido.buscarPorId(pedidoOrigem.id)?.mesaId).toBe(
        ambiente.mesa1.id,
      )
      expect(ambiente.repositorioPedido.buscarPorId(pedidoDestino.id)?.mesaId).toBe(
        ambiente.mesa2.id,
      )
      expect(ambiente.obterResumo(pedidoOrigem.id).pedido.totalCentavos).toBe(
        snapshotAntes.totalOrigem,
      )
      expect(ambiente.listarHistorico({ pedidoId: pedidoOrigem.id })).toHaveLength(
        snapshotAntes.historicoLen,
      )
      expect(
        ambiente
          .listarHistorico({ pedidoId: pedidoOrigem.id })
          .some((item) => item.tipo === TIPO_MOVIMENTACAO_MESA.PEDIDO_TRANSFERIDO),
      ).toBe(false)
    })
  })
})
