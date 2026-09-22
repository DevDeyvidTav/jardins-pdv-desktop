import { describe, expect, it, vi, afterEach } from 'vitest'
import * as enviarImpressora from '../../../src/main/modules/impressao/infraestrutura/enviar-impressora'
import { SETOR_IMPRESSAO } from '../../../src/shared/types/config-impressora'
import { SETOR_COMANDA, TIPO_DOCUMENTO_IMPRESSAO } from '../../../src/shared/types/impressao'
import { prepararBancoTeste } from '../../helpers/banco-teste'
import { obterConexaoBancoLocal } from '../../../src/main/database/inicializar-banco'
import { criarConfigImpressoraRepository } from '../../../src/main/modules/configuracoes/repositories/config-impressora.repository'
import { resolverDestinoConta, resolverDestinoImpressoraPorSetor } from '../../../src/main/modules/impressao/infraestrutura/resolver-destino-impressora'
import {
  mapearItensPedidoParaImpressao,
  mapearPedidoParaComanda,
} from '../../../src/main/modules/impressao/templates/mapear-pedido-impressao'
import { criarImprimirPedido } from '../../../src/main/modules/impressao/use-cases/imprimir-pedido'
import type { ResumoPedido } from '../../../src/shared/types/pedido'

const agora = '2026-08-17T22:40:00.000Z'

function criarResumoBasico(): ResumoPedido {
  return {
    pedido: {
      id: 'ped-1',
      referencia: 10,
      sessaoCaixaId: 'cx-1',
      mesaId: 'mesa-1',
      clienteId: null,
      mesaAgrupamentoId: null,
      tipo: 'MESA',
      status: 'ABERTO',
      subtotalCentavos: 3000,
      descontoCentavos: 0,
      descontoItensCentavos: 0,
      descontoPedidoCentavos: 0,
      taxaEntregaCentavos: 0,
      totalCentavos: 3000,
      valorPagoCentavos: 0,
      valorCortesiaCentavos: 0,
      valorRestanteCentavos: 3000,
      criadoEm: agora,
      atualizadoEm: agora,
      finalizadoEm: null,
      canceladoEm: null,
      motivoCancelamento: null,
      fiscalSolicitado: false,
      fiscalCpfDestinatario: null,
    },
    itens: [
      {
        id: 'item-1',
        pedidoId: 'ped-1',
        produtoId: 'prod-sushi',
        tipo: 'PRODUTO',
        produtoNome: 'Hot roll',
        quantidade: 1,
        precoUnitarioCentavos: 1500,
        subtotalCentavos: 1500,
        descontoCentavos: 0,
        totalCentavos: 1500,
        observacao: null,
        criadoEm: agora,
        atualizadoEm: agora,
        canceladoEm: null,
        motivoCancelamento: null,
        fiscalNcm: null,
        fiscalCfop: null,
        fiscalIcmsOrigem: null,
        fiscalIcmsCsosn: null,
        fiscalPisCst: null,
        fiscalCofinsCst: null,
      },
      {
        id: 'item-2',
        pedidoId: 'ped-1',
        produtoId: 'prod-pizza',
        tipo: 'PRODUTO',
        produtoNome: 'Calzone',
        quantidade: 1,
        precoUnitarioCentavos: 1500,
        subtotalCentavos: 1500,
        descontoCentavos: 0,
        totalCentavos: 1500,
        observacao: null,
        criadoEm: agora,
        atualizadoEm: agora,
        canceladoEm: null,
        motivoCancelamento: null,
        fiscalNcm: null,
        fiscalCfop: null,
        fiscalIcmsOrigem: null,
        fiscalIcmsCsosn: null,
        fiscalPisCst: null,
        fiscalCofinsCst: null,
      },
    ],
    entrega: null,
    divisao: null,
  }
}

