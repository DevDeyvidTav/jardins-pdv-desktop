import { describe, expect, it } from 'vitest'
import { CANAIS_IPC } from '../../src/shared/types/canais-ipc'
import type { PdvApi } from '../../src/shared/types/pdv-api'

const PEDIDO_BASE = {
  id: 'ped-1',
  referencia: 1,
  sessaoCaixaId: '1',
  mesaId: 'mesa-1' as string | null,
  clienteId: null as string | null,
  mesaAgrupamentoId: null as string | null,
  tipo: 'MESA' as const,
  status: 'ABERTO' as const,
  subtotalCentavos: 0,
  descontoCentavos: 0,
  descontoItensCentavos: 0,
  descontoPedidoCentavos: 0,
  taxaEntregaCentavos: 0,
  totalCentavos: 0,
  valorPagoCentavos: 0,
  valorCortesiaCentavos: 0,
  valorRestanteCentavos: 0,
  criadoEm: new Date().toISOString(),
  atualizadoEm: new Date().toISOString(),
  finalizadoEm: null,
  canceladoEm: null,
  motivoCancelamento: null,
  fiscalSolicitado: false,
  fiscalCpfDestinatario: null,
}

const RESUMO_BASE = { pedido: PEDIDO_BASE, itens: [], entrega: null, divisao: null }

const PRODUTO_BASE = {
  id: 'prod-1',
  categoriaId: 'cat-1',
  nome: 'Coca-Cola lata',
  descricao: null as string | null,
  precoCentavos: 600,
  fiscalNcm: null as string | null,
  fiscalCest: null as string | null,
  fiscalCfop: '5102',
  fiscalIcmsOrigem: 0,
  fiscalIcmsCsosn: '102',
  fiscalPisCst: '07',
  fiscalCofinsCst: '07',
  fiscalAliquotaNacional: null as number | null,
  ativo: true,
  criadoEm: new Date().toISOString(),
  atualizadoEm: new Date().toISOString(),
}

