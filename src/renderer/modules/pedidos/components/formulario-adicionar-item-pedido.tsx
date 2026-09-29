import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react'
import type { CategoriaProduto } from '@shared/types/categoria-produto'
import type { ProdutoComCategoria } from '@shared/types/produto'
import {
  rotuloRegraPrecificacaoPizza,
  type PizzaCategoria,
  type PizzaSaborComCategoria,
  type PizzaTamanho,
  type PreviewPizza,
} from '@shared/types/pizza'
import { formatarMoeda } from '@shared/utils/moeda'
import { extrairMensagemErroIpc } from '@shared/utils/erro-ipc'

type ModoCatalogo = 'categorias' | 'produto' | 'pizza'

interface FormularioAdicionarItemPedidoProps {
  produtos: ProdutoComCategoria[]
  categoriasProduto: CategoriaProduto[]
  onAdicionarProduto: (
    produtoId: string,
    quantidade: number,
    observacao?: string,
  ) => Promise<boolean>
  onAdicionarPizza: (
    tamanhoId: string,
    saborIds: string[],
    observacao?: string,
  ) => Promise<boolean>
}

function normalizarBusca(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

/** Limite de produtos soltos na busca global para nao poluir a grade. */
const LIMITE_PRODUTOS_BUSCA_GLOBAL = 24

export function FormularioAdicionarItemPedido({
  produtos,
  categoriasProduto,
  onAdicionarProduto,
  onAdicionarPizza,
}: FormularioAdicionarItemPedidoProps) {
  const [modo, setModo] = useState<ModoCatalogo>('categorias')
  const [categoriaId, setCategoriaId] = useState('')
  const [termo, setTermo] = useState('')
  const [categoriasPizza, setCategoriasPizza] = useState<PizzaCategoria[]>([])
  const [tamanhos, setTamanhos] = useState<PizzaTamanho[]>([])
  const [carregandoPizza, setCarregandoPizza] = useState(true)
  const [erroCatalogo, setErroCatalogo] = useState<string | null>(null)

  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [erroValidacao, setErroValidacao] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let cancelado = false

    async function carregarPizzas() {
      setCarregandoPizza(true)
      try {
        const [listaCategorias, listaTamanhos] = await Promise.all([
          window.pdv.pizzas.listarCategorias({ apenasAtivas: true }),
          window.pdv.pizzas.listarTamanhos({ apenasAtivas: true }),
        ])
        if (cancelado) return
        setCategoriasPizza(listaCategorias)
        setTamanhos(listaTamanhos)
        setErroCatalogo(null)
      } catch (causa) {
        if (!cancelado) {
          setErroCatalogo(extrairMensagemErroIpc(causa))
        }
      } finally {
        if (!cancelado) setCarregandoPizza(false)
      }
    }

    void carregarPizzas()
    const cancelar = window.pdv.sync.onCatalogoAtualizado(() => {
      void carregarPizzas()
    })
    return () => {
      cancelado = true
      cancelar()
    }
  }, [])

  const termoNormalizado = normalizarBusca(termo)

  const categoriaSelecionada = useMemo(
    () => categoriasProduto.find((categoria) => categoria.id === categoriaId) ?? null,
    [categoriaId, categoriasProduto],
  )

  const produtoSelecionado = useMemo(
    () => produtos.find((produto) => produto.id === produtoSelecionadoId) ?? null,
    [produtoSelecionadoId, produtos],
  )

  const categoriasVisiveis = useMemo(() => {
    if (modo !== 'categorias') return []
    if (!termoNormalizado) return categoriasProduto
    return categoriasProduto.filter((categoria) =>
      normalizarBusca(categoria.nome).includes(termoNormalizado),
    )
  }, [categoriasProduto, modo, termoNormalizado])

  const mostrarTilePizzas =
    modo === 'categorias' &&
    categoriasPizza.length > 0 &&
    (!termoNormalizado ||
      'pizzas'.includes(termoNormalizado) ||
      termoNormalizado.includes('pizza'))

  const produtosVisiveis = useMemo(() => {
    if (modo === 'produto') {
      return produtos.filter((produto) => {
        if (produto.categoriaId !== categoriaId) return false
        if (!termoNormalizado) return true
        return normalizarBusca(produto.nome).includes(termoNormalizado)
      })
    }
    // Na visao de categorias a busca ja chega direto no produto.
    if (modo === 'categorias' && termoNormalizado) {
      return produtos
        .filter((produto) => normalizarBusca(produto.nome).includes(termoNormalizado))
        .slice(0, LIMITE_PRODUTOS_BUSCA_GLOBAL)
    }
    return []
  }, [categoriaId, modo, produtos, termoNormalizado])

  function abrirCategoria(id: string) {
    setCategoriaId(id)
    setModo('produto')
    setTermo('')
    setProdutoSelecionadoId('')
    setQuantidade('1')
    setErroValidacao(null)
  }

  function abrirPizzas() {
    setModo('pizza')
    setTermo('')
    setProdutoSelecionadoId('')
    setErroValidacao(null)
  }

  function voltarParaCategorias() {
    setModo('categorias')
    setCategoriaId('')
    setTermo('')
    setProdutoSelecionadoId('')
    setQuantidade('1')
    setErroValidacao(null)
  }

  function selecionarProduto(produto: ProdutoComCategoria) {
    setErroValidacao(null)
    // Tocar de novo no mesmo produto soma mais um — agiliza itens repetidos.
    if (produtoSelecionadoId === produto.id) {
      setQuantidade((atual) => {
        const numero = Number(atual)
        return String((Number.isInteger(numero) && numero > 0 ? numero : 0) + 1)
      })
      return
    }
    setProdutoSelecionadoId(produto.id)
    setQuantidade('1')
  }

  function handleTecladoBusca(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'Escape') {
      if (modo === 'categorias') {
        setTermo('')
      } else {
        voltarParaCategorias()
      }
      return
    }
    if (evento.key !== 'Enter') return

    const semCategoriaParaAbrir =
      categoriasVisiveis.length === 0 && !mostrarTilePizzas
    if (produtosVisiveis.length === 1 && (modo === 'produto' || semCategoriaParaAbrir)) {
      evento.preventDefault()
      selecionarProduto(produtosVisiveis[0]!)
      return
    }
    if (
      modo === 'categorias' &&
      categoriasVisiveis.length === 1 &&
      produtosVisiveis.length === 0 &&
      !mostrarTilePizzas
    ) {
      evento.preventDefault()
      abrirCategoria(categoriasVisiveis[0]!.id)
    }
  }

  async function handleAdicionarProduto(evento: FormEvent<HTMLFormElement>) {
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
      const ok = await onAdicionarProduto(produtoSelecionadoId, quantidadeNumero)
      if (ok) {
        setProdutoSelecionadoId('')
        setQuantidade('1')
      }
    } finally {
      setEnviando(false)
    }
  }

  const semCategorias = categoriasProduto.length === 0 && categoriasPizza.length === 0

  return (
    <section
      className="busca-produtos-pedido busca-produtos-pedido--compacto"
      data-testid="busca-produtos-pedido"
      data-modo={modo}
    >
      <div className="formulario-adicionar-item">
        {modo !== 'categorias' ? (
          <div className="seletor-item__cabecalho">
            <button
              type="button"
              className="seletor-item__voltar"
              data-testid="botao-voltar-categorias"
              onClick={voltarParaCategorias}
            >
              ← Categorias
            </button>
            <span className="seletor-item__cabecalho-titulo">
              {modo === 'pizza' ? 'Pizzas' : (categoriaSelecionada?.nome ?? '')}
            </span>
          </div>
        ) : null}

        {modo !== 'pizza' ? (
          <div className="busca-produtos-pedido__campo busca-produtos-pedido__combobox">
            <label htmlFor="busca-item-pedido" className="visually-hidden">
              {modo === 'produto' ? 'Buscar produto' : 'Buscar categoria ou produto'}
            </label>
            <div className="busca-produtos-pedido__combobox-controle">
              <input
                id="busca-item-pedido"
                data-testid={
                  modo === 'produto'
                    ? 'campo-produto-pedido'
                    : 'campo-categoria-produto-pedido'
                }
                type="text"
                autoComplete="off"
                value={termo}
                placeholder={
                  modo === 'produto'
                    ? `Buscar em ${categoriaSelecionada?.nome ?? 'produtos'}...`
                    : 'Buscar categoria ou produto...'
                }
                onChange={(evento) => setTermo(evento.target.value)}
                onKeyDown={handleTecladoBusca}
                disabled={enviando || carregandoPizza}
              />
            </div>
          </div>
        ) : null}

        {erroCatalogo ? (
          <p className="busca-produtos-pedido__erro" role="alert">
            {erroCatalogo}
          </p>
        ) : null}

        {modo === 'categorias' ? (
          <>
            {!termoNormalizado ? (
              <p
                className="formulario-adicionar-item__dica"
                data-testid="dica-selecionar-categoria"
              >
                Toque em uma categoria ou busque direto pelo produto.
              </p>
            ) : null}

            {categoriasVisiveis.length === 0 &&
            !mostrarTilePizzas &&
            produtosVisiveis.length === 0 ? (
              <p className="formulario-adicionar-item__dica">
                Nada encontrado para essa busca.
              </p>
            ) : (
              <div className="seletor-item__grade" data-testid="grade-categorias">
                {categoriasVisiveis.map((categoria) => (
                  <button
                    key={categoria.id}
                    type="button"
                    className="seletor-item__tile"
                    data-testid="opcao-categoria-pedido"
                    onClick={() => abrirCategoria(categoria.id)}
                  >
                    <span className="seletor-item__tile-nome">{categoria.nome}</span>
                  </button>
                ))}
                {mostrarTilePizzas ? (
                  <button
                    type="button"
                    className="seletor-item__tile seletor-item__tile--pizza"
                    data-testid="opcao-categoria-pedido"
                    onClick={abrirPizzas}
                  >
                    <span className="seletor-item__tile-nome">Pizzas</span>
                  </button>
                ) : null}
                {produtosVisiveis.map((produto) => (
                  <button
                    key={produto.id}
                    type="button"
                    className="seletor-item__tile"
                    data-testid="opcao-produto-pedido"
                    aria-pressed={produto.id === produtoSelecionadoId}
                    onClick={() => selecionarProduto(produto)}
                  >
                    <span className="seletor-item__tile-nome">{produto.nome}</span>
                    <span className="seletor-item__tile-meta">
                      {produto.categoriaNome} · {formatarMoeda(produto.precoCentavos)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : null}

        {modo === 'produto' ? (
          produtosVisiveis.length === 0 ? (
            <p className="formulario-adicionar-item__dica">
              Nenhum produto nesta categoria.
            </p>
          ) : (
            <div className="seletor-item__grade" data-testid="grade-produtos">
              {produtosVisiveis.map((produto) => (
                <button
                  key={produto.id}
                  type="button"
                  className="seletor-item__tile"
                  data-testid="opcao-produto-pedido"
                  aria-pressed={produto.id === produtoSelecionadoId}
                  onClick={() => selecionarProduto(produto)}
                >
                  <span className="seletor-item__tile-nome">{produto.nome}</span>
                  <span className="seletor-item__tile-meta">
                    {formatarMoeda(produto.precoCentavos)}
                  </span>
                </button>
              ))}
            </div>
          )
        ) : null}

        {modo === 'pizza' ? (
          <FormularioPizzaRapido tamanhos={tamanhos} onAdicionar={onAdicionarPizza} />
        ) : null}

        {produtoSelecionado && modo !== 'pizza' ? (
          <form
            className="seletor-item__barra-add"
            data-testid="formulario-adicionar-item"
            onSubmit={(evento) => void handleAdicionarProduto(evento)}
          >
            <div className="seletor-item__barra-add-info">
              <strong>{produtoSelecionado.nome}</strong>
              <span>{formatarMoeda(produtoSelecionado.precoCentavos)}</span>
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
            <button
              type="submit"
              className="busca-produtos-pedido__botao-adicionar"
              data-testid="botao-adicionar-item"
              disabled={enviando}
            >
              Adicionar
            </button>
          </form>
        ) : null}

        {erroValidacao ? (
          <p className="busca-produtos-pedido__erro" role="alert">
            {erroValidacao}
          </p>
        ) : null}

        {semCategorias && !carregandoPizza ? (
          <p className="busca-produtos-pedido__erro" role="alert">
            Nenhuma categoria disponivel no cardapio.
          </p>
        ) : null}
      </div>
    </section>
  )
}

function FormularioPizzaRapido({
  tamanhos,
  onAdicionar,
}: {
  tamanhos: PizzaTamanho[]
  onAdicionar: (
    tamanhoId: string,
    saborIds: string[],
    observacao?: string,
  ) => Promise<boolean>
}) {
  const [saboresComCategoria, setSaboresComCategoria] = useState<PizzaSaborComCategoria[]>([])
  const [tamanhoId, setTamanhoId] = useState(tamanhos[0]?.id ?? '')
  const [saborIds, setSaborIds] = useState<string[]>([])
  const [termoSabor, setTermoSabor] = useState('')
  const [observacao, setObservacao] = useState('')
  const [preview, setPreview] = useState<PreviewPizza | null>(null)
  const [erroPreview, setErroPreview] = useState<string | null>(null)
  const [erroValidacao, setErroValidacao] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [carregandoSabores, setCarregandoSabores] = useState(false)

  const tamanhoSelecionado = useMemo(
    () => tamanhos.find((tamanho) => tamanho.id === tamanhoId) ?? null,
    [tamanhoId, tamanhos],
  )

  const gruposSabores = useMemo(() => {
    const termoNormalizado = normalizarBusca(termoSabor)
    const grupos = new Map<
      string,
      { categoriaNome: string; sabores: PizzaSaborComCategoria[] }
    >()

    for (const sabor of saboresComCategoria) {
      if (
        termoNormalizado &&
        !normalizarBusca(sabor.nome).includes(termoNormalizado) &&
        !normalizarBusca(sabor.categoriaNome).includes(termoNormalizado)
      ) {
        continue
      }

      const existente = grupos.get(sabor.categoriaId)
      if (!existente) {
        grupos.set(sabor.categoriaId, {
          categoriaNome: sabor.categoriaNome,
          sabores: [sabor],
        })
        continue
      }

      if (!existente.sabores.some((item) => item.id === sabor.id)) {
        existente.sabores.push(sabor)
      }
    }

    return [...grupos.values()]
  }, [saboresComCategoria, termoSabor])

  useEffect(() => {
    if (!tamanhoId && tamanhos[0]) {
      setTamanhoId(tamanhos[0].id)
    }
  }, [tamanhoId, tamanhos])

  useEffect(() => {
    let cancelado = false

    async function carregarSabores() {
      setCarregandoSabores(true)
      try {
        const lista = await window.pdv.pizzas.listarSaboresComCategorias()
        if (!cancelado) {
          setSaboresComCategoria(lista)
          setErroPreview(null)
        }
      } catch (causa) {
        if (!cancelado) {
          setErroPreview(extrairMensagemErroIpc(causa))
        }
      } finally {
        if (!cancelado) setCarregandoSabores(false)
      }
    }

    void carregarSabores()
    return () => {
      cancelado = true
    }
  }, [])

  useEffect(() => {
    let cancelado = false

    async function atualizarPreview() {
      if (!tamanhoId || saborIds.length === 0) {
        setPreview(null)
        setErroPreview(null)
        return
      }
      try {
        const resultado = await window.pdv.pizzas.montarPreview({
          tamanhoId,
          saborIds,
        })
        if (!cancelado) {
          setPreview(resultado)
          setErroPreview(null)
        }
      } catch (causa) {
        if (!cancelado) {
          setPreview(null)
          setErroPreview(extrairMensagemErroIpc(causa))
        }
      }
    }

    void atualizarPreview()
    return () => {
      cancelado = true
    }
  }, [tamanhoId, saborIds])

  function alternarSabor(saborId: string) {
    setErroValidacao(null)
    setSaborIds((atual) => {
      if (atual.includes(saborId)) {
        return atual.filter((id) => id !== saborId)
      }
      const limite = tamanhoSelecionado?.maximoSabores ?? 1
      if (atual.length >= limite) {
        setErroValidacao(`Este tamanho permite no maximo ${limite} sabor(es).`)
        return atual
      }
      return [...atual, saborId]
    })
  }

  function handleTecladoSabor(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'Escape') {
      setTermoSabor('')
      return
    }
    if (evento.key !== 'Enter') return
    const visiveis = gruposSabores.flatMap((grupo) => grupo.sabores)
    if (visiveis.length === 1) {
      evento.preventDefault()
      alternarSabor(visiveis[0]!.id)
    }
  }

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErroValidacao(null)

    if (!tamanhoId) {
      setErroValidacao('Selecione um tamanho.')
      return
    }
    if (saborIds.length === 0) {
      setErroValidacao('Selecione ao menos um sabor.')
      return
    }

    setEnviando(true)
    try {
      const ok = await onAdicionar(tamanhoId, saborIds, observacao.trim() || undefined)
      if (ok) {
        setSaborIds([])
        setObservacao('')
        setTermoSabor('')
        setPreview(null)
      }
    } finally {
      setEnviando(false)
    }
  }

  const maximoSabores = tamanhoSelecionado?.maximoSabores ?? 0
  const regraPreview = preview?.categoria.regraPrecificacao

  return (
    <form
      className="busca-produtos-pedido__formulario busca-produtos-pedido__formulario--pizza"
      data-testid="formulario-adicionar-pizza"
      onSubmit={(evento) => void handleSubmit(evento)}
    >
      <div
        className="seletor-item__grade seletor-item__grade--tamanhos"
        role="group"
        aria-label="Tamanho"
        data-testid="campo-pizza-tamanho"
      >
        {tamanhos.map((tamanho) => (
          <button
            key={tamanho.id}
            type="button"
            className="seletor-item__tile"
            data-testid="opcao-pizza-tamanho"
            aria-pressed={tamanho.id === tamanhoId}
            disabled={enviando}
            onClick={() => {
              setTamanhoId(tamanho.id)
              setSaborIds([])
              setErroValidacao(null)
            }}
          >
            <span className="seletor-item__tile-nome">
              {tamanho.nome} ({tamanho.sigla})
            </span>
            <span className="seletor-item__tile-meta">
              ate {tamanho.maximoSabores} sabor(es)
            </span>
          </button>
        ))}
      </div>

      <p className="formulario-adicionar-item__meta" data-testid="pizza-limite-sabores">
        {tamanhoSelecionado
          ? `Pizza ${tamanhoSelecionado.sigla} — ate ${maximoSabores} sabores (pode misturar categorias) — ${saborIds.length} selecionado(s)`
          : 'Selecione o tamanho'}
      </p>

      <div className="busca-produtos-pedido__campo busca-produtos-pedido__combobox formulario-adicionar-item__campo-largo">
        <label htmlFor="busca-sabor-pizza" className="visually-hidden">
          Buscar sabor
        </label>
        <div className="busca-produtos-pedido__combobox-controle">
          <input
            id="busca-sabor-pizza"
            data-testid="campo-pizza-sabor-busca"
            type="text"
            autoComplete="off"
            value={termoSabor}
            placeholder="Buscar sabor..."
            onChange={(evento) => setTermoSabor(evento.target.value)}
            onKeyDown={handleTecladoSabor}
            disabled={enviando || carregandoSabores}
          />
        </div>
      </div>

      <fieldset
        className="formulario-adicionar-item__sabores"
        disabled={enviando || carregandoSabores}
      >
        <legend>Sabores</legend>
        {carregandoSabores ? (
          <p className="formulario-adicionar-item__meta">Carregando...</p>
        ) : gruposSabores.length === 0 ? (
          <p className="formulario-adicionar-item__meta">
            {termoSabor.trim()
              ? 'Nenhum sabor encontrado para essa busca.'
              : 'Nenhum sabor disponivel.'}
          </p>
        ) : (
          <div className="formulario-adicionar-item__sabores-lista">
            {gruposSabores.map((grupo) => (
              <section key={grupo.categoriaNome} className="formulario-adicionar-item__grupo-sabor">
                <h4 className="formulario-adicionar-item__grupo-sabor-titulo">
                  {grupo.categoriaNome}
                </h4>
                <div className="seletor-item__grade seletor-item__grade--sabores">
                  {grupo.sabores.map((sabor) => (
                    <button
                      key={`${grupo.categoriaNome}:${sabor.id}`}
                      type="button"
                      className="seletor-item__tile"
                      data-testid="opcao-pizza-sabor"
                      aria-pressed={saborIds.includes(sabor.id)}
                      onClick={() => alternarSabor(sabor.id)}
                    >
                      <span className="seletor-item__tile-nome">{sabor.nome}</span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </fieldset>

      <label
        className="busca-produtos-pedido__campo formulario-adicionar-item__campo-largo"
        htmlFor="observacao-pizza"
      >
        Obs.
        <input
          id="observacao-pizza"
          data-testid="campo-observacao-pizza"
          type="text"
          value={observacao}
          onChange={(evento) => setObservacao(evento.target.value)}
          disabled={enviando}
          placeholder="Opcional"
        />
      </label>

      <p
        className="formulario-adicionar-item__meta"
        data-testid="pizza-regra-preco"
      >
        {regraPreview
          ? `Preço: ${rotuloRegraPrecificacaoPizza(regraPreview).toLowerCase()}`
          : ''}
      </p>

      <p
        className="formulario-adicionar-item__preco"
        data-testid="preview-pizza-preco"
        data-regra={regraPreview}
      >
        {preview ? formatarMoeda(preview.valorFinalCentavos) : '—'}
      </p>

      {erroPreview ? (
        <p className="busca-produtos-pedido__erro" role="alert">
          {erroPreview}
        </p>
      ) : null}
      {erroValidacao ? (
        <p className="busca-produtos-pedido__erro" role="alert">
          {erroValidacao}
        </p>
      ) : null}

      <button
        type="submit"
        className="busca-produtos-pedido__botao-adicionar"
        data-testid="botao-confirmar-pizza"
        disabled={enviando || !preview}
      >
        Adicionar
      </button>
    </form>
  )
}
