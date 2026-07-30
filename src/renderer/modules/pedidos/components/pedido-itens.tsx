import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type { CategoriaProduto } from '@shared/types/categoria-produto'
import type { PedidoItem } from '@shared/types/pedido'
import type { ProdutoComCategoria } from '@shared/types/produto'
import { formatarMoeda } from '@shared/utils/moeda'

interface BuscaProdutosPedidoProps {
  produtos: ProdutoComCategoria[]
  categorias: CategoriaProduto[]
  onAdicionar: (produtoId: string, quantidade: number, observacao?: string) => Promise<boolean>
  compacto?: boolean
}

export function BuscaProdutosPedido({
  produtos,
  categorias,
  onAdicionar,
  compacto = false,
}: BuscaProdutosPedidoProps) {
  const [categoriaId, setCategoriaId] = useState('')
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState('')
  const [termo, setTermo] = useState('')
  const [listaAberta, setListaAberta] = useState(false)
  const [quantidade, setQuantidade] = useState('1')
  const [observacao, setObservacao] = useState('')
  const [erroValidacao, setErroValidacao] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const comboboxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const produtoSelecionado = useMemo(
    () => produtos.find((produto) => produto.id === produtoSelecionadoId) ?? null,
    [produtoSelecionadoId, produtos],
  )

  const produtosFiltrados = useMemo(() => {
    const termoNormalizado = termo.trim().toLowerCase()

    return produtos.filter((produto) => {
      if (categoriaId && produto.categoriaId !== categoriaId) {
        return false
      }

      if (!termoNormalizado) {
        return true
      }

      return (
        produto.nome.toLowerCase().includes(termoNormalizado) ||
        produto.categoriaNome.toLowerCase().includes(termoNormalizado)
      )
    })
  }, [categoriaId, produtos, termo])

  useEffect(() => {
    function fecharAoClicarFora(evento: MouseEvent) {
      if (!comboboxRef.current?.contains(evento.target as Node)) {
        setListaAberta(false)
        if (produtoSelecionado) {
          setTermo('')
        }
      }
    }

    document.addEventListener('mousedown', fecharAoClicarFora)
    return () => document.removeEventListener('mousedown', fecharAoClicarFora)
  }, [produtoSelecionado])

  function abrirLista() {
    setListaAberta(true)
    setTermo('')
  }

  function selecionarProduto(produto: ProdutoComCategoria) {
    setProdutoSelecionadoId(produto.id)
    setTermo('')
    setListaAberta(false)
    setErroValidacao(null)
  }

  function handleTeclado(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'Escape') {
      setListaAberta(false)
      if (produtoSelecionado) {
        setTermo('')
      }
      return
    }

    if (evento.key === 'Enter' && listaAberta && produtosFiltrados.length === 1) {
      evento.preventDefault()
      selecionarProduto(produtosFiltrados[0]!)
    }
  }

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErroValidacao(null)

    const quantidadeNumero = Number(quantidade)

    if (!produtoSelecionadoId) {
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
        produtoSelecionadoId,
        quantidadeNumero,
        observacao.trim() || undefined,
      )

      if (sucesso) {
        setObservacao('')
        setQuantidade('1')
        setProdutoSelecionadoId('')
        setTermo('')
      }
    } finally {
      setEnviando(false)
    }
  }

  const valorExibido =
    listaAberta || !produtoSelecionado ? termo : `${produtoSelecionado.nome} — ${formatarMoeda(produtoSelecionado.precoCentavos)}`

  return (
    <section
      className={`busca-produtos-pedido${compacto ? ' busca-produtos-pedido--compacto' : ''}`}
      data-testid="busca-produtos-pedido"
    >
      <form
        className="busca-produtos-pedido__formulario"
        data-testid="formulario-adicionar-item"
        onSubmit={(evento) => void handleSubmit(evento)}
      >
        <label className="busca-produtos-pedido__campo" htmlFor="categoria-produto-pedido">
          Categoria
          <select
            id="categoria-produto-pedido"
            data-testid="campo-categoria-produto-pedido"
            value={categoriaId}
            onChange={(evento) => {
              setCategoriaId(evento.target.value)
              setProdutoSelecionadoId('')
              setTermo('')
            }}
            disabled={enviando}
          >
            <option value="">Todas</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
        </label>

        <div className="busca-produtos-pedido__campo busca-produtos-pedido__combobox" ref={comboboxRef}>
          <label htmlFor="produto-pedido">Produto</label>
          <div className="busca-produtos-pedido__combobox-controle">
            <input
              id="produto-pedido"
              ref={inputRef}
              data-testid="campo-produto-pedido"
              type="text"
              role="combobox"
              aria-expanded={listaAberta}
              aria-controls="lista-produtos-pedido"
              aria-autocomplete="list"
              autoComplete="off"
              value={valorExibido}
              placeholder="Digite para buscar..."
              onFocus={abrirLista}
              onClick={abrirLista}
              onChange={(evento) => {
                setTermo(evento.target.value)
                setProdutoSelecionadoId('')
                setListaAberta(true)
              }}
              onKeyDown={handleTeclado}
              disabled={enviando || produtos.length === 0}
            />

            {listaAberta ? (
              <ul
                id="lista-produtos-pedido"
                className="busca-produtos-pedido__opcoes"
                data-testid="lista-opcoes-produto-pedido"
                role="listbox"
              >
                {produtosFiltrados.length === 0 ? (
                  <li className="busca-produtos-pedido__opcao busca-produtos-pedido__opcao--vazia">
                    Nenhum produto encontrado.
                  </li>
                ) : (
                  produtosFiltrados.map((produto) => (
                    <li key={produto.id}>
                      <button
                        type="button"
                        className="busca-produtos-pedido__opcao"
                        data-testid="opcao-produto-pedido"
                        role="option"
                        aria-selected={produto.id === produtoSelecionadoId}
                        onMouseDown={(evento) => evento.preventDefault()}
                        onClick={() => selecionarProduto(produto)}
                      >
                        <span>{produto.nome}</span>
                        <span className="busca-produtos-pedido__opcao-meta">
                          {produto.categoriaNome} · {formatarMoeda(produto.precoCentavos)}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            ) : null}
          </div>
        </div>

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
                aria-label="Cancelar item"
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
