import { useState, type FormEvent } from 'react'
import type { PedidoItem } from '@shared/types/pedido'
import type { ProdutoComCategoria } from '@shared/types/produto'
import { formatarMoeda } from '@shared/utils/moeda'

interface BuscaProdutosPedidoProps {
  produtos: ProdutoComCategoria[]
  termo: string
  onTermoChange: (termo: string) => void
  onAdicionar: (produtoId: string, quantidade: number, observacao?: string) => Promise<boolean>
  compacto?: boolean
}

export function BuscaProdutosPedido({
  produtos,
  termo,
  onTermoChange,
  onAdicionar,
  compacto = false,
}: BuscaProdutosPedidoProps) {
  const [produtoSelecionado, setProdutoSelecionado] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [observacao, setObservacao] = useState('')
  const [erroValidacao, setErroValidacao] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErroValidacao(null)

    const quantidadeNumero = Number(quantidade)

    if (!produtoSelecionado) {
      setErroValidacao('Selecione um produto.')
      return
    }

    if (!Number.isInteger(quantidadeNumero) || quantidadeNumero <= 0) {
      setErroValidacao('Informe uma quantidade valida maior que zero.')
      return
    }

    setEnviando(true)

    try {
      const sucesso = await onAdicionar(
        produtoSelecionado,
        quantidadeNumero,
        observacao.trim() || undefined,
      )

      if (sucesso) {
        setObservacao('')
        setQuantidade('1')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section
      className={`busca-produtos-pedido${compacto ? ' busca-produtos-pedido--compacto' : ''}`}
      data-testid="busca-produtos-pedido"
    >
      <label className="busca-produtos-pedido__campo" htmlFor="busca-produto-pedido">
        {compacto ? 'Busca' : 'Buscar produto'}
        <input
          id="busca-produto-pedido"
          data-testid="campo-busca-produto-pedido"
          type="search"
          value={termo}
          onChange={(evento) => onTermoChange(evento.target.value)}
          placeholder="Nome do produto"
        />
      </label>

      <form
        className="busca-produtos-pedido__formulario"
        data-testid="formulario-adicionar-item"
        onSubmit={(evento) => void handleSubmit(evento)}
      >
        <label className="busca-produtos-pedido__campo" htmlFor="produto-pedido">
          Produto
          <select
            id="produto-pedido"
            data-testid="campo-produto-pedido"
            value={produtoSelecionado}
            onChange={(evento) => setProdutoSelecionado(evento.target.value)}
            disabled={enviando || produtos.length === 0}
          >
            <option value="">Selecione</option>
            {produtos.map((produto) => (
              <option key={produto.id} value={produto.id}>
                {produto.nome} — {formatarMoeda(produto.precoCentavos)}
              </option>
            ))}
          </select>
        </label>

        <label className="busca-produtos-pedido__campo" htmlFor="quantidade-item">
          Qtd
          <input
            id="quantidade-item"
            data-testid="campo-quantidade-item"
            type="number"
            min={1}
            value={quantidade}
            onChange={(evento) => setQuantidade(evento.target.value)}
            disabled={enviando}
          />
        </label>

        {!compacto ? (
          <label className="busca-produtos-pedido__campo" htmlFor="observacao-item">
            Observacao
            <input
              id="observacao-item"
              data-testid="campo-observacao-item"
              type="text"
              value={observacao}
              onChange={(evento) => setObservacao(evento.target.value)}
              disabled={enviando}
              placeholder="Opcional"
            />
          </label>
        ) : null}

        {erroValidacao ? (
          <p className="busca-produtos-pedido__erro" role="alert">
            {erroValidacao}
          </p>
        ) : null}

        <button
          type="submit"
          className="busca-produtos-pedido__botao-adicionar"
          data-testid="botao-adicionar-item"
          disabled={enviando || produtos.length === 0}
        >
          {compacto ? 'Adicionar' : 'Adicionar ao pedido'}
        </button>
      </form>
    </section>
  )
}

interface ListaItensPedidoProps {
  itens: PedidoItem[]
  onAlterarQuantidade: (itemId: string, quantidade: number) => Promise<boolean>
  onRemover: (itemId: string) => Promise<boolean>
  variant?: 'lista' | 'tabela'
}

export function ListaItensPedido({
  itens,
  onAlterarQuantidade,
  onRemover,
  variant = 'lista',
}: ListaItensPedidoProps) {
  if (itens.length === 0) {
    return (
      <p className="lista-itens-pedido__vazio" data-testid="estado-vazio-itens-pedido">
        Nenhum item no pedido.
      </p>
    )
  }

  if (variant === 'tabela') {
    return (
      <ul className="lista-itens-pedido lista-itens-pedido--tabela" data-testid="lista-itens-pedido">
        {itens.map((item) => (
          <li key={item.id} className="lista-itens-pedido__linha" data-testid="item-pedido">
            <div className="lista-itens-pedido__quantidade">
              <button
                type="button"
                data-testid="botao-diminuir-quantidade"
                onClick={() => void onAlterarQuantidade(item.id, item.quantidade - 1)}
                disabled={item.quantidade <= 1}
                aria-label="Diminuir quantidade"
              >
                -
              </button>
              <span data-testid="item-pedido-quantidade">{item.quantidade}</span>
              <button
                type="button"
                data-testid="botao-aumentar-quantidade"
                onClick={() => void onAlterarQuantidade(item.id, item.quantidade + 1)}
                aria-label="Aumentar quantidade"
              >
                +
              </button>
            </div>
            <div className="lista-itens-pedido__produto">
              <strong data-testid="item-pedido-nome">{item.produtoNome}</strong>
              {item.observacao ? <p data-testid="item-pedido-obs">{item.observacao}</p> : null}
            </div>
            <span data-testid="item-pedido-preco-unitario">
              {formatarMoeda(item.precoUnitarioCentavos)}
            </span>
            <div className="lista-itens-pedido__total-acoes">
              <span data-testid="item-pedido-total">{formatarMoeda(item.totalCentavos)}</span>
              <button
                type="button"
                data-testid="botao-remover-item"
                onClick={() => void onRemover(item.id)}
                aria-label="Remover item"
              >
                x
              </button>
            </div>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ul className="lista-itens-pedido" data-testid="lista-itens-pedido">
      {itens.map((item) => (
        <li key={item.id} className="lista-itens-pedido__item" data-testid="item-pedido">
          <div>
            <strong data-testid="item-pedido-nome">{item.produtoNome}</strong>
            {item.observacao ? <p data-testid="item-pedido-obs">{item.observacao}</p> : null}
          </div>
          <span data-testid="item-pedido-preco-unitario">
            {formatarMoeda(item.precoUnitarioCentavos)}
          </span>
          <div className="lista-itens-pedido__quantidade">
            <button
              type="button"
              data-testid="botao-diminuir-quantidade"
              onClick={() => void onAlterarQuantidade(item.id, item.quantidade - 1)}
              disabled={item.quantidade <= 1}
            >
              -
            </button>
            <span data-testid="item-pedido-quantidade">{item.quantidade}</span>
            <button
              type="button"
              data-testid="botao-aumentar-quantidade"
              onClick={() => void onAlterarQuantidade(item.id, item.quantidade + 1)}
            >
              +
            </button>
          </div>
          <span data-testid="item-pedido-total">{formatarMoeda(item.totalCentavos)}</span>
          <button
            type="button"
            data-testid="botao-remover-item"
            onClick={() => void onRemover(item.id)}
          >
            Remover
          </button>
        </li>
      ))}
    </ul>
  )
}