describe('roteamento de impressao por categoria', () => {
  it('usa setor_impressao da categoria quando configurado', () => {
    const consultarSetor = (produtoId: string) => {
      if (produtoId === 'prod-sushi') return SETOR_IMPRESSAO.JAPONESA
      if (produtoId === 'prod-pizza') return SETOR_IMPRESSAO.PIZZA
      return null
    }

    const itens = mapearItensPedidoParaImpressao(criarResumoBasico(), consultarSetor)

    expect(itens[0]?.setor).toBe(SETOR_COMANDA.JAPONESA)
    expect(itens[1]?.setor).toBe(SETOR_COMANDA.PIZZA)
  })

  it('gera comandas separadas por setor ativo', () => {
    const consultarSetor = (produtoId: string) =>
      produtoId === 'prod-sushi' ? SETOR_IMPRESSAO.JAPONESA : SETOR_IMPRESSAO.PIZZA

    const comandaJaponesa = mapearPedidoParaComanda(
      criarResumoBasico(),
      { id: 'mesa-1', numero: 3, nome: '3', status: 'OCUPADA', ativo: true, criadoEm: agora, atualizadoEm: agora },
      consultarSetor,
      SETOR_COMANDA.JAPONESA,
    )
    const comandaPizza = mapearPedidoParaComanda(
      criarResumoBasico(),
      { id: 'mesa-1', numero: 3, nome: '3', status: 'OCUPADA', ativo: true, criadoEm: agora, atualizadoEm: agora },
      consultarSetor,
      SETOR_COMANDA.PIZZA,
    )

    expect(comandaJaponesa.setor).toBe(SETOR_COMANDA.JAPONESA)
    expect(comandaJaponesa.itens).toHaveLength(1)
    expect(comandaPizza.setor).toBe(SETOR_COMANDA.PIZZA)
    expect(comandaPizza.itens).toHaveLength(1)
  })

  it('imprime comanda em um job por setor e conta no balcao', () => {
    const enviar = vi.fn()
    const resolverDestino = vi.fn((setor: typeof SETOR_IMPRESSAO[keyof typeof SETOR_IMPRESSAO]) => ({
      tipo: 'SPOOLER' as const,
      nome: `Printer-${setor}`,
    }))

    const imprimir = criarImprimirPedido(
      () => criarResumoBasico(),
      enviar,
      { buscarPorId: () => ({ numero: 3 }) } as never,
      { listarPorPedido: () => [] } as never,
      () => 'Pratos',
      (produtoId) =>
        produtoId === 'prod-sushi' ? SETOR_IMPRESSAO.JAPONESA : SETOR_IMPRESSAO.PIZZA,
      () => ({ tipo: 'SPOOLER', nome: 'Printer-BALCAO' }),
      resolverDestino,
    )

    const comanda = imprimir({ pedidoId: 'ped-1' }, TIPO_DOCUMENTO_IMPRESSAO.COMANDA)
    const conta = imprimir({ pedidoId: 'ped-1' }, TIPO_DOCUMENTO_IMPRESSAO.CONTA)

    expect(enviar).toHaveBeenCalledTimes(3)
    expect(resolverDestino).toHaveBeenCalledWith(SETOR_IMPRESSAO.JAPONESA)
    expect(resolverDestino).toHaveBeenCalledWith(SETOR_IMPRESSAO.PIZZA)
    expect(comanda.impresso).toBe(true)
    expect(conta.impresso).toBe(true)
    expect(comanda.texto).toContain('JAPONESA')
    expect(comanda.texto).toContain('PIZZA')
  })
})

