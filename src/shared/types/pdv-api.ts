import type {
  BuscarCategoriasCatalogoEntrada,
  CategoriaCatalogo,
} from './categoria-catalogo'
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
  ResultadoRemocaoCatalogo,
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
import type {
  CancelarDivisaoContaEntrada,
  CriarDivisaoContaEntrada,
  ListarHistoricoDivisaoContaEntrada,
  ObterResumoDivisaoContaEntrada,
  PedidoDivisaoMovimentacao,
  RegistrarPagamentoParteDivisaoEntrada,
  ResumoDivisaoConta,
} from './divisao-conta'
import type {
  AtualizarClienteEntrada,
  Cliente,
  CriarClienteEntrada,
  InativarClienteEntrada,
  ListarClientesEntrada,
  ObterClienteEntrada,
  ReativarClienteEntrada,
  VincularClientePedidoEntrada,
} from './cliente'
import type {
  ContaTalaoCliente,
  ListarContasTalaoEntrada,
  ObterContaTalaoEntrada,
  RegistrarBaixaTalaoEntrada,
  TalaoBaixa,
} from './talao'
import type {
  AtualizarSetorCategoriaEntrada,
  ConfigImpressora,
  ImpressorasSistemaResposta,
  SalvarConfigImpressorasEntrada,
} from './config-impressora'
import type {
  AutenticarOperadorEntrada,
  OperadorConfig,
  OperadorEntradaResumo,
  OperadorResumo,
  SalvarOperadorEntrada,
} from './operador'
import type { EstadoSincronizacao } from './sincronizacao'
import type {
  AtualizarSolicitacaoFiscalEntrada,
  DocumentoFiscalLocal,
  ImprimirDanfeNfceEntrada,
} from './documento-fiscal'
import type {
  ImprimirAmostraEntrada,
  ImprimirPedidoEntrada,
  ResultadoImpressao,
  ResultadoImpressaoAmostra,
} from './impressao'
import type { InformacoesSistema } from './informacoes-sistema'
import type { EstadoAtualizacao } from './atualizacao'
import type {
  AdicionarPizzaAoPedidoEntrada,
  AtualizarPizzaCategoriaEntrada,
  AtualizarPizzaSaborEntrada,
  AtualizarPizzaTamanhoEntrada,
  CriarPizzaCategoriaEntrada,
  CriarPizzaSaborEntrada,
  CriarPizzaTamanhoEntrada,
  DefinirPrecoSaborPorTamanhoEntrada,
  MontarPreviewPizzaEntrada,
  ObterPizzaPedidoItemEntrada,
  PizzaCategoria,
  PizzaPedidoItemResumo,
  PizzaSabor,
  PizzaSaborComCategoria,
  PizzaSaborPreco,
  PizzaTamanho,
  PreviewPizza,
  VincularSaborCategoriaEntrada,
} from './pizza'

