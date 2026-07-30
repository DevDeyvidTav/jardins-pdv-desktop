import type { InformacoesSistema } from './informacoes-sistema'
import type {
  AtualizarCategoriaProdutoEntrada,
  CategoriaProduto,
  CriarCategoriaProdutoEntrada,
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
  InativarProdutoEntrada,
  ListarProdutosEntrada,
  ObterProdutoPorIdEntrada,
  Produto,
  ProdutoComCategoria,
  ReativarProdutoEntrada,
} from './produto'

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
    criarProduto: (entrada: CriarProdutoEntrada) => Promise<Produto>
    listarProdutos: (entrada?: ListarProdutosEntrada) => Promise<ProdutoComCategoria[]>
    buscarProdutos: (entrada: BuscarProdutosEntrada) => Promise<ProdutoComCategoria[]>
    atualizarProduto: (entrada: AtualizarProdutoEntrada) => Promise<Produto>
    inativarProduto: (entrada: InativarProdutoEntrada) => Promise<Produto>
    reativarProduto: (entrada: ReativarProdutoEntrada) => Promise<Produto>
    obterProdutoPorId: (entrada: ObterProdutoPorIdEntrada) => Promise<Produto>
  }
}

declare global {
  interface Window {
    pdv: PdvApi
  }
}

export {}
