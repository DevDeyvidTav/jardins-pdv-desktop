import type { SetorImpressao } from '@shared/types/config-impressora'

/** Mapeamento categoria → setor de impressão (docs/relacao-cardapio-impressora.md). */
export const SETOR_POR_CATEGORIA_JARDINS: Record<string, SetorImpressao> = {
  // Balcão — só na conta
  'Bebidas Alcoolica': 'BALCAO',
  Drinks: 'BALCAO',
  Refrigerantes: 'BALCAO',
  Sucos: 'BALCAO',
  Diversos: 'BALCAO',

  // Cozinha chinesa
  Rolinhos: 'CHINESA',
  Yakissoba: 'CHINESA',
  Bifum: 'CHINESA',
  'Pratos Quentes Chinesa': 'CHINESA',
  Petiscos: 'CHINESA',
  Sobremesa: 'CHINESA',

  // Pizzaria (produtos avulsos + bordas)
  'Pratos Quentes Italiano': 'PIZZA',
  Bordas: 'PIZZA',

  // Cozinha japonesa
  'Sushi Tradicional': 'JAPONESA',
  'Sushi Doce': 'JAPONESA',
  'Sushi Especial': 'JAPONESA',
  'Sushi Premium': 'JAPONESA',
  Barcas: 'JAPONESA',
  'Clone De Temaki': 'JAPONESA',
  Combos: 'JAPONESA',
  'Promocao Do Dia': 'JAPONESA',
  'Rdz A La Cart': 'JAPONESA',
  'Rdz Pecas Especiais': 'JAPONESA',
  'Rdz Pratos': 'JAPONESA',
  'Rdz Rolinho': 'JAPONESA',
  'Rdz Sunomono': 'JAPONESA',
  'Rdz Temaki': 'JAPONESA',
  Rodizio: 'JAPONESA',
  Sashimi: 'JAPONESA',
  Sunomono: 'JAPONESA',
  Supremo: 'JAPONESA',
  Sushiburguer: 'JAPONESA',
  Temakis: 'JAPONESA',
}

export function resolverSetorCategoriaJardins(nomeCategoria: string): SetorImpressao | null {
  return SETOR_POR_CATEGORIA_JARDINS[nomeCategoria] ?? null
}