export interface PdvApi {
  sistema: {
    obterInformacoes: () => Promise<InformacoesSistema>
    obterEstadoAtualizacao: () => Promise<EstadoAtualizacao>
    verificarAtualizacao: () => Promise<EstadoAtualizacao>
    instalarAtualizacao: () => Promise<EstadoAtualizacao>
    onAtualizacaoEvento: (
      callback: (estado: EstadoAtualizacao) => void,
    ) => () => void
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
    excluirCategoria: (
      entrada: ExcluirCategoriaProdutoEntrada,
    ) => Promise<ResultadoRemocaoCatalogo>
    criarProduto: (entrada: CriarProdutoEntrada) => Promise<Produto>
    listarProdutos: (entrada?: ListarProdutosEntrada) => Promise<ProdutoComCategoria[]>
    buscarProdutos: (entrada: BuscarProdutosEntrada) => Promise<ProdutoComCategoria[]>
    atualizarProduto: (entrada: AtualizarProdutoEntrada) => Promise<Produto>
    inativarProduto: (entrada: InativarProdutoEntrada) => Promise<Produto>
    reativarProduto: (entrada: ReativarProdutoEntrada) => Promise<Produto>
    excluirProduto: (entrada: ExcluirProdutoEntrada) => Promise<ResultadoRemocaoCatalogo>
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
    adicionarPizza: (entrada: AdicionarPizzaAoPedidoEntrada) => Promise<ResumoPedido>
    obterPizzaItem: (
      entrada: ObterPizzaPedidoItemEntrada,
    ) => Promise<PizzaPedidoItemResumo>
    atualizarSolicitacaoFiscal: (
      entrada: AtualizarSolicitacaoFiscalEntrada,
    ) => Promise<Pedido>
  }
  pizzas: {
    listarCategorias: (entrada?: { apenasAtivas?: boolean }) => Promise<PizzaCategoria[]>
    criarCategoria: (entrada: CriarPizzaCategoriaEntrada) => Promise<PizzaCategoria>
    atualizarCategoria: (
      entrada: AtualizarPizzaCategoriaEntrada,
    ) => Promise<PizzaCategoria>
    listarTamanhos: (entrada?: { apenasAtivas?: boolean }) => Promise<PizzaTamanho[]>
    criarTamanho: (entrada: CriarPizzaTamanhoEntrada) => Promise<PizzaTamanho>
    atualizarTamanho: (entrada: AtualizarPizzaTamanhoEntrada) => Promise<PizzaTamanho>
    listarSabores: (entrada?: {
      apenasAtivos?: boolean
      categoriaId?: string
    }) => Promise<PizzaSabor[]>
    listarSaboresComCategorias: () => Promise<PizzaSaborComCategoria[]>
    criarSabor: (entrada: CriarPizzaSaborEntrada) => Promise<PizzaSabor>
    atualizarSabor: (entrada: AtualizarPizzaSaborEntrada) => Promise<PizzaSabor>
    vincularSaborCategoria: (entrada: VincularSaborCategoriaEntrada) => Promise<void>
    definirPreco: (entrada: DefinirPrecoSaborPorTamanhoEntrada) => Promise<PizzaSaborPreco>
    listarPrecosSabor: (entrada: {
      saborId: string
      apenasAtivos?: boolean
    }) => Promise<PizzaSaborPreco[]>
    listarCategoriasDoSabor: (entrada: { saborId: string }) => Promise<string[]>
    montarPreview: (entrada: MontarPreviewPizzaEntrada) => Promise<PreviewPizza>
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
  divisaoConta: {
    criar: (entrada: CriarDivisaoContaEntrada) => Promise<ResumoDivisaoConta>
    obterResumo: (entrada: ObterResumoDivisaoContaEntrada) => Promise<ResumoDivisaoConta | null>
    registrarPagamentoParte: (
      entrada: RegistrarPagamentoParteDivisaoEntrada,
    ) => Promise<ResumoDivisaoConta>
    cancelar: (entrada: CancelarDivisaoContaEntrada) => Promise<ResumoDivisaoConta>
    listarHistorico: (
      entrada: ListarHistoricoDivisaoContaEntrada,
    ) => Promise<PedidoDivisaoMovimentacao[]>
  }
  clientes: {
    criar: (entrada: CriarClienteEntrada) => Promise<Cliente>
    listar: (entrada?: ListarClientesEntrada) => Promise<Cliente[]>
    obter: (entrada: ObterClienteEntrada) => Promise<Cliente>
    atualizar: (entrada: AtualizarClienteEntrada) => Promise<Cliente>
    inativar: (entrada: InativarClienteEntrada) => Promise<Cliente>
    reativar: (entrada: ReativarClienteEntrada) => Promise<Cliente>
    vincularPedido: (entrada: VincularClientePedidoEntrada) => Promise<import('./pedido').Pedido>
  }
  talao: {
    obterConta: (entrada: ObterContaTalaoEntrada) => Promise<ContaTalaoCliente>
    listarContas: (entrada?: ListarContasTalaoEntrada) => Promise<ContaTalaoCliente[]>
    registrarBaixa: (entrada: RegistrarBaixaTalaoEntrada) => Promise<TalaoBaixa>
  }
  catalogo: {
    buscarCategorias: (
      entrada?: BuscarCategoriasCatalogoEntrada,
    ) => Promise<CategoriaCatalogo[]>
  }
  impressao: {
    imprimirAmostra: (
      entrada: ImprimirAmostraEntrada,
    ) => Promise<ResultadoImpressaoAmostra>
    imprimirConta: (entrada: ImprimirPedidoEntrada) => Promise<ResultadoImpressao>
    imprimirComanda: (entrada: ImprimirPedidoEntrada) => Promise<ResultadoImpressao>
  }
  sync: {
    obterEstado: () => Promise<EstadoSincronizacao>
    onCatalogoAtualizado: (callback: () => void) => () => void
  }
  config: {
    listarImpressoras: () => Promise<ConfigImpressora[]>
    listarImpressorasSistema: () => Promise<ImpressorasSistemaResposta>
    recuperarImpressoras: () => Promise<
      Array<{ nome: string; status: string | null; jobCount: number | null }>
    >
    salvarImpressoras: (
      entrada: SalvarConfigImpressorasEntrada,
    ) => Promise<ConfigImpressora[]>
    atualizarSetorCategoria: (
      entrada: AtualizarSetorCategoriaEntrada,
    ) => Promise<CategoriaProduto>
    obterOperador: () => Promise<OperadorConfig | null>
    listarOperadoresEntrada: () => Promise<OperadorEntradaResumo[]>
    listarOperadores: () => Promise<OperadorResumo[]>
    salvarOperador: (entrada: SalvarOperadorEntrada) => Promise<OperadorConfig>
    autenticarOperador: (entrada: AutenticarOperadorEntrada) => Promise<OperadorConfig>
    obterInfoSync: () => Promise<{
      apiUrl: string | null
      dispositivoId: string | null
      apiConfigurada: boolean
    }>
  }
  fiscal: {
    obterDocumento: (entrada: { pedidoId: string }) => Promise<DocumentoFiscalLocal | null>
    imprimirDanfe: (entrada: ImprimirDanfeNfceEntrada) => Promise<ResultadoImpressao>
  }
}

declare global {
  interface Window {
    pdv: PdvApi
  }
}

export {}
