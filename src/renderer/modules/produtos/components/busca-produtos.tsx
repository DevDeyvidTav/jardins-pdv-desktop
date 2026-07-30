import type { CategoriaProduto } from '@shared/types/categoria-produto'

interface BuscaProdutosProps {
  termo: string
  categoriaFiltroId: string
  categorias: CategoriaProduto[]
  onTermoChange: (termo: string) => void
  onCategoriaChange: (categoriaId: string) => void
}

export function BuscaProdutos({
  termo,
  categoriaFiltroId,
  categorias,
  onTermoChange,
  onCategoriaChange,
}: BuscaProdutosProps) {
  return (
    <section className="busca-produtos" data-testid="busca-produtos">
      <label className="busca-produtos__campo" htmlFor="termo-busca-produto">
        Buscar por nome
        <input
          id="termo-busca-produto"
          data-testid="campo-busca-produto"
          type="search"
          value={termo}
          onChange={(evento) => onTermoChange(evento.target.value)}
          placeholder="Ex.: coca"
        />
      </label>

      <label className="busca-produtos__campo" htmlFor="filtro-categoria-produto">
        Filtrar por categoria
        <select
          id="filtro-categoria-produto"
          data-testid="filtro-categoria-produto"
          value={categoriaFiltroId}
          onChange={(evento) => onCategoriaChange(evento.target.value)}
        >
          <option value="">Todas</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </select>
      </label>
    </section>
  )
}
