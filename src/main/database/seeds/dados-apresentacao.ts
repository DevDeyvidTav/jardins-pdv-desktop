import { REGRA_PRECIFICACAO_PIZZA } from '@shared/types/pizza'

export const CHAVE_METADATA_SEED_APRESENTACAO = 'seed_apresentacao_v1'

export const IDS_TAMANHO_PIZZA = {
  P: 'pizza-tamanho-p',
  M: 'pizza-tamanho-m',
  G: 'pizza-tamanho-g',
} as const

export interface ProdutoSeed {
  nome: string
  descricao?: string
  precoCentavos: number
}

export interface CategoriaProdutoSeed {
  nome: string
  descricao?: string
  produtos: ProdutoSeed[]
}

export const CATEGORIAS_PRODUTO_APRESENTACAO: CategoriaProdutoSeed[] = [
  {
    nome: 'Bebidas',
    descricao: 'Refrigerantes, sucos e cervejas',
    produtos: [
      { nome: 'Coca-Cola Lata 350ml', precoCentavos: 600 },
      { nome: 'Guaraná Antarctica Lata', precoCentavos: 600 },
      { nome: 'Água Mineral 500ml', precoCentavos: 400 },
      { nome: 'Suco Natural do Dia', descricao: 'Laranja, abacaxi ou maracujá', precoCentavos: 1200 },
      { nome: 'Chopp Brahma 300ml', precoCentavos: 1400 },
      { nome: 'Caipirinha Tradicional', precoCentavos: 2200 },
      { nome: 'Soda Limonada', precoCentavos: 1000 },
    ],
  },
  {
    nome: 'Porções',
    descricao: 'Para compartilhar na mesa',
    produtos: [
      { nome: 'Batata Frita Crocante', descricao: 'Com cheddar e bacon', precoCentavos: 3200 },
      { nome: 'Frango a Passarinho', precoCentavos: 4500 },
      { nome: 'Isca de Peixe', precoCentavos: 5200 },
      { nome: 'Calabresa Acebolada', precoCentavos: 3800 },
      { nome: 'Polenta Frita com Queijo', precoCentavos: 2900 },
      { nome: 'Mandioca Frita', precoCentavos: 2600 },
    ],
  },
  {
    nome: 'Pratos',
    descricao: 'Refeições individuais',
    produtos: [
      { nome: 'Filé Mignon com Fritas', precoCentavos: 6800 },
      { nome: 'Parmegiana de Frango', precoCentavos: 6200 },
      { nome: 'Escondidinho de Carne Seca', precoCentavos: 4800 },
      { nome: 'Strogonoff de Frango', precoCentavos: 5500 },
      { nome: 'Risoto de Camarão', precoCentavos: 7200 },
      { nome: 'Salada Caesar com Frango', precoCentavos: 4200 },
    ],
  },
  {
    nome: 'Sobremesas',
    descricao: 'Finalização doce',
    produtos: [
      { nome: 'Pudim de Leite', precoCentavos: 1600 },
      { nome: 'Petit Gateau', precoCentavos: 2400 },
      { nome: 'Salada de Frutas', precoCentavos: 1800 },
      { nome: 'Brownie com Sorvete', precoCentavos: 2200 },
    ],
  },
]

export interface SaborPizzaSeed {
  nome: string
  descricao?: string
  ordem: number
  precos: { p: number; m: number; g: number }
}

export interface CategoriaPizzaSeed {
  nome: string
  descricao?: string
  regraPrecificacao: (typeof REGRA_PRECIFICACAO_PIZZA)[keyof typeof REGRA_PRECIFICACAO_PIZZA]
  ordem: number
  sabores: SaborPizzaSeed[]
}

export const CATEGORIAS_PIZZA_APRESENTACAO: CategoriaPizzaSeed[] = [
  {
    nome: 'Tradicional',
    descricao: 'Sabores clássicos — cobrança pelo maior sabor',
    regraPrecificacao: REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR,
    ordem: 1,
    sabores: [
      { nome: 'Calabresa', ordem: 1, precos: { p: 3490, m: 4490, g: 5490 } },
      { nome: 'Mussarela', ordem: 2, precos: { p: 3290, m: 4190, g: 5190 } },
      { nome: 'Portuguesa', ordem: 3, precos: { p: 3690, m: 4690, g: 5790 } },
      { nome: 'Frango c/ Catupiry', ordem: 4, precos: { p: 3590, m: 4590, g: 5690 } },
      { nome: 'Quatro Queijos', ordem: 5, precos: { p: 3890, m: 4990, g: 5990 } },
      { nome: 'Pepperoni', ordem: 6, precos: { p: 3790, m: 4890, g: 5890 } },
      { nome: 'Napolitana', ordem: 7, precos: { p: 3490, m: 4490, g: 5490 } },
      { nome: 'Bacon c/ Cheddar', ordem: 8, precos: { p: 3990, m: 5090, g: 6190 } },
    ],
  },
  {
    nome: 'Premium',
    descricao: 'Sabores especiais — média dos sabores escolhidos',
    regraPrecificacao: REGRA_PRECIFICACAO_PIZZA.MEDIA_SABORES,
    ordem: 2,
    sabores: [
      {
        nome: 'Prosciutto c/ Rúcula',
        descricao: 'Tomate seco e parmesão',
        ordem: 1,
        precos: { p: 4290, m: 5490, g: 6690 },
      },
      {
        nome: 'Camarão c/ Cream Cheese',
        ordem: 2,
        precos: { p: 4590, m: 5790, g: 6990 },
      },
      {
        nome: 'Brócolis c/ Alho',
        ordem: 3,
        precos: { p: 3990, m: 5190, g: 6290 },
      },
      {
        nome: 'Vegetariana Especial',
        descricao: 'Berinjela, pimentão e tomate',
        ordem: 4,
        precos: { p: 3890, m: 4990, g: 6090 },
      },
      {
        nome: 'Carne Seca c/ Catupiry',
        ordem: 5,
        precos: { p: 4490, m: 5690, g: 6890 },
      },
    ],
  },
  {
    nome: 'Doce',
    descricao: 'Pizzas sobremesa',
    regraPrecificacao: REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR,
    ordem: 3,
    sabores: [
      { nome: 'Chocolate c/ Morango', ordem: 1, precos: { p: 3290, m: 4290, g: 5290 } },
      { nome: 'Romeu e Julieta', ordem: 2, precos: { p: 3190, m: 4190, g: 5090 } },
      { nome: 'Banoffe', ordem: 3, precos: { p: 3490, m: 4490, g: 5490 } },
      { nome: 'Prestígio', ordem: 4, precos: { p: 3390, m: 4390, g: 5390 } },
    ],
  },
]

export const MESAS_APRESENTACAO = { numeroInicial: 1, numeroFinal: 12 } as const

export const CLIENTES_APRESENTACAO = [
  {
    nome: 'Maria Oliveira',
    telefone: '81998887766',
    documento: '123.456.789-00',
    endereco: 'Rua das Flores, 120',
    liberaTalao: true,
  },
  {
    nome: 'João Ferreira',
    telefone: '81997776655',
    documento: '987.654.321-00',
    endereco: 'Av. Boa Viagem, 450',
    liberaTalao: true,
  },
] as const

export const CAIXA_APRESENTACAO = {
  operadorId: 'demo',
  operadorNome: 'Demonstração',
  saldoInicialCentavos: 15000,
} as const
