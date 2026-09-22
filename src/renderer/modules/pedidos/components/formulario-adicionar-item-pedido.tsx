import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type { CategoriaProduto } from '@shared/types/categoria-produto'
import type { CategoriaCatalogo } from '@shared/types/categoria-catalogo'
import type { ProdutoComCategoria } from '@shared/types/produto'
import {
  REGRA_PRECIFICACAO_PIZZA,
  type PizzaSaborComCategoria,
  type PizzaTamanho,
  type PreviewPizza,
} from '@shared/types/pizza'
import { formatarMoeda } from '@shared/utils/moeda'
import { extrairMensagemErroIpc } from '@shared/utils/erro-ipc'

type ModoCatalogo = 'produto' | 'pizza' | null

type OpcaoCategoria =
  | { tipo: 'produto'; id: string; nome: string }
  | { tipo: 'pizza'; id: string; nome: string }

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

function parseOpcaoCategoria(valor: string): { tipo: ModoCatalogo; id: string } {
  if (!valor) return { tipo: null, id: '' }
  if (valor.startsWith('pizza:')) {
    return { tipo: 'pizza', id: valor.slice('pizza:'.length) }
  }
  if (valor.startsWith('produto:')) {
    return { tipo: 'produto', id: valor.slice('produto:'.length) }
  }
  return { tipo: 'produto', id: valor }
}

function formatarValorOpcaoCategoria(opcao: OpcaoCategoria): string {
  return `${opcao.tipo}:${opcao.id}`
}

function catalogoParaOpcao(item: CategoriaCatalogo): OpcaoCategoria {
  return {
    tipo: item.tipo,
    id: item.id,
    nome: item.nome,
  }
}

/**
 * O seletor de sabores ja agrupa por categoria internamente, entao o
 * combobox de categoria expoe uma unica entrada "Pizzas".
 */
const OPCAO_PIZZAS: OpcaoCategoria = { tipo: 'pizza', id: 'todas', nome: 'Pizzas' }

function consolidarOpcoesCatalogo(itens: CategoriaCatalogo[]): OpcaoCategoria[] {
  const produtos = itens
    .filter((item) => item.tipo === 'produto')
    .map(catalogoParaOpcao)
  return itens.some((item) => item.tipo === 'pizza')
    ? [...produtos, OPCAO_PIZZAS]
    : produtos
}

