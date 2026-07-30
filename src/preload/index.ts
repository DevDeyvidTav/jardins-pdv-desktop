import { contextBridge, ipcRenderer } from 'electron'
import { CANAIS_IPC } from '@shared/types/canais-ipc'
import type { PdvApi } from '@shared/types/pdv-api'

const apiPdv: PdvApi = {
  sistema: {
    obterInformacoes: () =>
      ipcRenderer.invoke(CANAIS_IPC.SISTEMA_OBTER_INFORMACOES),
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
    obterProdutoPorId: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PRODUTOS_OBTER_PRODUTO_POR_ID, entrada),
  },
  mesas: {
    criarMesasPorIntervalo: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.MESAS_CRIAR_INTERVALO, entrada),
    listarMesas: () => ipcRenderer.invoke(CANAIS_IPC.MESAS_LISTAR),
    atualizarMesa: (entrada) => ipcRenderer.invoke(CANAIS_IPC.MESAS_ATUALIZAR, entrada),
    inativarMesa: (entrada) => ipcRenderer.invoke(CANAIS_IPC.MESAS_INATIVAR, entrada),
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
    obterResumoPedido: (entrada) =>
      ipcRenderer.invoke(CANAIS_IPC.PEDIDOS_OBTER_RESUMO, entrada),
    cancelarPedido: (entrada) => ipcRenderer.invoke(CANAIS_IPC.PEDIDOS_CANCELAR, entrada),
  },
}

contextBridge.exposeInMainWorld('pdv', apiPdv)
