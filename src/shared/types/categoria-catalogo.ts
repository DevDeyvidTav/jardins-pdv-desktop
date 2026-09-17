export type TipoCategoriaCatalogo = 'produto' | 'pizza'

export interface CategoriaCatalogo {
  id: string
  tipo: TipoCategoriaCatalogo
  nome: string
}

export interface BuscarCategoriasCatalogoEntrada {
  termo?: string
  limite?: number
}