describe('contrato da API exposta pelo preload', () => {
  it('define canais IPC do sistema, caixa e produtos', () => {
    expect(CANAIS_IPC.CAIXA_FECHAR_SESSAO).toBe('caixa:fechar-sessao')
    expect(CANAIS_IPC.PRODUTOS_CRIAR_PRODUTO).toBe('produtos:criar-produto')
    expect(CANAIS_IPC.PRODUTOS_BUSCAR_PRODUTOS).toBe('produtos:buscar-produtos')
    expect(CANAIS_IPC.DELIVERY_CRIAR_PEDIDO).toBe('delivery:criar-pedido')
    expect(CANAIS_IPC.DIVISAO_CONTA_CRIAR).toBe('divisao-conta:criar')
    expect(CANAIS_IPC.DIVISAO_CONTA_OBTER_RESUMO).toBe('divisao-conta:obter-resumo')
    expect(CANAIS_IPC.DIVISAO_CONTA_REGISTRAR_PAGAMENTO_PARTE).toBe(
      'divisao-conta:registrar-pagamento-parte',
    )
    expect(CANAIS_IPC.DIVISAO_CONTA_CANCELAR).toBe('divisao-conta:cancelar')
    expect(CANAIS_IPC.DIVISAO_CONTA_LISTAR_HISTORICO).toBe('divisao-conta:listar-historico')
    expect(CANAIS_IPC.PIZZAS_CRIAR_CATEGORIA).toBe('pizzas:criar-categoria')
    expect(CANAIS_IPC.PIZZAS_LISTAR_PRECOS_SABOR).toBe('pizzas:listar-precos-sabor')
    expect(CANAIS_IPC.PIZZAS_LISTAR_CATEGORIAS_SABOR).toBe(
      'pizzas:listar-categorias-sabor',
    )
    expect(CANAIS_IPC.PIZZAS_MONTAR_PREVIEW).toBe('pizzas:montar-preview')
    expect(CANAIS_IPC.PEDIDOS_ADICIONAR_PIZZA).toBe('pedidos:adicionar-pizza')
    expect(CANAIS_IPC.PEDIDOS_OBTER_PIZZA_ITEM).toBe('pedidos:obter-pizza-item')
    expect(CANAIS_IPC.CLIENTES_CRIAR).toBe('clientes:criar')
    expect(CANAIS_IPC.TALAO_REGISTRAR_BAIXA).toBe('talao:registrar-baixa')
    expect(CANAIS_IPC.IMPRESSAO_IMPRIMIR_AMOSTRA).toBe('impressao:imprimir-amostra')
    expect(CANAIS_IPC.IMPRESSAO_IMPRIMIR_CONTA).toBe('impressao:imprimir-conta')
    expect(CANAIS_IPC.IMPRESSAO_IMPRIMIR_COMANDA).toBe('impressao:imprimir-comanda')
    expect(CANAIS_IPC.SYNC_OBTER_ESTADO).toBe('sync:obter-estado')
    expect(CANAIS_IPC.CONFIG_LISTAR_IMPRESSORAS).toBe('config:listar-impressoras')
    expect(CANAIS_IPC.CONFIG_SALVAR_IMPRESSORAS).toBe('config:salvar-impressoras')
    expect(CANAIS_IPC.CONFIG_OBTER_OPERADOR).toBe('config:obter-operador')
    expect(CANAIS_IPC.PEDIDOS_ATUALIZAR_SOLICITACAO_FISCAL).toBe(
      'pedidos:atualizar-solicitacao-fiscal',
    )
    expect(CANAIS_IPC.FISCAL_OBTER_DOCUMENTO).toBe('fiscal:obter-documento')
    expect(CANAIS_IPC.FISCAL_IMPRIMIR_DANFE).toBe('fiscal:imprimir-danfe')
  })

  it('mantem formato esperado da API window.pdv', () => {
    const api: PdvApi = {
      sistema: {
        obterInformacoes: async () => ({
          nomeAplicacao: 'PDV Jardins',
          versao: '0.1.0',
          bancoLocalInicializado: true,
          electronAtivo: true,
        }),
        obterEstadoAtualizacao: async () => ({
          ativo: false,
          verificando: false,
          baixando: false,
          baixada: false,
          versaoAtual: '0.1.0',
          versaoDisponivel: null,
          progressoPercentual: null,
          mensagem: 'Modo teste',
          erro: null,
        }),
        verificarAtualizacao: async () => ({
          ativo: false,
          verificando: false,
          baixando: false,
          baixada: false,
          versaoAtual: '0.1.0',
          versaoDisponivel: null,
          progressoPercentual: null,
          mensagem: 'Modo teste',
          erro: null,
        }),
        instalarAtualizacao: async () => ({
          ativo: false,
          verificando: false,
          baixando: false,
          baixada: false,
          versaoAtual: '0.1.0',
          versaoDisponivel: null,
          progressoPercentual: null,
          mensagem: 'Modo teste',
          erro: null,
        }),
        onAtualizacaoEvento: () => () => {},
      },
      caixa: {
        abrirSessaoCaixa: async () => ({
          id: '1',
          operadorId: 'local',
          operadorNome: 'Operador Local',
          saldoInicialCentavos: 30000,
          status: 'ABERTO',
          abertoEm: new Date().toISOString(),
          fechadoEm: null,
          saldoFinalInformadoCentavos: null,
          saldoFinalEsperadoCentavos: null,
          diferencaCentavos: null,
          observacaoFechamento: null,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        obterSessaoCaixaAberta: async () => null,
        registrarMovimentoCaixa: async () => ({
          id: 'm1',
          sessaoCaixaId: '1',
          tipo: 'SUPRIMENTO',
          valorCentavos: 5000,
          descricao: null,
          origem: 'MANUAL',
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        listarMovimentosCaixa: async () => [],
        obterResumoCaixaAtual: async () => null,
        fecharSessaoCaixa: async () => ({
          id: '1',
          operadorId: 'local',
          operadorNome: 'Operador Local',
          saldoInicialCentavos: 30000,
          status: 'FECHADO',
          abertoEm: new Date().toISOString(),
          fechadoEm: new Date().toISOString(),
          saldoFinalInformadoCentavos: 30000,
          saldoFinalEsperadoCentavos: 30000,
          diferencaCentavos: 0,
          observacaoFechamento: null,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        obterUltimaSessaoCaixa: async () => null,
      },
      produtos: {
        criarCategoria: async () => ({
          id: 'cat-1',
          nome: 'Bebidas',
          descricao: null,
          ativo: true,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        listarCategorias: async () => [],
        atualizarCategoria: async () => ({
          id: 'cat-1',
          nome: 'Bebidas',
          descricao: null,
          ativo: true,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        inativarCategoria: async () => ({
          id: 'cat-1',
          nome: 'Bebidas',
          descricao: null,
          ativo: false,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        reativarCategoria: async () => ({
          id: 'cat-1',
          nome: 'Bebidas',
          descricao: null,
          ativo: true,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        excluirCategoria: async () => ({ modo: 'EXCLUIDO' as const }),
        criarProduto: async () => ({ ...PRODUTO_BASE }),
        listarProdutos: async () => [],
        buscarProdutos: async () => [],
        atualizarProduto: async () => ({ ...PRODUTO_BASE }),
        inativarProduto: async () => ({ ...PRODUTO_BASE, ativo: false }),
        reativarProduto: async () => ({ ...PRODUTO_BASE }),
        excluirProduto: async () => ({ modo: 'EXCLUIDO' as const }),
        obterProdutoPorId: async () => ({ ...PRODUTO_BASE }),
      },
      mesas: {
        criarMesasPorIntervalo: async () => [
          {
            id: 'mesa-1',
            numero: 1,
            nome: '1',
            status: 'LIVRE',
            ativo: true,
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString(),
          },
        ],
        listarMesas: async () => [],
        atualizarMesa: async () => ({
          id: 'mesa-1',
          numero: 1,
          nome: 'Salao',
          status: 'LIVRE',
          ativo: true,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        inativarMesa: async () => ({
          id: 'mesa-1',
          numero: 1,
          nome: 'Salao',
          status: 'INATIVA',
          ativo: false,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        transferirPedido: async () => ({
          pedidoId: 'ped-1',
          mesaOrigem: { id: 'mesa-1', numero: 1 },
          mesaDestino: { id: 'mesa-2', numero: 2 },
        }),
        agruparPedido: async () => ({
          pedidoId: 'ped-1',
          agrupamentoId: 'agr-1',
          mesaPrincipal: { id: 'mesa-1', numero: 1 },
          mesas: [
            { id: 'mesa-1', numero: 1, ehPrincipal: true },
            { id: 'mesa-2', numero: 2, ehPrincipal: false },
          ],
        }),
        encerrarAgrupamento: async () => ({
          id: 'agr-1',
          pedidoId: 'ped-1',
          mesaPrincipalId: 'mesa-1',
          status: 'ENCERRADO' as const,
          criadoEm: new Date().toISOString(),
          encerradoEm: new Date().toISOString(),
          motivoEncerramento: 'ENCERRAMENTO_MANUAL',
        }),
        obterAgrupamentoPedido: async () => null,
        listarHistoricoMesa: async () => [],
      },
      pedidos: {
        criarPedidoMesa: async () => PEDIDO_BASE,
        criarPedidoBalcao: async () => ({
          ...PEDIDO_BASE,
          id: 'ped-2',
          mesaId: null,
          tipo: 'BALCAO' as const,
        }),
        obterPedidoAbertoPorMesa: async () => null,
        listarPedidosAbertos: async () => [],
        adicionarItemPedido: async () => ({ ...RESUMO_BASE, pedido: { ...PEDIDO_BASE, subtotalCentavos: 600, totalCentavos: 600, valorRestanteCentavos: 600 } }),
        alterarQuantidadeItemPedido: async () => ({ ...RESUMO_BASE, pedido: { ...PEDIDO_BASE, subtotalCentavos: 1200, totalCentavos: 1200, valorRestanteCentavos: 1200 } }),
        cancelarItemPedido: async () => RESUMO_BASE,
        removerItemPedido: async () => RESUMO_BASE,
        obterResumoPedido: async () => RESUMO_BASE,
        aplicarDescontoPedido: async () => RESUMO_BASE,
        cancelarPedido: async () => ({
          ...PEDIDO_BASE,
          status: 'CANCELADO' as const,
          canceladoEm: new Date().toISOString(),
        }),
        listarHistoricoPedidos: async () => [],
        listarHistoricoMovimentacaoMesa: async () => [],
        adicionarPizza: async () => RESUMO_BASE,
        obterPizzaItem: async () => ({
          id: 'ppi-1',
          pedidoItemId: 'item-1',
          pizzaCategoriaId: 'pc-1',
          pizzaTamanhoId: 'pizza-tamanho-p',
          regraPrecificacaoSnapshot: 'MAIOR_SABOR' as const,
          valorCalculadoCentavos: 5000,
          observacao: null,
          categoriaNomeSnapshot: 'Tradicional',
          tamanhoNomeSnapshot: 'Pequena',
          sabores: [],
        }),
        atualizarSolicitacaoFiscal: async () => PEDIDO_BASE,
      },
      pizzas: {
        listarCategorias: async () => [],
        criarCategoria: async () => ({
          id: 'pc-1',
          nome: 'Tradicional',
          descricao: null,
          regraPrecificacao: 'MAIOR_SABOR' as const,
          ativa: true,
          ordem: 0,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        atualizarCategoria: async () => ({
          id: 'pc-1',
          nome: 'Tradicional',
          descricao: null,
          regraPrecificacao: 'MAIOR_SABOR' as const,
          ativa: true,
          ordem: 0,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        listarTamanhos: async () => [],
        criarTamanho: async () => ({
          id: 'pizza-tamanho-p',
          nome: 'Pequena',
          sigla: 'P',
          maximoSabores: 2,
          ativa: true,
          ordem: 1,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        atualizarTamanho: async () => ({
          id: 'pizza-tamanho-p',
          nome: 'Pequena',
          sigla: 'P',
          maximoSabores: 2,
          ativa: true,
          ordem: 1,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        listarSabores: async () => [],
        criarSabor: async () => ({
          id: 'ps-1',
          nome: 'Calabresa',
          descricao: null,
          ativa: true,
          ordem: 0,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        atualizarSabor: async () => ({
          id: 'ps-1',
          nome: 'Calabresa',
          descricao: null,
          ativa: true,
          ordem: 0,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        vincularSaborCategoria: async () => undefined,
        definirPreco: async () => ({
          id: 'psp-1',
          pizzaSaborId: 'ps-1',
          pizzaTamanhoId: 'pizza-tamanho-p',
          valorCentavos: 5000,
          ativo: true,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        listarPrecosSabor: async () => [
          {
            id: 'psp-1',
            pizzaSaborId: 'ps-1',
            pizzaTamanhoId: 'pizza-tamanho-p',
            valorCentavos: 5000,
            ativo: true,
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString(),
          },
        ],
        listarCategoriasDoSabor: async () => ['pc-1'],
        montarPreview: async () => ({
          categoria: {
            id: 'pc-1',
            nome: 'Tradicional',
            regraPrecificacao: 'MAIOR_SABOR' as const,
          },
          tamanho: {
            id: 'pizza-tamanho-p',
            nome: 'Pequena',
            sigla: 'P',
            maximoSabores: 2,
          },
          sabores: [{ id: 'ps-1', nome: 'Calabresa', valorCentavos: 5000 }],
          valorFinalCentavos: 5000,
        }),
      },
      pagamentos: {
        registrarPagamentoPedido: async () => ({
          pedidoId: 'ped-1',
          totalPedidoCentavos: 0,
          totalPagoCentavos: 0,
          valorRestanteCentavos: 0,
          pagamentos: [],
        }),
        listarPagamentosPedido: async () => [],
        obterResumoPagamentoPedido: async () => ({
          pedidoId: 'ped-1',
          totalPedidoCentavos: 0,
          totalPagoCentavos: 0,
          valorRestanteCentavos: 0,
          pagamentos: [],
        }),
      },
      delivery: {
        criarPedidoDelivery: async () => ({ ...RESUMO_BASE, pedido: { ...PEDIDO_BASE, tipo: 'DELIVERY' as const, mesaId: null, taxaEntregaCentavos: 700, totalCentavos: 700, valorRestanteCentavos: 700 } }),
        obterEntrega: async () => ({
          id: 'ent-1',
          pedidoId: 'ped-1',
          clienteNome: 'Cliente',
          telefone: '81999999999',
          endereco: null,
          observacao: null,
          status: 'AGUARDANDO_PREPARO' as const,
          saiuParaEntregaEm: null,
          entregueEm: null,
          canceladoEm: null,
          motivoCancelamento: null,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        atualizarDadosEntrega: async () => ({
          id: 'ent-1',
          pedidoId: 'ped-1',
          clienteNome: 'Cliente Novo',
          telefone: '81999999999',
          endereco: 'Rua A',
          observacao: 'Obs',
          status: 'AGUARDANDO_PREPARO' as const,
          saiuParaEntregaEm: null,
          entregueEm: null,
          canceladoEm: null,
          motivoCancelamento: null,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        atualizarTaxaEntrega: async () => RESUMO_BASE,
        atualizarStatusEntrega: async () => ({
          id: 'ent-1',
          pedidoId: 'ped-1',
          clienteNome: 'Cliente',
          telefone: '81999999999',
          endereco: null,
          observacao: null,
          status: 'EM_PREPARO' as const,
          saiuParaEntregaEm: null,
          entregueEm: null,
          canceladoEm: null,
          motivoCancelamento: null,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        listarDeliveryAbertos: async () => [],
        obterTaxaEntregaPadrao: async () => ({ taxaEntregaPadraoCentavos: 0 }),
        definirTaxaEntregaPadrao: async () => ({ taxaEntregaPadraoCentavos: 500 }),
      },
      divisaoConta: {
        criar: async () => ({
          divisao: {
            id: 'div-1',
            pedidoId: 'ped-1',
            status: 'ATIVA' as const,
            valorTotalCentavos: 0,
            criadoEm: new Date().toISOString(),
            canceladoEm: null,
          },
          partes: [],
          totais: {
            valorPedidoCentavos: 0,
            valorPagoCentavos: 0,
            valorRestanteCentavos: 0,
          },
        }),
        obterResumo: async () => null,
        registrarPagamentoParte: async () => ({
          divisao: {
            id: 'div-1',
            pedidoId: 'ped-1',
            status: 'ATIVA' as const,
            valorTotalCentavos: 0,
            criadoEm: new Date().toISOString(),
            canceladoEm: null,
          },
          partes: [],
          totais: {
            valorPedidoCentavos: 0,
            valorPagoCentavos: 0,
            valorRestanteCentavos: 0,
          },
        }),
        cancelar: async () => ({
          divisao: {
            id: 'div-1',
            pedidoId: 'ped-1',
            status: 'CANCELADA' as const,
            valorTotalCentavos: 0,
            criadoEm: new Date().toISOString(),
            canceladoEm: new Date().toISOString(),
          },
          partes: [],
          totais: {
            valorPedidoCentavos: 0,
            valorPagoCentavos: 0,
            valorRestanteCentavos: 0,
          },
        }),
        listarHistorico: async () => [],
      },
      clientes: {
        criar: async () => ({
          id: 'cli-1',
          nome: 'Maria',
          telefone: null,
          documento: null,
          endereco: null,
          liberaTalao: true,
          ativo: true,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        listar: async () => [],
        obter: async () => ({
          id: 'cli-1',
          nome: 'Maria',
          telefone: null,
          documento: null,
          endereco: null,
          liberaTalao: true,
          ativo: true,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        atualizar: async () => ({
          id: 'cli-1',
          nome: 'Maria',
          telefone: null,
          documento: null,
          endereco: null,
          liberaTalao: true,
          ativo: true,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        inativar: async () => ({
          id: 'cli-1',
          nome: 'Maria',
          telefone: null,
          documento: null,
          endereco: null,
          liberaTalao: true,
          ativo: false,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        reativar: async () => ({
          id: 'cli-1',
          nome: 'Maria',
          telefone: null,
          documento: null,
          endereco: null,
          liberaTalao: true,
          ativo: true,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        vincularPedido: async () => PEDIDO_BASE,
      },
      talao: {
        obterConta: async () => ({
          cliente: {
            id: 'cli-1',
            nome: 'Maria',
            telefone: null,
            documento: null,
            endereco: null,
            liberaTalao: true,
            ativo: true,
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString(),
          },
          competencia: '2026-08',
          totalLancadoCentavos: 0,
          totalBaixadoCentavos: 0,
          saldoCentavos: 0,
          lancamentos: [],
          baixas: [],
        }),
        listarContas: async () => [],
        registrarBaixa: async () => ({
          id: 'baixa-1',
          clienteId: 'cli-1',
          sessaoCaixaId: '1',
          formaPagamento: 'DINHEIRO' as const,
          valorCentavos: 100,
          valorRecebidoCentavos: 100,
          trocoCentavos: 0,
          competencia: '2026-08',
          observacao: null,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
      },
      impressao: {
        imprimirAmostra: async () => ({
          tipo: 'CONTA' as const,
          setor: null,
          linhas: ['CONTA'],
          texto: 'CONTA',
          impresso: true,
          aviso: null,
        }),
        imprimirConta: async () => ({
          tipo: 'CONTA' as const,
          setor: null,
          linhas: ['CONTA'],
          texto: 'CONTA',
          impresso: true,
          aviso: null,
        }),
        imprimirComanda: async () => ({
          tipo: 'COMANDA' as const,
          setor: 'COZINHA',
          linhas: ['COZINHA'],
          texto: 'COZINHA',
          impresso: true,
          aviso: null,
        }),
      },
      fiscal: {
        obterDocumento: async () => null,
        imprimirDanfe: async () => ({
          tipo: 'CONTA',
          setor: null,
          linhas: [],
          texto: '',
          impresso: true,
          aviso: null,
        }),
      },
      sync: {
        obterEstado: async () => ({
          pendente: 0,
          sincronizado: 0,
          apiConfigurada: false,
          ultimaTentativaEm: null,
          ultimoSucessoEm: null,
          ultimoErro: null,
        }),
      },
      config: {
        listarImpressoras: async () => [],
        listarImpressorasSistema: async () => ({
          impressoras: [],
          portasCom: [],
        }),
        recuperarImpressoras: async () => [],
        salvarImpressoras: async () => [],
        atualizarSetorCategoria: async () => ({
          id: 'cat-1',
          nome: 'Bebidas',
          descricao: null,
          setorImpressao: null,
          ativo: true,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        }),
        obterOperador: async () => null,
        listarOperadoresEntrada: async () => [
          {
            operadorId: 'op-1',
            operadorNome: 'Nathalia',
          },
        ],
        listarOperadores: async () => [
          {
            operadorId: 'op-1',
            operadorNome: 'Nathalia',
            perfil: 'ADMIN',
          },
        ],
        salvarOperador: async () => ({
          operadorId: 'op-1',
          operadorNome: 'Nathalia',
          perfil: 'ADMIN',
        }),
        autenticarOperador: async () => ({
          operadorId: 'op-1',
          operadorNome: 'Nathalia',
          perfil: 'ADMIN',
        }),
        obterInfoSync: async () => ({
          apiUrl: null,
          dispositivoId: null,
          apiConfigurada: false,
        }),
      },
    }

    expect(typeof api.caixa.fecharSessaoCaixa).toBe('function')
    expect(typeof api.produtos.criarProduto).toBe('function')
    expect(typeof api.mesas.listarMesas).toBe('function')
    expect(typeof api.mesas.transferirPedido).toBe('function')
    expect(typeof api.mesas.agruparPedido).toBe('function')
    expect(typeof api.mesas.encerrarAgrupamento).toBe('function')
    expect(typeof api.mesas.obterAgrupamentoPedido).toBe('function')
    expect(typeof api.mesas.listarHistoricoMesa).toBe('function')
    expect(typeof api.pedidos.criarPedidoMesa).toBe('function')
    expect(typeof api.pedidos.adicionarItemPedido).toBe('function')
    expect(typeof api.pedidos.listarHistoricoMovimentacaoMesa).toBe('function')
    expect(typeof api.pagamentos.registrarPagamentoPedido).toBe('function')
    expect(typeof api.delivery.criarPedidoDelivery).toBe('function')
    expect(typeof api.delivery.atualizarStatusEntrega).toBe('function')
    expect(typeof api.divisaoConta.criar).toBe('function')
    expect(typeof api.divisaoConta.obterResumo).toBe('function')
    expect(typeof api.divisaoConta.registrarPagamentoParte).toBe('function')
    expect(typeof api.divisaoConta.cancelar).toBe('function')
    expect(typeof api.divisaoConta.listarHistorico).toBe('function')
    expect(typeof api.pizzas.montarPreview).toBe('function')
    expect(typeof api.pizzas.listarPrecosSabor).toBe('function')
    expect(typeof api.pizzas.listarCategoriasDoSabor).toBe('function')
    expect(typeof api.pedidos.adicionarPizza).toBe('function')
    expect(typeof api.pedidos.obterPizzaItem).toBe('function')
    expect(typeof api.clientes.criar).toBe('function')
    expect(typeof api.talao.registrarBaixa).toBe('function')
    expect(typeof api.impressao.imprimirAmostra).toBe('function')
    expect(typeof api.impressao.imprimirConta).toBe('function')
    expect(typeof api.impressao.imprimirComanda).toBe('function')
    expect(typeof api.sync.obterEstado).toBe('function')
    expect(typeof api.config.listarImpressoras).toBe('function')
    expect(typeof api.config.listarImpressorasSistema).toBe('function')
    expect(typeof api.config.recuperarImpressoras).toBe('function')
    expect(typeof api.config.listarOperadoresEntrada).toBe('function')
    expect(typeof api.config.listarOperadores).toBe('function')
    expect(typeof api.config.salvarOperador).toBe('function')
    expect(typeof api.pedidos.atualizarSolicitacaoFiscal).toBe('function')
    expect(typeof api.fiscal.obterDocumento).toBe('function')
    expect(typeof api.fiscal.imprimirDanfe).toBe('function')
  })
})
