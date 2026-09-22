import { contextBridge, ipcRenderer } from 'electron'
import { CANAIS_IPC } from '@shared/types/canais-ipc'
import type { PdvApi } from '@shared/types/pdv-api'

const apiPdv: PdvApi = {
  sistema: {
    obterInformacoes: () =>
      ipcRenderer.invoke(CANAIS_IPC.SISTEMA_OBTER_INFORMACOES),
    obterEstadoAtualizacao: () =>
      ipcRenderer.invoke(CANAIS_IPC.SISTEMA_OBTER_ESTADO_ATUALIZACAO),
    verificarAtualizacao: () =>
      ipcRenderer.invoke(CANAIS_IPC.SISTEMA_VERIFICAR_ATUALIZACAO),
    instalarAtualizacao: () =>
      ipcRenderer.invoke(CANAIS_IPC.SISTEMA_INSTALAR_ATUALIZACAO),
    onAtualizacaoEvento: (callback) => {
      const listener = (_evento: Electron.IpcRendererEvent, estado: unknown) => {
        callback(estado as import('@shared/types/atualizacao').EstadoAtualizacao)
      }
      ipcRenderer.on(CANAIS_IPC.SISTEMA_ATUALIZACAO_EVENTO, listener)
      return () => {
        ipcRenderer.removeListener(CANAIS_IPC.SISTEMA_ATUALIZACAO_EVENTO, listener)
      }
    },
  },
  caixa: {
    abrirSessaoCaixa: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.CAIXA_ABRIR_SESSAO, entrada),
    obterSessaoCaixaAberta: () =>
      ipcRenderer.invoke(CANAIS_IPC.CAIXA_OBTER_SESSAO_ABERTA),
    registrarMovimentoCaixa: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.CAIXA_REGISTRAR_MOVIMENTO, entrada),
    listarMovimentosCaixa: () =>
      ipcRenderer.invoke(CANAIS_IPC.CAIXA_LISTAR_MOVIMENTOS),
    obterResumoCaixaAtual: () =>
      ipcRenderer.invoke(CANAIS_IPC.CAIXA_OBTER_RESUMO_ATUAL),
    fecharSessaoCaixa: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.CAIXA_FECHAR_SESSAO, entrada),
    obterUltimaSessaoCaixa: () =>
      ipcRenderer.invoke(CANAIS_IPC.CAIXA_OBTER_ULTIMA_SESSAO),
  },
  produtos: {
    criarCategoria: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PRODUTOS_CRIAR_CATEGORIA, entrada),
    listarCategorias: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PRODUTOS_LISTAR_CATEGORIAS, entrada),
    atualizarCategoria: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PRODUTOS_ATUALIZAR_CATEGORIA, entrada),
    inativarCategoria: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PRODUTOS_INATIVAR_CATEGORIA, entrada),
    reativarCategoria: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PRODUTOS_REATIVAR_CATEGORIA, entrada),
    excluirCategoria: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PRODUTOS_EXCLUIR_CATEGORIA, entrada),
    criarProduto: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PRODUTOS_CRIAR_PRODUTO, entrada),
    listarProdutos: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PRODUTOS_LISTAR_PRODUTOS, entrada),
    buscarProdutos: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PRODUTOS_BUSCAR_PRODUTOS, entrada),
    atualizarProduto: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PRODUTOS_ATUALIZAR_PRODUTO, entrada),
    inativarProduto: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PRODUTOS_INATIVAR_PRODUTO, entrada),
    reativarProduto: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PRODUTOS_REATIVAR_PRODUTO, entrada),
    excluirProduto: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PRODUTOS_EXCLUIR_PRODUTO, entrada),
    obterProdutoPorId: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PRODUTOS_OBTER_PRODUTO_POR_ID, entrada),
  },
  catalogo: {
    buscarCategorias: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.CATALOGO_BUSCAR_CATEGORIAS, entrada),
  },
  mesas: {
    criarMesasPorIntervalo: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.MESAS_CRIAR_INTERVALO, entrada),
    listarMesas: () => ipcRenderer.invoke(CANAIS_IPC.MESAS_LISTAR),
    atualizarMesa: (entrada) => ipcRenderer.invoke(CANAIS_IPC.MESAS_ATUALIZAR, entrada),
    inativarMesa: (entrada) => ipcRenderer.invoke(CANAIS_IPC.MESAS_INATIVAR, entrada),
    transferirPedido: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.MESAS_TRANSFERIR_PEDIDO, entrada),
    agruparPedido: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.MESAS_AGRUPAR_PEDIDO, entrada),
    encerrarAgrupamento: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.MESAS_ENCERRAR_AGRUPAMENTO, entrada),
    obterAgrupamentoPedido: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.MESAS_OBTER_AGRUPAMENTO_PEDIDO, entrada),
    listarHistoricoMesa: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.MESAS_LISTAR_HISTORICO_MESA, entrada),
  },
  pedidos: {
    criarPedidoMesa: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PEDIDOS_CRIAR_PEDIDO_MESA, entrada),
    criarPedidoBalcao: () => ipcRenderer.invoke(CANAIS_IPC.PEDIDOS_CRIAR_PEDIDO_BALCAO),
    obterPedidoAbertoPorMesa: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PEDIDOS_OBTER_PEDIDO_ABERTO_POR_MESA, entrada),
    listarPedidosAbertos: () =>
      ipcRenderer.invoke(CANAIS_IPC.PEDIDOS_LISTAR_PEDIDOS_ABERTOS),
    adicionarItemPedido: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PEDIDOS_ADICIONAR_ITEM, entrada),
    alterarQuantidadeItemPedido: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PEDIDOS_ALTERAR_QUANTIDADE_ITEM, entrada),
    cancelarItemPedido: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PEDIDOS_REMOVER_ITEM, entrada),
    removerItemPedido: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PEDIDOS_REMOVER_ITEM, entrada),
    aplicarDescontoPedido: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PEDIDOS_APLICAR_DESCONTO, entrada),
    obterResumoPedido: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PEDIDOS_OBTER_RESUMO, entrada),
    cancelarPedido: (entrada) => ipcRenderer.invoke(CANAIS_IPC.PEDIDOS_CANCELAR, entrada),
    listarHistoricoPedidos: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PEDIDOS_LISTAR_HISTORICO, entrada ?? {}),
    listarHistoricoMovimentacaoMesa: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PEDIDOS_LISTAR_HISTORICO_MOVIMENTACAO, entrada),
    adicionarPizza: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PEDIDOS_ADICIONAR_PIZZA, entrada),
    obterPizzaItem: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PEDIDOS_OBTER_PIZZA_ITEM, entrada),
    atualizarSolicitacaoFiscal: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PEDIDOS_ATUALIZAR_SOLICITACAO_FISCAL, entrada),
  },
  pizzas: {
    listarCategorias: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PIZZAS_LISTAR_CATEGORIAS, entrada),
    criarCategoria: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PIZZAS_CRIAR_CATEGORIA, entrada),
    atualizarCategoria: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PIZZAS_ATUALIZAR_CATEGORIA, entrada),
    listarTamanhos: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PIZZAS_LISTAR_TAMANHOS, entrada),
    criarTamanho: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PIZZAS_CRIAR_TAMANHO, entrada),
    atualizarTamanho: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PIZZAS_ATUALIZAR_TAMANHO, entrada),
    listarSabores: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PIZZAS_LISTAR_SABORES, entrada),
    listarSaboresComCategorias: () =>
      ipcRenderer.invoke(CANAIS_IPC.PIZZAS_LISTAR_SABORES_COM_CATEGORIAS),
    criarSabor: (entrada) => ipcRenderer.invoke(CANAIS_IPC.PIZZAS_CRIAR_SABOR, entrada),
    atualizarSabor: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PIZZAS_ATUALIZAR_SABOR, entrada),
    vincularSaborCategoria: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PIZZAS_VINCULAR_SABOR_CATEGORIA, entrada),
    definirPreco: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PIZZAS_DEFINIR_PRECO, entrada),
    listarPrecosSabor: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PIZZAS_LISTAR_PRECOS_SABOR, entrada),
    listarCategoriasDoSabor: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PIZZAS_LISTAR_CATEGORIAS_SABOR, entrada),
    montarPreview: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PIZZAS_MONTAR_PREVIEW, entrada),
  },
  pagamentos: {
    registrarPagamentoPedido: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PAGAMENTOS_REGISTRAR_PEDIDO, entrada),
    listarPagamentosPedido: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PAGAMENTOS_LISTAR_PEDIDO, entrada),
    obterResumoPagamentoPedido: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PAGAMENTOS_OBTER_RESUMO_PEDIDO, entrada),
  },
  delivery: {
    criarPedidoDelivery: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.DELIVERY_CRIAR_PEDIDO, entrada),
    obterEntrega: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.DELIVERY_OBTER_ENTREGA, entrada),
    atualizarDadosEntrega: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.DELIVERY_ATUALIZAR_DADOS_ENTREGA, entrada),
    atualizarTaxaEntrega: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.DELIVERY_ATUALIZAR_TAXA_ENTREGA, entrada),
    atualizarStatusEntrega: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.DELIVERY_ATUALIZAR_STATUS_ENTREGA, entrada),
    listarDeliveryAbertos: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.DELIVERY_LISTAR_ABERTOS, entrada ?? {}),
    obterTaxaEntregaPadrao: () =>
      ipcRenderer.invoke(CANAIS_IPC.DELIVERY_OBTER_TAXA_PADRAO),
    definirTaxaEntregaPadrao: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.DELIVERY_DEFINIR_TAXA_PADRAO, entrada),
  },
  divisaoConta: {
    criar: (entrada) => ipcRenderer.invoke(CANAIS_IPC.DIVISAO_CONTA_CRIAR, entrada),
    obterResumo: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.DIVISAO_CONTA_OBTER_RESUMO, entrada),
    registrarPagamentoParte: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.DIVISAO_CONTA_REGISTRAR_PAGAMENTO_PARTE, entrada),
    cancelar: (entrada) => ipcRenderer.invoke(CANAIS_IPC.DIVISAO_CONTA_CANCELAR, entrada),
    listarHistorico: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.DIVISAO_CONTA_LISTAR_HISTORICO, entrada),
  },
  clientes: {
    criar: (entrada) => ipcRenderer.invoke(CANAIS_IPC.CLIENTES_CRIAR, entrada),
    listar: (entrada) => ipcRenderer.invoke(CANAIS_IPC.CLIENTES_LISTAR, entrada ?? {}),
    obter: (entrada) => ipcRenderer.invoke(CANAIS_IPC.CLIENTES_OBTER, entrada),
    atualizar: (entrada) => ipcRenderer.invoke(CANAIS_IPC.CLIENTES_ATUALIZAR, entrada),
    inativar: (entrada) => ipcRenderer.invoke(CANAIS_IPC.CLIENTES_INATIVAR, entrada),
    reativar: (entrada) => ipcRenderer.invoke(CANAIS_IPC.CLIENTES_REATIVAR, entrada),
    vincularPedido: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.CLIENTES_VINCULAR_PEDIDO, entrada),
  },
  talao: {
    obterConta: (entrada) => ipcRenderer.invoke(CANAIS_IPC.TALAO_OBTER_CONTA, entrada),
    listarContas: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.TALAO_LISTAR_CONTAS, entrada ?? {}),
    registrarBaixa: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.TALAO_REGISTRAR_BAIXA, entrada),
  },
  impressao: {
    imprimirAmostra: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.IMPRESSAO_IMPRIMIR_AMOSTRA, entrada),
    imprimirConta: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.IMPRESSAO_IMPRIMIR_CONTA, entrada),
    imprimirComanda: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.IMPRESSAO_IMPRIMIR_COMANDA, entrada),
  },
  sync: {
    obterEstado: () => ipcRenderer.invoke(CANAIS_IPC.SYNC_OBTER_ESTADO),
    onCatalogoAtualizado: (callback) => {
      const listener = () => {
        callback()
      }
      ipcRenderer.on(CANAIS_IPC.SYNC_CATALOGO_ATUALIZADO, listener)
      return () => {
        ipcRenderer.removeListener(CANAIS_IPC.SYNC_CATALOGO_ATUALIZADO, listener)
      }
    },
  },
  config: {
    listarImpressoras: () => ipcRenderer.invoke(CANAIS_IPC.CONFIG_LISTAR_IMPRESSORAS),
    listarImpressorasSistema: () =>
      ipcRenderer.invoke(CANAIS_IPC.CONFIG_LISTAR_IMPRESSORAS_SISTEMA),
    recuperarImpressoras: () =>
      ipcRenderer.invoke(CANAIS_IPC.CONFIG_RECUPERAR_IMPRESSORAS),
    salvarImpressoras: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.CONFIG_SALVAR_IMPRESSORAS, entrada),
    atualizarSetorCategoria: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.CONFIG_ATUALIZAR_SETOR_CATEGORIA, entrada),
    obterOperador: () => ipcRenderer.invoke(CANAIS_IPC.CONFIG_OBTER_OPERADOR),
    listarOperadoresEntrada: () =>
      ipcRenderer.invoke(CANAIS_IPC.CONFIG_LISTAR_OPERADORES_ENTRADA),
    listarOperadores: () => ipcRenderer.invoke(CANAIS_IPC.CONFIG_LISTAR_OPERADORES),
    salvarOperador: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.CONFIG_SALVAR_OPERADOR, entrada),
    autenticarOperador: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.CONFIG_AUTENTICAR_OPERADOR, entrada),
    obterInfoSync: () => ipcRenderer.invoke(CANAIS_IPC.CONFIG_OBTER_INFO_SYNC),
  },
  fiscal: {
    obterDocumento: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.FISCAL_OBTER_DOCUMENTO, entrada),
    imprimirDanfe: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.FISCAL_IMPRIMIR_DANFE, entrada),
  },
}

contextBridge.exposeInMainWorld('pdv', apiPdv)
