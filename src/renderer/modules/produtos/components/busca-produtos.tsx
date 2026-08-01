import type { CategoriaProduto } from '@shared/types/categoria-produto'

interface BuscaProdutosProps {
  termo: string
  categoriaFiltroId: string
  categorias: CategoriaProduto[]
  onTermoChange: (termo: string) => void
  onCategoriaChange: (categoriaId: string) => void
  compacto?: boolean
}

export function BuscaProdutos({
  termo,
  categoriaFiltroId,
  categorias,
  onTermoChange,
  onCategoriaChange,
  compacto = false,
}: BuscaProdutosProps) {
  return (
    <section
      className={compacto ? 'busca-produtos busca-produtos--compacta' : 'busca-produtos'}
      data-testid="busca-produtos"
    >
      <label className="busca-produtos__campo" htmlFor="termo-busca-produto">
        {compacto ? null : 'Buscar por nome'}
        <input
          id="termo-busca-produto"
          data-testid="campo-busca-produto"
          type="search"
          value={termo}
          onChange={(evento) => onTermoChange(evento.target.value)}
          placeholder="Buscar produto..."
        />
      </label>

      <label className="busca-produtos__campo" htmlFor="filtro-categoria-produto">
        {compacto ? null : 'Filtrar por categoria'}
        <select
          id="filtro-categoria-produto"
          data-testid="filtro-categoria-produto"
          value={categoriaFiltroId}
          onChange={(evento) => onCategoriaChange(evento.target.value)}
        >
          <option value="">Todas as categorias</option>
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
