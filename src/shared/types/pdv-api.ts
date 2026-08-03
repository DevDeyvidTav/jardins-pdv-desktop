import type { InformacoesSistema } from './informacoes-sistema'
import type {
  AtualizarCategoriaProdutoEntrada,
  CategoriaProduto,
  CriarCategoriaProdutoEntrada,
  ExcluirCategoriaProdutoEntrada,
  InativarCategoriaProdutoEntrada,
  ListarCategoriasProdutoEntrada,
  ReativarCategoriaProdutoEntrada,
} from './categoria-produto'
import type {
  MovimentoCaixa,
  RegistrarMovimentoCaixaEntrada,
  ResumoCaixaAtual,
} from './movimento-caixa'
import type {
  AbrirSessaoCaixaEntrada,
  FecharSessaoCaixaEntrada,
  SessaoCaixa,
} from './sessao-caixa'
import type {
  AtualizarProdutoEntrada,
  BuscarProdutosEntrada,
  CriarProdutoEntrada,
  ExcluirProdutoEntrada,
  InativarProdutoEntrada,
  ListarProdutosEntrada,
  ObterProdutoPorIdEntrada,
  Produto,
  ProdutoComCategoria,
  ReativarProdutoEntrada,
} from './produto'
import type {
  AgruparMesasPedidoEntrada,
  AgruparMesasPedidoResultado,
  AtualizarMesaEntrada,
  CriarMesasPorIntervaloEntrada,
  EncerrarAgrupamentoMesaEntrada,
  InativarMesaEntrada,
  ListarHistoricoMesaEntrada,
  ListarHistoricoPedidoMesaEntrada,
  Mesa,
  MesaAgrupamento,
  ObterAgrupamentoPedidoEntrada,
  PedidoMesaMovimentacao,
  ResumoMesaAgrupamento,
  TransferirPedidoMesaEntrada,
  TransferirPedidoMesaResultado,
} from './mesa'
import type {
  AdicionarItemPedidoEntrada,
  AlterarQuantidadeItemPedidoEntrada,
  AplicarDescontoPedidoEntrada,
  CancelarPedidoEntrada,
  CriarPedidoMesaEntrada,
  ItemHistoricoPedido,
  ListarHistoricoPedidosEntrada,
  ObterPedidoAbertoPorMesaEntrada,
  ObterResumoPedidoEntrada,
  Pedido,
  CancelarItemPedidoEntrada,
  RemoverItemPedidoEntrada,
  ResumoPedido,
  PedidoEntrega,
  CriarPedidoDeliveryEntrada,
  ObterEntregaPorPedidoEntrada,
  AtualizarDadosEntregaEntrada,
  AtualizarTaxaEntregaEntrada,
  AtualizarStatusEntregaEntrada,
  ListarPedidosDeliveryAbertosEntrada,
  ItemDeliveryAberto,
  ObterTaxaEntregaPadraoResultado,
  DefinirTaxaEntregaPadraoEntrada,
} from './pedido'
import type {
  ListarPagamentosPedidoEntrada,
  PagamentoPedido,
  RegistrarPagamentoPedidoEntrada,
  ResumoPagamentoPedido,
} from './pagamento-pedido'

