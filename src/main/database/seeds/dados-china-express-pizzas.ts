/**
 * Pizzas China Express — sabores e preços por tamanho.
 * Gerado por scripts/gerar-china-express-catalogo.py — não editar manualmente.
 */
import { REGRA_PRECIFICACAO_PIZZA } from '@shared/types/pizza'

export interface PrecosPizzaChinaExpressSeed {
  mini?: number
  p?: number
  m?: number
  g?: number
}

export interface SaborPizzaChinaExpressSeed {
  nome: string
  ordem: number
  precos: PrecosPizzaChinaExpressSeed
}

export interface CategoriaPizzaChinaExpressSeed {
  nome: string
  descricao?: string
  regraPrecificacao: (typeof REGRA_PRECIFICACAO_PIZZA)[keyof typeof REGRA_PRECIFICACAO_PIZZA]
  ordem: number
  sabores: SaborPizzaChinaExpressSeed[]
}

export const CATEGORIAS_PIZZA_CHINA_EXPRESS: CategoriaPizzaChinaExpressSeed[] = [
  {
    nome: 'Tradicional',
    descricao: 'Sabores clássicos do cardápio China Express',
    regraPrecificacao: REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR,
    ordem: 1,
    sabores: [
      {
        nome: 'Frango Acebolado',
        ordem: 1,
        precos: { mini: 2800, p: 3000, m: 4500, g: 6500 },
      },
      {
        nome: 'Frango Especial',
        ordem: 2,
        precos: { mini: 2800, p: 3000, m: 4500, g: 6500 },
      },
      {
        nome: 'Frango Catupiry',
        ordem: 3,
        precos: { mini: 2800, p: 3000, m: 4500, g: 6500 },
      },
      {
        nome: 'Frango Com Cheddar',
        ordem: 4,
        precos: { mini: 2800, p: 3000, m: 4500, g: 6500 },
      },
      {
        nome: 'Mussarela',
        ordem: 5,
        precos: { mini: 2800, p: 3000, m: 4500, g: 6500 },
      },
      {
        nome: 'Portuguesa',
        ordem: 6,
        precos: { mini: 2800, p: 3000, m: 4500, g: 6500 },
      },
      {
        nome: 'Calabresa',
        ordem: 7,
        precos: { mini: 2800, p: 3000, m: 4500, g: 6500 },
      },
      {
        nome: 'Napolitana',
        ordem: 8,
        precos: { mini: 2800, p: 3000, m: 4500, g: 6500 },
      },
      {
        nome: 'Baiana',
        ordem: 9,
        precos: { mini: 2800, p: 3000, m: 4500, g: 6500 },
      },
      {
        nome: 'Margherita',
        ordem: 10,
        precos: { mini: 2800, p: 3000, g: 6500 },
      },
      {
        nome: 'Mafiosa',
        ordem: 11,
        precos: { mini: 2800, p: 3000, m: 4500, g: 6500 },
      },
      {
        nome: 'Pepperoni',
        ordem: 12,
        precos: { mini: 2800, p: 3000, m: 4500, g: 6500 },
      },
      {
        nome: 'Italiana',
        ordem: 13,
        precos: { mini: 2800, p: 3000, m: 4500, g: 6500 },
      },
      {
        nome: 'Sertanejo',
        ordem: 14,
        precos: { mini: 2800, p: 3000, m: 4500, g: 6500 },
      },
      {
        nome: 'Canadense',
        ordem: 15,
        precos: { mini: 2800, p: 3000, m: 4500, g: 6500 },
      },
      {
        nome: 'Catupiry',
        ordem: 16,
        precos: { mini: 2800, p: 3000, m: 4500, g: 6500 },
      },
      {
        nome: 'Paulista',
        ordem: 17,
        precos: { mini: 2800, p: 3000, m: 4500, g: 6500 },
      },
      {
        nome: 'Firenze',
        ordem: 18,
        precos: { mini: 2800, p: 3000, m: 4500, g: 6500 },
      },
      {
        nome: 'Romana',
        ordem: 19,
        precos: { mini: 2800, p: 3000, m: 4500, g: 6500 },
      },
      {
        nome: 'Caipira',
        ordem: 20,
        precos: { mini: 2800, p: 3000, m: 4500, g: 6500 },
      },
      {
        nome: 'Coreana',
        ordem: 21,
        precos: { mini: 2800, p: 3000, m: 4500, g: 6500 },
      },
      {
        nome: 'Calzone',
        ordem: 22,
        precos: { mini: 2800, p: 3000, m: 4500, g: 6500 },
      },
      {
        nome: 'Quatro Queijos',
        ordem: 23,
        precos: { mini: 2800, p: 3000, m: 4500, g: 6500 },
      },
      {
        nome: 'Nargherita',
        ordem: 24,
        precos: { m: 4500 },
      },
    ],
  },
  {
    nome: 'Especial',
    descricao: 'Sabores especiais do cardápio China Express',
    regraPrecificacao: REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR,
    ordem: 2,
    sabores: [
      {
        nome: 'Camarao',
        ordem: 1,
        precos: { mini: 3500, p: 3500, m: 5100, g: 7400 },
      },
      {
        nome: 'File Mignon',
        ordem: 2,
        precos: { mini: 3500, p: 3500, m: 5100, g: 7400 },
      },
      {
        nome: 'Matuta',
        ordem: 3,
        precos: { mini: 3500, p: 3500, m: 5100, g: 7400 },
      },
      {
        nome: 'Strogonoff',
        ordem: 4,
        precos: { mini: 3500, m: 5100, g: 7400 },
      },
      {
        nome: 'Queijo Do Reino',
        ordem: 5,
        precos: { mini: 3500, p: 3500, m: 5100, g: 7400 },
      },
      {
        nome: 'Stogonoff',
        ordem: 6,
        precos: { p: 3500 },
      },
    ],
  },
  {
    nome: 'Doce',
    descricao: 'Pizzas doces do cardápio China Express',
    regraPrecificacao: REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR,
    ordem: 3,
    sabores: [
      {
        nome: 'Kit Kat',
        ordem: 1,
        precos: { p: 4300, m: 5900, g: 7800 },
      },
      {
        nome: 'Oreo',
        ordem: 2,
        precos: { p: 4300, m: 5900, g: 6500 },
      },
      {
        nome: 'Brigadeiro',
        ordem: 3,
        precos: { mini: 2200, m: 4900, g: 6800 },
      },
      {
        nome: 'Preta E Branca',
        ordem: 4,
        precos: { mini: 2200, m: 4900, g: 6800 },
      },
      {
        nome: 'Cartola',
        ordem: 5,
        precos: { mini: 2200, p: 3300, m: 4900, g: 6800 },
      },
      {
        nome: 'Avela Com Mm',
        ordem: 6,
        precos: { p: 3300, m: 4900, g: 6800 },
      },
      {
        nome: 'Preto E Branco',
        ordem: 7,
        precos: { p: 3300, m: 4900, g: 6800 },
      },
      {
        nome: 'Doce De Leite Com Pacoca',
        ordem: 8,
        precos: { p: 3300, m: 4900, g: 6800 },
      },
    ],
  },
]

export const TOTAL_CATEGORIAS_PIZZA_CHINA_EXPRESS = 3
export const TOTAL_SABORES_PIZZA_CHINA_EXPRESS = 38