describe('resolver destino impressora', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('nao envia para impressora padrao quando setor nao foi configurado', async () => {
    const banco = await prepararBancoTeste()
    const repositorio = criarConfigImpressoraRepository(obterConexaoBancoLocal())

    repositorio.salvarTodas([
      {
        setor: SETOR_IMPRESSAO.BALCAO,
        nomeImpressora: 'MP-4200 TH',
        portaCom: 'COM11',
      },
    ])

    const env = { ...process.env, NODE_ENV: 'production', PDV_IMPRESSORA_MOCK: '0' }

    expect(resolverDestinoImpressoraPorSetor(SETOR_IMPRESSAO.PIZZA, repositorio, env)).toEqual({
      tipo: 'NAO_CONFIGURADO',
    })
    expect(resolverDestinoImpressoraPorSetor(SETOR_IMPRESSAO.JAPONESA, repositorio, env)).toEqual({
      tipo: 'NAO_CONFIGURADO',
    })

    banco.encerrar()
  })

  it('usa COM quando a impressora esta em porta virtual Bematech_USB', async () => {
    const banco = await prepararBancoTeste()
    const repositorio = criarConfigImpressoraRepository(obterConexaoBancoLocal())

    repositorio.salvarTodas([
      {
        setor: SETOR_IMPRESSAO.BALCAO,
        nomeImpressora: 'MP-4200 TH',
        portaCom: 'COM11',
      },
    ])

    vi.spyOn(enviarImpressora, 'consultarPortNameImpressoraWindows').mockReturnValue(
      'Bematech_USB',
    )
    vi.spyOn(enviarImpressora, 'detectarPortaComAtual').mockReturnValue(null)
    vi.spyOn(enviarImpressora, 'listarPortasComWindows').mockReturnValue(['COM10'])

    const destino = resolverDestinoImpressoraPorSetor(
      SETOR_IMPRESSAO.BALCAO,
      repositorio,
      {
        ...process.env,
        NODE_ENV: 'production',
        PDV_IMPRESSORA_MOCK: '0',
        PDV_IMPRESSORA_PORTA: 'COM10',
      },
    )

    expect(destino).toEqual({
      tipo: 'COM',
      porta: 'COM10',
      nomeImpressora: 'MP-4200 TH',
    })

    banco.encerrar()
  })

  it('nao imprime comanda em setores sem configuracao', () => {
    const enviar = vi.fn()
    const resolverDestino = vi.fn((setor: typeof SETOR_IMPRESSAO[keyof typeof SETOR_IMPRESSAO]) => {
      if (setor === SETOR_IMPRESSAO.BALCAO) {
        return { tipo: 'SPOOLER' as const, nome: 'Caixa' }
      }
      return { tipo: 'NAO_CONFIGURADO' as const }
    })

    const imprimir = criarImprimirPedido(
      () => criarResumoBasico(),
      enviar,
      { buscarPorId: () => ({ numero: 3 }) } as never,
      { listarPorPedido: () => [] } as never,
      () => 'Pratos',
      (produtoId) =>
        produtoId === 'prod-sushi' ? SETOR_IMPRESSAO.JAPONESA : SETOR_IMPRESSAO.PIZZA,
      () => ({ tipo: 'SPOOLER', nome: 'Caixa' }),
      resolverDestino,
    )

    const comanda = imprimir({ pedidoId: 'ped-1' }, TIPO_DOCUMENTO_IMPRESSAO.COMANDA)

    expect(enviar).not.toHaveBeenCalled()
    expect(comanda.impresso).toBe(false)
    expect(comanda.aviso).toContain('sem impressora configurada')
    expect(comanda.texto).toContain('JAPONESA')
    expect(comanda.texto).toContain('PIZZA')

    const conta = imprimir({ pedidoId: 'ped-1' }, TIPO_DOCUMENTO_IMPRESSAO.CONTA)
    expect(enviar).toHaveBeenCalledTimes(1)
    expect(conta.impresso).toBe(true)
  })

  it('usa config_impressora por setor e balcao para conta', async () => {
    const banco = await prepararBancoTeste()
    const repositorio = criarConfigImpressoraRepository(obterConexaoBancoLocal())

    repositorio.salvarTodas([
      {
        setor: SETOR_IMPRESSAO.BALCAO,
        nomeImpressora: 'Caixa MP-4200',
        portaCom: null,
      },
      {
        setor: SETOR_IMPRESSAO.JAPONESA,
        nomeImpressora: 'Cozinha Japonesa',
        portaCom: 'COM11',
      },
    ])

    vi.spyOn(enviarImpressora, 'consultarPortNameImpressoraWindows').mockImplementation(
      (nome) => (nome === 'Cozinha Japonesa' ? 'COM11:' : null),
    )

    const destinoConta = resolverDestinoConta(repositorio, {
      ...process.env,
      NODE_ENV: 'production',
      PDV_IMPRESSORA_MOCK: '0',
    })
    const destinoJaponesa = resolverDestinoImpressoraPorSetor(
      SETOR_IMPRESSAO.JAPONESA,
      repositorio,
      {
        ...process.env,
        NODE_ENV: 'production',
        PDV_IMPRESSORA_MOCK: '0',
      },
    )

    expect(destinoConta).toEqual({ tipo: 'SPOOLER', nome: 'Caixa MP-4200' })
    expect(destinoJaponesa).toEqual({
      tipo: 'COM',
      porta: 'COM11',
      nomeImpressora: 'Cozinha Japonesa',
    })

    banco.encerrar()
  })
})
