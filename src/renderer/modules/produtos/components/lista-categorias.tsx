import type { CategoriaProduto } from '@shared/types/categoria-produto'

interface ListaCategoriasProps {
  categorias: CategoriaProduto[]
  categoriaSelecionadaId?: string
  onSelecionar?: (categoriaId: string) => void
  onEditar: (categoria: CategoriaProduto) => void
  onInativar: (categoriaId: string) => Promise<boolean>
  onReativar: (categoriaId: string) => Promise<boolean>
  onExcluir: (categoria: CategoriaProduto) => void
}

export function ListaCategorias({
  categorias,
  categoriaSelecionadaId = '',
  onSelecionar,
  onEditar,
  onInativar,
  onReativar,
  onExcluir,
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
      {categorias.map((categoria) => {
        const selecionada = categoriaSelecionadaId === categoria.id

        return (
          <li
            key={categoria.id}
            className={[
              'lista-categorias__item',
              selecionada ? 'lista-categorias__item--selecionada' : '',
              !categoria.ativo ? 'lista-categorias__item--inativa' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            data-testid="item-categoria"
            data-selecionada={selecionada}
          >
            <button
              type="button"
              className="lista-categorias__selecao"
              data-testid="botao-selecionar-categoria"
              onClick={() => onSelecionar?.(categoria.id)}
            >
              <strong>{categoria.nome}</strong>
              {categoria.descricao ? <span>{categoria.descricao}</span> : null}
            </button>

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

            <div className="lista-categorias__acoes">
              <button
                type="button"
                className="lista-categorias__acao"
                data-testid="botao-editar-categoria"
                onClick={() => onEditar(categoria)}
              >
                Editar
              </button>
              {categoria.ativo ? (
                <button
                  type="button"
                  className="lista-categorias__acao"
                  data-testid="botao-inativar-categoria"
                  onClick={() => void onInativar(categoria.id)}
                >
                  Inativar
                </button>
              ) : (
                <button
                  type="button"
                  className="lista-categorias__acao"
                  data-testid="botao-reativar-categoria"
                  onClick={() => void onReativar(categoria.id)}
                >
                  Reativar
                </button>
              )}
              <button
                type="button"
                className="lista-categorias__acao lista-categorias__acao--excluir"
                data-testid="botao-excluir-categoria"
                onClick={() => onExcluir(categoria)}
              >
                Excluir
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
