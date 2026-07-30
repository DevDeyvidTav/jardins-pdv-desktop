import type { ProdutoComCategoria } from '@shared/types/produto'
import { formatarMoeda } from '@shared/utils/moeda'

interface ListaProdutosProps {
  produtos: ProdutoComCategoria[]
  titulo?: string
  exibirInativos?: boolean
  onInativar?: (produtoId: string) => Promise<boolean>
  onReativar?: (produtoId: string) => Promise<boolean>
}

export function ListaProdutos({
  produtos,
  titulo = 'Produtos ativos',
  exibirInativos = false,
  onInativar,
  onReativar,
}: ListaProdutosProps) {
  if (produtos.length === 0) {
    return (
      <section className="lista-produtos" data-testid="lista-produtos">
        {titulo ? <h2>{titulo}</h2> : null}
        <p className="lista-produtos__vazio" data-testid="estado-vazio-produtos">
          Nenhum produto encontrado.
        </p>
      </section>
    )
  }

  return (
    <section className="lista-produtos" data-testid="lista-produtos">
      {titulo ? <h2>{titulo}</h2> : null}
      <ul className="lista-produtos__itens">
        {produtos.map((produto) => (
          <li
            key={produto.id}
            className="lista-produtos__item"
            data-testid="item-produto"
          >
            <div>
              <strong data-testid="produto-nome">{produto.nome}</strong>
              <p data-testid="produto-categoria">{produto.categoriaNome}</p>
              {produto.descricao ? <p>{produto.descricao}</p> : null}
            </div>
            <span data-testid="produto-preco">{formatarMoeda(produto.precoCentavos)}</span>
            <span
              className={
                produto.ativo
                  ? 'lista-produtos__status lista-produtos__status--ativo'
                  : 'lista-produtos__status lista-produtos__status--inativo'
              }
              data-testid="status-produto"
            >
              {produto.ativo ? 'Ativo' : 'Inativo'}
            </span>
            {produto.ativo && onInativar && !exibirInativos ? (
              <button
                type="button"
                data-testid="botao-inativar-produto"
                onClick={() => void onInativar(produto.id)}
              >
                Inativar
              </button>
            ) : null}
            {!produto.ativo && onReativar && exibirInativos ? (
              <button
                type="button"
                data-testid="botao-reativar-produto"
                onClick={() => void onReativar(produto.id)}
              >
                Reativar
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
