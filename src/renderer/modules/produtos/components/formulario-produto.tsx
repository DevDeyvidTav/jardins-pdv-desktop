import { useEffect, useState, type FormEvent } from 'react'
import type { CategoriaProduto } from '@shared/types/categoria-produto'
import type { ProdutoComCategoria } from '@shared/types/produto'
import { converterReaisParaCentavos, formatarMoeda } from '@shared/utils/moeda'

function formatarCentavosParaInput(centavos: number): string {
  return (centavos / 100).toFixed(2).replace('.', ',')
}

interface FormularioProdutoProps {
  categorias: CategoriaProduto[]
  categoriaPadraoId?: string
  produtoInicial?: ProdutoComCategoria | null
  carregando: boolean
  onSalvar: (
    categoriaId: string,
    nome: string,
    precoCentavos: number,
    descricao?: string,
  ) => Promise<boolean>
  onLimparFeedback: () => void
  onCancelar?: () => void
}

export function FormularioProduto({
  categorias,
  categoriaPadraoId,
  produtoInicial = null,
  carregando: _carregando,
  onSalvar,
  onLimparFeedback,
  onCancelar,
}: FormularioProdutoProps) {
  const editando = produtoInicial !== null
  const categoriasAtivas = categorias.filter((categoria) => categoria.ativo)
  const categoriasDisponiveis =
    editando && produtoInicial
      ? categorias.filter(
          (categoria) =>
            categoria.ativo || categoria.id === produtoInicial.categoriaId,
        )
      : categoriasAtivas

  const [categoriaId, setCategoriaId] = useState(
    produtoInicial?.categoriaId ??
      (categoriaPadraoId && categoriasAtivas.some((c) => c.id === categoriaPadraoId)
        ? categoriaPadraoId
        : (categoriasAtivas[0]?.id ?? '')),
  )
  const [nome, setNome] = useState(produtoInicial?.nome ?? '')
  const [descricao, setDescricao] = useState(produtoInicial?.descricao ?? '')
  const [preco, setPreco] = useState(
    produtoInicial ? formatarCentavosParaInput(produtoInicial.precoCentavos) : '',
  )
  const [erroValidacao, setErroValidacao] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  // Sincroniza o formulario so quando o produto em edicao muda (por id),
  // evitando resetar a digitacao a cada re-render do pai.
  useEffect(() => {
    if (produtoInicial) {
      setCategoriaId(produtoInicial.categoriaId)
      setNome(produtoInicial.nome)
      setDescricao(produtoInicial.descricao ?? '')
      setPreco(formatarCentavosParaInput(produtoInicial.precoCentavos))
      setErroValidacao(null)
      return
    }

    setNome('')
    setDescricao('')
    setPreco('')
    setErroValidacao(null)

    if (
      categoriaPadraoId &&
      categorias.some((categoria) => categoria.ativo && categoria.id === categoriaPadraoId)
    ) {
      setCategoriaId(categoriaPadraoId)
      return
    }

    const primeiraAtiva = categorias.find((categoria) => categoria.ativo)
    setCategoriaId(primeiraAtiva?.id ?? '')
    // Intencionalmente nao depende de `categorias`/`produtoInicial` por referencia:
    // so reage a troca do produto (id) ou do filtro de categoria padrao.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync por id
  }, [produtoInicial?.id, categoriaPadraoId])

  // Em modo criacao, preenche a categoria padrao quando a lista chega do IPC.
  useEffect(() => {
    if (produtoInicial || categoriaId !== '') {
      return
    }

    if (
      categoriaPadraoId &&
      categorias.some((categoria) => categoria.ativo && categoria.id === categoriaPadraoId)
    ) {
      setCategoriaId(categoriaPadraoId)
      return
    }

    const primeiraAtiva = categorias.find((categoria) => categoria.ativo)
    if (primeiraAtiva) {
      setCategoriaId(primeiraAtiva.id)
    }
  }, [produtoInicial, categoriaId, categoriaPadraoId, categorias])

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    onLimparFeedback()
    setErroValidacao(null)

    if (categoriaId === '') {
      setErroValidacao('Selecione uma categoria ativa.')
      return
    }

    if (nome.trim() === '') {
      setErroValidacao('Informe o nome do produto.')
      return
    }

    const precoCentavos = converterReaisParaCentavos(preco)

    if (precoCentavos === null) {
      setErroValidacao('Informe um preco valido e nao negativo.')
      return
    }

    setEnviando(true)

    try {
      const sucesso = await onSalvar(
        categoriaId,
        nome,
        precoCentavos,
        descricao.trim() || undefined,
      )

      if (sucesso && !editando) {
        setNome('')
        setDescricao('')
        setPreco('')
      }
    } finally {
      setEnviando(false)
    }
  }

  const precoPreview = converterReaisParaCentavos(preco)

  return (
    <form
      className="formulario-produto"
      data-testid={editando ? 'formulario-editar-produto' : 'formulario-produto'}
      onSubmit={(evento) => void handleSubmit(evento)}
    >
      <label className="formulario-produto__campo" htmlFor="categoria-produto">
        Categoria
        <select
          id="categoria-produto"
          data-testid="campo-categoria-produto"
          value={categoriaId}
          onChange={(evento) => setCategoriaId(evento.target.value)}
          disabled={enviando || categoriasDisponiveis.length === 0}
        >
          {categoriasDisponiveis.length === 0 ? (
            <option value="">Nenhuma categoria ativa</option>
          ) : (
            categoriasDisponiveis.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
                {!categoria.ativo ? ' (inativa)' : ''}
              </option>
            ))
          )}
        </select>
      </label>

      <label className="formulario-produto__campo" htmlFor="nome-produto">
        Nome
        <input
          id="nome-produto"
          data-testid="campo-nome-produto"
          type="text"
          value={nome}
          onChange={(evento) => setNome(evento.target.value)}
          disabled={enviando}
        />
      </label>

      <label className="formulario-produto__campo" htmlFor="descricao-produto">
        Descricao
        <input
          id="descricao-produto"
          data-testid="campo-descricao-produto"
          type="text"
          value={descricao}
          onChange={(evento) => setDescricao(evento.target.value)}
          disabled={enviando}
          placeholder="Opcional"
        />
      </label>

      <label className="formulario-produto__campo" htmlFor="preco-produto">
        Preco
        <input
          id="preco-produto"
          data-testid="campo-preco-produto"
          type="text"
          inputMode="decimal"
          placeholder="0,00"
          value={preco}
          onChange={(evento) => setPreco(evento.target.value)}
          disabled={enviando}
        />
      </label>

      {precoPreview !== null ? (
        <p className="formulario-produto__preview" data-testid="preview-preco-produto">
          Preco informado: {formatarMoeda(precoPreview)}
        </p>
      ) : null}

      {erroValidacao ? (
        <p className="formulario-produto__erro" role="alert" data-testid="erro-validacao-produto">
          {erroValidacao}
        </p>
      ) : null}

      <div className="formulario-produto__acoes">
        {onCancelar ? (
          <button
            type="button"
            className="produtos__botao-secundario"
            data-testid="botao-cancelar-edicao-produto"
            disabled={enviando}
            onClick={onCancelar}
          >
            Cancelar
          </button>
        ) : null}
        <button
          type="submit"
          data-testid={editando ? 'botao-salvar-produto' : 'botao-criar-produto'}
          disabled={enviando || categoriasDisponiveis.length === 0}
        >
          {editando ? 'Salvar produto' : 'Criar produto'}
        </button>
      </div>
    </form>
  )
}