export interface PdvApi {
  sistema: {
    obterInformacoes: () => Promise<InformacoesSistema>
  }
  caixa: {
    abrirSessaoCaixa: (entrada: AbrirSessaoCaixaEntrada) => Promise<SessaoCaixa>
    obterSessaoCaixaAberta: () => Promise<SessaoCaixa | null>
    registrarMovimentoCaixa: (
      entrada: RegistrarMovimentoCaixaEntrada,
    ) => Promise<MovimentoCaixa>
    listarMovimentosCaixa: () => Promise<MovimentoCaixa[]>
    obterResumoCaixaAtual: () => Promise<ResumoCaixaAtual | null>
    fecharSessaoCaixa: (entrada: FecharSessaoCaixaEntrada) => Promise<SessaoCaixa>
    obterUltimaSessaoCaixa: () => Promise<SessaoCaixa | null>
  }
  produtos: {
    criarCategoria: (entrada: CriarCategoriaProdutoEntrada) => Promise<CategoriaProduto>
    listarCategorias: (
      entrada?: ListarCategoriasProdutoEntrada,
    ) => Promise<CategoriaProduto[]>
    atualizarCategoria: (
      entrada: AtualizarCategoriaProdutoEntrada,
    ) => Promise<CategoriaProduto>
    inativarCategoria: (
      entrada: InativarCategoriaProdutoEntrada,
    ) => Promise<CategoriaProduto>
    reativarCategoria: (
      entrada: ReativarCategoriaProdutoEntrada,
    ) => Promise<CategoriaProduto>
    excluirCategoria: (entrada: ExcluirCategoriaProdutoEntrada) => Promise<void>
    criarProduto: (entrada: CriarProdutoEntrada) => Promise<Produto>
    listarProdutos: (entrada?: ListarProdutosEntrada) => Promise<ProdutoComCategoria[]>
    buscarProdutos: (entrada: BuscarProdutosEntrada) => Promise<ProdutoComCategoria[]>
    atualizarProduto: (entrada: AtualizarProdutoEntrada) => Promise<Produto>
    inativarProduto: (entrada: InativarProdutoEntrada) => Promise<Produto>
    reativarProduto: (entrada: ReativarProdutoEntrada) => Promise<Produto>
    excluirProduto: (entrada: ExcluirProdutoEntrada) => Promise<void>
    obterProdutoPorId: (entrada: ObterProdutoPorIdEntrada) => Promise<Produto>
  }
  mesas: {
    criarMesasPorIntervalo: (
      entrada: CriarMesasPorIntervaloEntrada,
    ) => Promise<Mesa[]>
    listarMesas: () => Promise<Mesa[]>
    atualizarMesa: (entrada: AtualizarMesaEntrada) => Promise<Mesa>
    inativarMesa: (entrada: InativarMesaEntrada) => Promise<Mesa>
    transferirPedido: (
      entrada: TransferirPedidoMesaEntrada,
    ) => Promise<TransferirPedidoMesaResultado>
    agruparPedido: (
      entrada: AgruparMesasPedidoEntrada,
    ) => Promise<AgruparMesasPedidoResultado>
    encerrarAgrupamento: (
      entrada: EncerrarAgrupamentoMesaEntrada,
    ) => Promise<MesaAgrupamento>
    obterAgrupamentoPedido: (
      entrada: ObterAgrupamentoPedidoEntrada,
    ) => Promise<ResumoMesaAgrupamento | null>
    listarHistoricoMesa: (
      entrada: ListarHistoricoMesaEntrada,
    ) => Promise<PedidoMesaMovimentacao[]>
  }
  pedidos: {
    criarPedidoMesa: (entrada: CriarPedidoMesaEntrada) => Promise<Pedido>
    criarPedidoBalcao: () => Promise<Pedido>
    obterPedidoAbertoPorMesa: (
      entrada: ObterPedidoAbertoPorMesaEntrada,
    ) => Promise<ResumoPedido | null>
    listarPedidosAbertos: () => Promise<Pedido[]>
    adicionarItemPedido: (entrada: AdicionarItemPedidoEntrada) => Promise<ResumoPedido>
    alterarQuantidadeItemPedido: (
      entrada: AlterarQuantidadeItemPedidoEntrada,
    ) => Promise<ResumoPedido>
    cancelarItemPedido: (entrada: CancelarItemPedidoEntrada) => Promise<ResumoPedido>
    /** @deprecated Preferir cancelarItemPedido */
    removerItemPedido: (entrada: RemoverItemPedidoEntrada) => Promise<ResumoPedido>
    aplicarDescontoPedido: (
      entrada: AplicarDescontoPedidoEntrada,
    ) => Promise<ResumoPedido>
    obterResumoPedido: (entrada: ObterResumoPedidoEntrada) => Promise<ResumoPedido>
    cancelarPedido: (entrada: CancelarPedidoEntrada) => Promise<Pedido>
    listarHistoricoPedidos: (
      entrada?: ListarHistoricoPedidosEntrada,
    ) => Promise<ItemHistoricoPedido[]>
    listarHistoricoMovimentacaoMesa: (
      entrada: ListarHistoricoPedidoMesaEntrada,
    ) => Promise<PedidoMesaMovimentacao[]>
  }
  pagamentos: {
    registrarPagamentoPedido: (
      entrada: RegistrarPagamentoPedidoEntrada,
    ) => Promise<ResumoPagamentoPedido>
    listarPagamentosPedido: (
      entrada: ListarPagamentosPedidoEntrada,
    ) => Promise<PagamentoPedido[]>
    obterResumoPagamentoPedido: (
      entrada: ListarPagamentosPedidoEntrada,
    ) => Promise<ResumoPagamentoPedido>
  }
  delivery: {
    criarPedidoDelivery: (entrada: CriarPedidoDeliveryEntrada) => Promise<ResumoPedido>
    obterEntrega: (entrada: ObterEntregaPorPedidoEntrada) => Promise<PedidoEntrega>
    atualizarDadosEntrega: (entrada: AtualizarDadosEntregaEntrada) => Promise<PedidoEntrega>
    atualizarTaxaEntrega: (entrada: AtualizarTaxaEntregaEntrada) => Promise<ResumoPedido>
    atualizarStatusEntrega: (entrada: AtualizarStatusEntregaEntrada) => Promise<PedidoEntrega>
    listarDeliveryAbertos: (entrada?: ListarPedidosDeliveryAbertosEntrada) => Promise<ItemDeliveryAberto[]>
    obterTaxaEntregaPadrao: () => Promise<ObterTaxaEntregaPadraoResultado>
    definirTaxaEntregaPadrao: (
      entrada: DefinirTaxaEntregaPadraoEntrada,
    ) => Promise<ObterTaxaEntregaPadraoResultado>
  }
}

declare global {
  interface Window {
    pdv: PdvApi
  }
}

export {}
