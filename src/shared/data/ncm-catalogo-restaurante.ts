/**
 * NCMs usuais para cardápio de restaurante/pizzaria (Brasil).
 * Fontes: TIPI/Siscomex, tabelas setoriais (SisFood, FoodSistemas) e CEST Convênio ICMS 142/2018.
 * Validar com o contador antes de produção.
 */
export interface SugestaoNcmProduto {
  ncm: string
  cest?: string | null
  fiscalCfop?: string
  fiscalIcmsCsosn?: string
  fiscalPisCst?: string
  fiscalCofinsCst?: string
  fonte: string
}

function normalizarTexto(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

/** Match exato pelo nome do produto (sem acentos, minúsculo). */
export const NCM_POR_NOME_PRODUTO: Record<string, SugestaoNcmProduto> = {
  'coca-cola lata 350ml': {
    ncm: '22021000',
    cest: '0301002',
    fiscalIcmsCsosn: '500',
    fonte: 'Refrigerante em lata — NCM 2202.10.00 (SisFood/TIPI)',
  },
  'guarana antarctica lata': {
    ncm: '22021000',
    cest: '0301002',
    fiscalIcmsCsosn: '500',
    fonte: 'Refrigerante em lata — NCM 2202.10.00',
  },
  'agua mineral 500ml': {
    ncm: '22011000',
    fonte: 'Água mineral — NCM 2201.10.00 (TIPI)',
  },
  'suco natural do dia': {
    ncm: '20099000',
    fonte: 'Suco de fruta não fermentado — NCM 2009.90.00 (TIPI)',
  },
  'chopp brahma 300ml': {
    ncm: '22030000',
    cest: '0302100',
    fiscalIcmsCsosn: '500',
    fonte: 'Cerveja de malte/chopp — NCM 2203.00.00 (TIPI)',
  },
  'caipirinha tradicional': {
    ncm: '22089000',
    fonte: 'Outras bebidas alcoólicas preparadas — NCM 2208.90.00 (TIPI)',
  },
  'soda limonada': {
    ncm: '22021000',
    fonte: 'Refrigerante/bebida aromatizada — NCM 2202.10.00',
  },
  'batata frita crocante': {
    ncm: '20041000',
    fonte: 'Batatas preparadas/congeladas — NCM 2004.10.00 (SisFood)',
  },
  'frango a passarinho': {
    ncm: '16023230',
    fonte: 'Preparações de aves — NCM 1602.32.30 (SisFood)',
  },
  'isca de peixe': {
    ncm: '16041900',
    fonte: 'Outras preparações de peixes — NCM 1604.19.00 (SisFood)',
  },
  'calabresa acebolada': {
    ncm: '16010000',
    fonte: 'Enchidos de carne suína — NCM 1601.00.00 (TIPI)',
  },
  'polenta frita com queijo': {
    ncm: '19059090',
    fonte: 'Produto de padaria/pastelaria — NCM 1905.90.90',
  },
  'mandioca frita': {
    ncm: '07141000',
    fonte: 'Mandioca seca/raspa — NCM 0714.10.00 (aprox. porção frita)',
  },
  'file mignon com fritas': {
    ncm: '21069090',
    fonte: 'Refeição pronta — NCM 2106.90.90 (SisFood)',
  },
  'parmegiana de frango': {
    ncm: '21069090',
    fonte: 'Refeição pronta — NCM 2106.90.90',
  },
  'escondidinho de carne seca': {
    ncm: '21069090',
    fonte: 'Refeição pronta — NCM 2106.90.90',
  },
  'strogonoff de frango': {
    ncm: '21069090',
    fonte: 'Refeição pronta — NCM 2106.90.90',
  },
  'risoto de camarao': {
    ncm: '21069090',
    fonte: 'Refeição pronta — NCM 2106.90.90',
  },
  'salada caesar com frango': {
    ncm: '20059900',
    fonte: 'Vegetais preparados — NCM 2005.99.00 (SisFood)',
  },
  'pudim de leite': {
    ncm: '21069090',
    fonte: 'Preparação alimentícia pronta — NCM 2106.90.90',
  },
  'petit gateau': {
    ncm: '19059090',
    fonte: 'Produto de padaria/confeitaria — NCM 1905.90.90',
  },
  'salada de frutas': {
    ncm: '20099900',
    fonte: 'Frutas/preparações de frutas — NCM 2009.99.00',
  },
  'brownie com sorvete': {
    ncm: '19059090',
    fonte: 'Produto de padaria/confeitaria — NCM 1905.90.90',
  },
}

interface RegraNcmPalavraChave {
  palavras: string[]
  categorias?: string[]
  sugestao: SugestaoNcmProduto
}

const REGRAS_NCM_PALAVRA_CHAVE: RegraNcmPalavraChave[] = [
  {
    palavras: ['combo'],
    sugestao: {
      ncm: '21069090',
      fonte: 'Combo/refeição pronta — NCM 2106.90.90',
    },
  },
  {
    palavras: ['sushi', 'sashimi', 'temaki', 'hot roll'],
    sugestao: {
      ncm: '16042000',
      fonte: 'Preparações de peixes — NCM 1604.20.00',
    },
  },
  {
    palavras: ['catupiry', 'calabresa', 'mussarela', 'portuguesa', 'margherita', 'marguerita', 'napolitana', 'pepperoni', 'quatro queijos', 'prosciutto', 'camarao', 'camarão', 'brocolis', 'brócolis', 'vegetariana', 'carne seca', 'chocolate', 'morango', 'romeu', 'julieta', 'banoffe', 'prestigio'],
    sugestao: {
      ncm: '19059090',
      fonte: 'Sabor de pizza/cardápio assado — NCM 1905.90.90',
    },
  },
  {
    palavras: ['calabresa', 'mussarela', 'portuguesa', 'margherita', 'marguerita', 'napolitana', 'pepperoni', 'catupiry', 'quatro queijos', 'bacon', 'chocolate', 'romeu', 'banoffe', 'prestigio'],
    categorias: ['pizzas', 'pizza'],
    sugestao: {
      ncm: '19059090',
      fonte: 'Sabor de pizza — NCM 1905.90.90',
    },
  },
  {
    palavras: ['pizza', 'esfiha', 'calzone'],
    sugestao: {
      ncm: '19059090',
      fonte: 'Pizza pronta — NCM 1905.90.90 (SisFood)',
    },
  },
  {
    palavras: ['refrigerante', 'coca', 'guarana', 'pepsi', 'fanta', 'sprite', 'soda'],
    sugestao: {
      ncm: '22021000',
      cest: '0301002',
      fiscalIcmsCsosn: '500',
      fonte: 'Refrigerante — NCM 2202.10.00',
    },
  },
  {
    palavras: ['lata'],
    categorias: ['bebidas'],
    sugestao: {
      ncm: '22021000',
      cest: '0301002',
      fiscalIcmsCsosn: '500',
      fonte: 'Bebida em lata — NCM 2202.10.00',
    },
  },
  {
    palavras: ['agua'],
    categorias: ['bebidas'],
    sugestao: { ncm: '22011000', fonte: 'Água — NCM 2201.10.00' },
  },
  {
    palavras: ['suco'],
    sugestao: { ncm: '20099000', fonte: 'Suco — NCM 2009.90.00' },
  },
  {
    palavras: ['chopp', 'cerveja', 'chope'],
    sugestao: {
      ncm: '22030000',
      cest: '0302100',
      fiscalIcmsCsosn: '500',
      fonte: 'Cerveja — NCM 2203.00.00',
    },
  },
  {
    palavras: ['caipirinha', 'drink', 'coquetel', 'cocktail'],
    sugestao: { ncm: '22089000', fonte: 'Bebida alcoólica preparada — NCM 2208.90.00' },
  },
  {
    palavras: ['batata'],
    sugestao: { ncm: '20041000', fonte: 'Batata preparada — NCM 2004.10.00' },
  },
  {
    palavras: ['frango'],
    categorias: ['porcoes', 'porções', 'pratos'],
    sugestao: { ncm: '16023230', fonte: 'Preparação de aves — NCM 1602.32.30' },
  },
  {
    palavras: ['peixe', 'camarao', 'camarão', 'isca'],
    sugestao: { ncm: '16041900', fonte: 'Preparação de peixes — NCM 1604.19.00' },
  },
  {
    palavras: ['salada'],
    sugestao: { ncm: '20059900', fonte: 'Salada preparada — NCM 2005.99.00' },
  },
  {
    palavras: ['sorvete', 'brownie', 'bolo', 'torta', 'gateau'],
    sugestao: { ncm: '19059090', fonte: 'Confeitaria/padaria — NCM 1905.90.90' },
  },
  {
    palavras: ['pudim', 'mousse', 'sobremesa'],
    sugestao: { ncm: '21069090', fonte: 'Preparação alimentícia — NCM 2106.90.90' },
  },
]

const NCM_POR_CATEGORIA: Record<string, SugestaoNcmProduto> = {
  bebidas: { ncm: '22021000', fonte: 'Fallback bebidas — NCM 2202.10.00' },
  porcoes: { ncm: '21069090', fonte: 'Fallback porções — NCM 2106.90.90' },
  porções: { ncm: '21069090', fonte: 'Fallback porções — NCM 2106.90.90' },
  pratos: { ncm: '21069090', fonte: 'Fallback pratos — NCM 2106.90.90' },
  sobremesas: { ncm: '19059090', fonte: 'Fallback sobremesas — NCM 1905.90.90' },
  pizzas: { ncm: '19059090', fonte: 'Fallback pizzas — NCM 1905.90.90' },
  pizza: { ncm: '19059090', fonte: 'Fallback pizzas — NCM 1905.90.90' },
  sushi: { ncm: '16042000', fonte: 'Fallback sushi — NCM 1604.20.00' },
  combos: { ncm: '21069090', fonte: 'Fallback combos — NCM 2106.90.90' },
}

import { resolverFiscalChinaExpress } from './china-express-catalogo-fiscal'

export function resolverNcmProduto(
  nome: string,
  categoriaNome?: string | null,
): SugestaoNcmProduto | null {
  const chinaExpress = resolverFiscalChinaExpress(nome)
  if (chinaExpress?.ncm) {
    return chinaExpress
  }

  const nomeNorm = normalizarTexto(nome)
  const categoriaNorm = categoriaNome ? normalizarTexto(categoriaNome) : ''

  const exato = NCM_POR_NOME_PRODUTO[nomeNorm]
  if (exato) {
    return exato
  }

  for (const regra of REGRAS_NCM_PALAVRA_CHAVE) {
    const batePalavra = regra.palavras.some((palavra) => nomeNorm.includes(normalizarTexto(palavra)))
    if (!batePalavra) continue

    if (regra.categorias && regra.categorias.length > 0) {
      const bateCategoria = regra.categorias.some((cat) => categoriaNorm.includes(normalizarTexto(cat)))
      if (!bateCategoria) continue
    }

    return regra.sugestao
  }

  const fallbackCategoria = NCM_POR_CATEGORIA[categoriaNorm]
  if (fallbackCategoria) {
    return fallbackCategoria
  }

  return null
}
