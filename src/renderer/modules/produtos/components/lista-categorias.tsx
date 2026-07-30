import type { CategoriaProduto } from '@shared/types/categoria-produto'

interface ListaCategoriasProps {
  categorias: CategoriaProduto[]
  onInativar: (categoriaId: string) => Promise<boolean>
  onReativar: (categoriaId: string) => Promise<boolean>
}

export function ListaCategorias({
  categorias,
  onInativar,
  onReativar,
}: ListaCategoriasProps) {
  if (categorias.length === 0) {
    return (
      <p className="lista-categorias__vazio" data-testid="estado-vazio-categorias">
        Nenhuma categoria cadastrada.
      </p>
    )
  }

  return (
    <ul className="lista-categorias" data-testid="lista-categorias">
      {categorias.map((categoria) => (
        <li
          key={categoria.id}
          className="lista-categorias__item"
          data-testid="item-categoria"
        >
          <div>
            <strong>{categoria.nome}</strong>
            {categoria.descricao ? <p>{categoria.descricao}</p> : null}
          </div>
          <span
            className={
              categoria.ativo
                ? 'lista-categorias__status lista-categorias__status--ativo'
                : 'lista-categorias__status lista-categorias__status--inativo'
            }
            data-testid="status-categoria"
          >
            {categoria.ativo ? 'Ativa' : 'Inativa'}
          </span>
          {categoria.ativo ? (
            <button
              type="button"
              data-testid="botao-inativar-categoria"
              onClick={() => void onInativar(categoria.id)}
            >
              Inativar
            </button>
          ) : (
            <button
              type="button"
              data-testid="botao-reativar-categoria"
              onClick={() => void onReativar(categoria.id)}
            >
              Reativar
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