function ComboboxBuscaCategoria({
  selecaoCategoria,
  onSelecionar,
  opcoesFallback,
  disabled,
}: {
  selecaoCategoria: string
  onSelecionar: (valor: string) => void
  opcoesFallback: OpcaoCategoria[]
  disabled?: boolean
}) {
  const [termo, setTermo] = useState('')
  const [listaAberta, setListaAberta] = useState(false)
  const [resultados, setResultados] = useState<CategoriaCatalogo[]>([])
  const [carregando, setCarregando] = useState(false)
  const [geracaoCatalogo, setGeracaoCatalogo] = useState(0)
  const comboboxRef = useRef<HTMLDivElement>(null)

  const opcaoSelecionada = useMemo(() => {
    const parsed = parseOpcaoCategoria(selecaoCategoria)
    if (!parsed.tipo) return null
    const encontrada = resultados.find(
      (item) => item.tipo === parsed.tipo && item.id === parsed.id,
    )
    if (encontrada) return catalogoParaOpcao(encontrada)
    return (
      opcoesFallback.find(
        (opcao) => formatarValorOpcaoCategoria(opcao) === selecaoCategoria,
      ) ?? null
    )
  }, [opcoesFallback, resultados, selecaoCategoria])

  useEffect(() => {
    let cancelado = false

    async function buscarCategorias() {
      setCarregando(true)
      try {
        const lista = await window.pdv.catalogo.buscarCategorias({
          termo: termo.trim() || undefined,
        })
        if (!cancelado) {
          setResultados(lista)
        }
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }

    const timer = window.setTimeout(() => {
      void buscarCategorias()
    }, termo.trim() ? 180 : 0)

    return () => {
      cancelado = true
      window.clearTimeout(timer)
    }
  }, [termo, geracaoCatalogo])

  useEffect(() => {
    return window.pdv.sync.onCatalogoAtualizado(() => {
      setGeracaoCatalogo((atual) => atual + 1)
    })
  }, [])

  useEffect(() => {
    function fecharAoClicarFora(evento: MouseEvent) {
      if (!comboboxRef.current?.contains(evento.target as Node)) {
        setListaAberta(false)
        if (opcaoSelecionada) setTermo('')
      }
    }

    document.addEventListener('mousedown', fecharAoClicarFora)
    return () => document.removeEventListener('mousedown', fecharAoClicarFora)
  }, [opcaoSelecionada])

  const opcoesVisiveis = useMemo(() => {
    const termoNormalizado = termo.trim().toLowerCase()

    // Sem termo: lista completa (resultados da busca inicial ou fallback).
    if (!termoNormalizado) {
      return resultados.length > 0 ? consolidarOpcoesCatalogo(resultados) : opcoesFallback
    }

    // Com termo: apenas o que a busca retornou — nunca a lista inteira,
    // senao parece que o filtro nao funciona.
    let consolidadas = consolidarOpcoesCatalogo(resultados)

    // A busca no servidor cobre nomes de categoria; "Pizzas" e sintetica,
    // entao tratamos o termo aqui (ex.: digitar "piz" ou "pizza").
    const temPizzas = opcoesFallback.some((opcao) => opcao.tipo === 'pizza')
    if (
      temPizzas &&
      !consolidadas.some((opcao) => opcao.tipo === 'pizza') &&
      ('pizzas'.includes(termoNormalizado) || termoNormalizado.includes('pizza'))
    ) {
      consolidadas = [...consolidadas, OPCAO_PIZZAS]
    }

    return consolidadas
  }, [opcoesFallback, resultados, termo])

  const opcoesAgrupadas = useMemo(() => {
    const produtos = opcoesVisiveis.filter((opcao) => opcao.tipo === 'produto')
    const pizzas = opcoesVisiveis.filter((opcao) => opcao.tipo === 'pizza')
    return { produtos, pizzas }
  }, [opcoesVisiveis])

  function selecionarOpcao(opcao: OpcaoCategoria) {
    onSelecionar(formatarValorOpcaoCategoria(opcao))
    setTermo('')
    setListaAberta(false)
  }

  function handleTeclado(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'Escape') {
      setListaAberta(false)
      if (opcaoSelecionada) setTermo('')
      return
    }

    const todas = [...opcoesAgrupadas.produtos, ...opcoesAgrupadas.pizzas]
    if (evento.key === 'Enter' && listaAberta && todas.length === 1) {
      evento.preventDefault()
      selecionarOpcao(todas[0]!)
    }
  }

  const valorExibido =
    listaAberta || !opcaoSelecionada ? termo : opcaoSelecionada.nome

  return (
    <div
      className="busca-produtos-pedido__campo busca-produtos-pedido__combobox"
      ref={comboboxRef}
    >
      <label htmlFor="categoria-item-pedido">Categoria</label>
      <div className="busca-produtos-pedido__combobox-controle">
        <input
          id="categoria-item-pedido"
          data-testid="campo-categoria-produto-pedido"
          type="text"
          role="combobox"
          aria-expanded={listaAberta}
          aria-controls="lista-categorias-pedido"
          aria-autocomplete="list"
          autoComplete="off"
          value={valorExibido}
          placeholder="Buscar categoria..."
          onFocus={() => {
            setListaAberta(true)
            setTermo('')
          }}
          onClick={() => {
            setListaAberta(true)
            setTermo('')
          }}
          onChange={(evento) => {
            setTermo(evento.target.value)
            setListaAberta(true)
          }}
          onKeyDown={handleTeclado}
          disabled={disabled || opcoesFallback.length === 0}
        />
        {listaAberta ? (
          <ul
            id="lista-categorias-pedido"
            className="busca-produtos-pedido__opcoes"
            data-testid="lista-opcoes-categoria-pedido"
            role="listbox"
          >
            {carregando ? (
              <li className="busca-produtos-pedido__opcao busca-produtos-pedido__opcao--vazia">
                Buscando...
              </li>
            ) : opcoesVisiveis.length === 0 ? (
              <li className="busca-produtos-pedido__opcao busca-produtos-pedido__opcao--vazia">
                Nenhuma categoria encontrada.
              </li>
            ) : (
              <>
                {opcoesAgrupadas.produtos.length > 0 ? (
                  <li role="presentation" className="busca-produtos-pedido__opcao-grupo">
                    <span>Produtos</span>
                    <ul role="group">
                      {opcoesAgrupadas.produtos.map((opcao) => (
                        <li key={formatarValorOpcaoCategoria(opcao)}>
                          <button
                            type="button"
                            className="busca-produtos-pedido__opcao"
                            data-testid="opcao-categoria-pedido"
                            role="option"
                            aria-selected={
                              formatarValorOpcaoCategoria(opcao) === selecaoCategoria
                            }
                            onMouseDown={(evento) => evento.preventDefault()}
                            onClick={() => selecionarOpcao(opcao)}
                          >
                            {opcao.nome}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                ) : null}
                {opcoesAgrupadas.pizzas.length > 0 ? (
                  <li role="presentation" className="busca-produtos-pedido__opcao-grupo">
                    <span>Pizzas</span>
                    <ul role="group">
                      {opcoesAgrupadas.pizzas.map((opcao) => (
                        <li key={formatarValorOpcaoCategoria(opcao)}>
                          <button
                            type="button"
                            className="busca-produtos-pedido__opcao"
                            data-testid="opcao-categoria-pedido"
                            role="option"
                            aria-selected={
                              formatarValorOpcaoCategoria(opcao) === selecaoCategoria
                            }
                            onMouseDown={(evento) => evento.preventDefault()}
                            onClick={() => selecionarOpcao(opcao)}
                          >
                            {opcao.nome}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                ) : null}
              </>
            )}
          </ul>
        ) : null}
      </div>
    </div>
  )
}

export function FormularioAdicionarItemPedido({
  produtos,
  categoriasProduto,
  onAdicionarProduto,
  onAdicionarPizza,
}: FormularioAdicionarItemPedidoProps) {
  const [categoriasPizza, setCategoriasPizza] = useState<CategoriaCatalogo[]>([])
  const [tamanhos, setTamanhos] = useState<PizzaTamanho[]>([])
  const [selecaoCategoria, setSelecaoCategoria] = useState('')
  const [carregandoPizza, setCarregandoPizza] = useState(true)
  const [erroCatalogo, setErroCatalogo] = useState<string | null>(null)

  const parsed = useMemo(() => parseOpcaoCategoria(selecaoCategoria), [selecaoCategoria])
  const modo: ModoCatalogo = parsed.tipo

  const opcoesCategoria = useMemo((): OpcaoCategoria[] => {
    const produtosOpts: OpcaoCategoria[] = categoriasProduto.map((categoria) => ({
      tipo: 'produto',
      id: categoria.id,
      nome: categoria.nome,
    }))
    return categoriasPizza.length > 0 ? [...produtosOpts, OPCAO_PIZZAS] : produtosOpts
  }, [categoriasProduto, categoriasPizza])

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
        setCategoriasPizza(
          listaCategorias.map((categoria) => ({
            id: categoria.id,
            tipo: 'pizza' as const,
            nome: categoria.nome,
          })),
        )
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

  // Sem auto-selecao: o formulario abre so com a categoria e o operador
  // escolhe; o sub-formulario (produto ou pizza) aparece depois da escolha.

  return (
    <section
      className="busca-produtos-pedido busca-produtos-pedido--compacto"
      data-testid="busca-produtos-pedido"
      data-modo={modo ?? 'vazio'}
    >
      <div className="formulario-adicionar-item">
        <ComboboxBuscaCategoria
          selecaoCategoria={selecaoCategoria}
          onSelecionar={setSelecaoCategoria}
          opcoesFallback={opcoesCategoria}
          disabled={carregandoPizza}
        />

        {erroCatalogo ? (
          <p className="busca-produtos-pedido__erro" role="alert">
            {erroCatalogo}
          </p>
        ) : null}

        {!modo ? (
          <p className="formulario-adicionar-item__dica" data-testid="dica-selecionar-categoria">
            Busque e selecione uma categoria para continuar.
          </p>
        ) : null}

        {modo === 'produto' ? (
          <FormularioProdutoRapido
            produtos={produtos}
            categoriaId={parsed.id}
            onAdicionar={onAdicionarProduto}
          />
        ) : null}

        {modo === 'pizza' ? (
          <FormularioPizzaRapido tamanhos={tamanhos} onAdicionar={onAdicionarPizza} />
        ) : null}

        {opcoesCategoria.length === 0 && !carregandoPizza ? (
          <p className="busca-produtos-pedido__erro" role="alert">
            Nenhuma categoria disponivel no cardapio.
          </p>
        ) : null}
      </div>
    </section>
  )
}

function FormularioProdutoRapido({
  produtos,
  categoriaId,
  onAdicionar,
}: {
  produtos: ProdutoComCategoria[]
  categoriaId: string
  onAdicionar: (
    produtoId: string,
    quantidade: number,
    observacao?: string,
  ) => Promise<boolean>
}) {
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState('')
  const [termo, setTermo] = useState('')
  const [listaAberta, setListaAberta] = useState(false)
  const [quantidade, setQuantidade] = useState('1')
  const [erroValidacao, setErroValidacao] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const comboboxRef = useRef<HTMLDivElement>(null)

  const produtoSelecionado = useMemo(
    () => produtos.find((produto) => produto.id === produtoSelecionadoId) ?? null,
    [produtoSelecionadoId, produtos],
  )

  const produtosFiltrados = useMemo(() => {
    const termoNormalizado = termo.trim().toLowerCase()
    return produtos.filter((produto) => {
      if (categoriaId && produto.categoriaId !== categoriaId) return false
      if (!termoNormalizado) return true
      return (
        produto.nome.toLowerCase().includes(termoNormalizado) ||
        produto.categoriaNome.toLowerCase().includes(termoNormalizado)
      )
    })
  }, [categoriaId, produtos, termo])

  useEffect(() => {
    setProdutoSelecionadoId('')
    setTermo('')
    setErroValidacao(null)
  }, [categoriaId])

  useEffect(() => {
    function fecharAoClicarFora(evento: MouseEvent) {
      if (!comboboxRef.current?.contains(evento.target as Node)) {
        setListaAberta(false)
        if (produtoSelecionado) setTermo('')
      }
    }
    document.addEventListener('mousedown', fecharAoClicarFora)
    return () => document.removeEventListener('mousedown', fecharAoClicarFora)
  }, [produtoSelecionado])

  function selecionarProduto(produto: ProdutoComCategoria) {
    setProdutoSelecionadoId(produto.id)
    setTermo('')
    setListaAberta(false)
    setErroValidacao(null)
  }

  function handleTeclado(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'Escape') {
      setListaAberta(false)
      if (produtoSelecionado) setTermo('')
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
      const ok = await onAdicionar(produtoSelecionadoId, quantidadeNumero)
      if (ok) {
        setQuantidade('1')
        setProdutoSelecionadoId('')
        setTermo('')
      }
    } finally {
      setEnviando(false)
    }
  }

  const valorExibido =
    listaAberta || !produtoSelecionado
      ? termo
      : `${produtoSelecionado.nome} — ${formatarMoeda(produtoSelecionado.precoCentavos)}`

  return (
    <form
      className="busca-produtos-pedido__formulario busca-produtos-pedido__formulario--produto"
      data-testid="formulario-adicionar-item"
      onSubmit={(evento) => void handleSubmit(evento)}
    >
      <div className="busca-produtos-pedido__campo busca-produtos-pedido__combobox" ref={comboboxRef}>
        <label htmlFor="produto-pedido">Produto</label>
        <div className="busca-produtos-pedido__combobox-controle">
          <input
            id="produto-pedido"
            data-testid="campo-produto-pedido"
            type="text"
            role="combobox"
            aria-expanded={listaAberta}
            aria-controls="lista-produtos-pedido"
            aria-autocomplete="list"
            autoComplete="off"
            value={valorExibido}
            placeholder="Buscar produto..."
            onFocus={() => {
              setListaAberta(true)
              setTermo('')
            }}
            onClick={() => {
              setListaAberta(true)
              setTermo('')
            }}
            onChange={(evento) => {
              setTermo(evento.target.value)
              setProdutoSelecionadoId('')
              setListaAberta(true)
            }}
            onKeyDown={handleTeclado}
            disabled={enviando || produtosFiltrados.length === 0}
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
                  Nenhum produto nesta categoria.
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
                        {formatarMoeda(produto.precoCentavos)}
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

      {erroValidacao ? (
        <p className="busca-produtos-pedido__erro" role="alert">
          {erroValidacao}
        </p>
      ) : null}

      <button
        type="submit"
        className="busca-produtos-pedido__botao-adicionar"
        data-testid="botao-adicionar-item"
        disabled={enviando || produtosFiltrados.length === 0}
      >
        Adicionar
      </button>
    </form>
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
    const grupos = new Map<
      string,
      { categoriaNome: string; sabores: PizzaSaborComCategoria[] }
    >()

    for (const sabor of saboresComCategoria) {
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
  }, [saboresComCategoria])

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
      <label
        className="busca-produtos-pedido__campo formulario-adicionar-item__campo-largo"
        htmlFor="pizza-tamanho"
      >
        Tamanho
        <select
          id="pizza-tamanho"
          data-testid="campo-pizza-tamanho"
          value={tamanhoId}
          onChange={(evento) => {
            setTamanhoId(evento.target.value)
            setSaborIds([])
          }}
          disabled={enviando || tamanhos.length === 0}
        >
          {tamanhos.map((tamanho) => (
            <option key={tamanho.id} value={tamanho.id}>
              {tamanho.nome} ({tamanho.sigla})
            </option>
          ))}
        </select>
      </label>

      <p className="formulario-adicionar-item__meta" data-testid="pizza-limite-sabores">
        {tamanhoSelecionado
          ? `Pizza ${tamanhoSelecionado.sigla} — ate ${maximoSabores} sabores (pode misturar categorias)`
          : 'Selecione o tamanho'}
      </p>

      <fieldset
        className="formulario-adicionar-item__sabores"
        disabled={enviando || carregandoSabores}
      >
        <legend>Sabores</legend>
        {carregandoSabores ? (
          <p className="formulario-adicionar-item__meta">Carregando...</p>
        ) : gruposSabores.length === 0 ? (
          <p className="formulario-adicionar-item__meta">Nenhum sabor disponivel.</p>
        ) : (
          <div className="formulario-adicionar-item__sabores-lista">
            {gruposSabores.map((grupo) => (
              <section key={grupo.categoriaNome} className="formulario-adicionar-item__grupo-sabor">
                <h4 className="formulario-adicionar-item__grupo-sabor-titulo">
                  {grupo.categoriaNome}
                </h4>
                <div className="formulario-adicionar-item__grupo-sabor-lista">
                  {grupo.sabores.map((sabor) => (
                    <label key={`${grupo.categoriaNome}:${sabor.id}`} className="formulario-adicionar-item__sabor">
                      <input
                        type="checkbox"
                        data-testid="opcao-pizza-sabor"
                        checked={saborIds.includes(sabor.id)}
                        onChange={() => alternarSabor(sabor.id)}
                      />
                      <span>{sabor.nome}</span>
                    </label>
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
          ? regraPreview === REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR
            ? 'Preco calculado pelo maior sabor'
            : 'Preco calculado pela media dos sabores'
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
