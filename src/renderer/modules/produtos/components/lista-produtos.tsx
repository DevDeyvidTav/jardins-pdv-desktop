import type { ProdutoComCategoria } from '@shared/types/produto'
import { formatarMoeda } from '@shared/utils/moeda'

interface ListaProdutosProps {
  produtos: ProdutoComCategoria[]
  titulo?: string
  compacto?: boolean
  exibirInativos?: boolean
  onEditar?: (produto: ProdutoComCategoria) => void
  onInativar?: (produtoId: string) => Promise<boolean>
  onReativar?: (produtoId: string) => Promise<boolean>
  onExcluir?: (produto: ProdutoComCategoria) => void
}

export function ListaProdutos({
  produtos,
  titulo,
  compacto = false,
  exibirInativos = false,
  onEditar,
  onInativar,
  onReativar,
  onExcluir,
}: ListaProdutosProps) {
  if (produtos.length === 0) {
    return (
      <section
        className={compacto ? 'lista-produtos lista-produtos--compacta' : 'lista-produtos'}
        data-testid="lista-produtos"
      >
        {titulo ? <h2>{titulo}</h2> : null}
        <p className="lista-produtos__vazio" data-testid="estado-vazio-produtos">
          Nenhum produto encontrado.
        </p>
      </section>
    )
  }

  return (
    <section
      className={compacto ? 'lista-produtos lista-produtos--compacta' : 'lista-produtos'}
      data-testid="lista-produtos"
    >
      {titulo ? <h2>{titulo}</h2> : null}

      {compacto ? (
        <div className="lista-produtos__cabecalho" aria-hidden>
          <span>Produto</span>
          <span>Categoria</span>
          <span>Preco</span>
          <span>Status</span>
          <span>Acoes</span>
        </div>
      ) : null}

      <ul className="lista-produtos__itens">
        {produtos.map((produto) => (
          <li
            key={produto.id}
            className={[
              'lista-produtos__item',
              !produto.ativo ? 'lista-produtos__item--inativo' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            data-testid="item-produto"
          >
            <div className="lista-produtos__nome">
              <strong data-testid="produto-nome">{produto.nome}</strong>
              {produto.descricao && !compacto ? <p>{produto.descricao}</p> : null}
              {produto.descricao && compacto ? (
                <span className="lista-produtos__descricao">{produto.descricao}</span>
              ) : null}
            </div>
            <span className="lista-produtos__categoria" data-testid="produto-categoria">
              {produto.categoriaNome}
            </span>
            <span className="lista-produtos__preco" data-testid="produto-preco">
              {formatarMoeda(produto.precoCentavos)}
            </span>
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
            <div className="lista-produtos__acoes">
              {onEditar ? (
                <button
                  type="button"
                  data-testid="botao-editar-produto"
                  onClick={() => onEditar(produto)}
                >
                  Editar
                </button>
              ) : null}
              {produto.ativo && onInativar ? (
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
              {onExcluir ? (
                <button
                  type="button"
                  className="lista-produtos__acao--excluir"
                  data-testid="botao-excluir-produto"
                  onClick={() => onExcluir(produto)}
                >
                  Excluir
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
