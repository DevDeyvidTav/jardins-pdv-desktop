import { useEffect, useState, type FormEvent } from 'react'
import type { CategoriaProduto } from '@shared/types/categoria-produto'
import { converterReaisParaCentavos, formatarMoeda } from '@shared/utils/moeda'

interface FormularioProdutoProps {
  categorias: CategoriaProduto[]
  carregando: boolean
  onCriar: (
    categoriaId: string,
    nome: string,
    precoCentavos: number,
    descricao?: string,
  ) => Promise<boolean>
  onLimparFeedback: () => void
}

export function FormularioProduto({
  categorias,
  carregando,
  onCriar,
  onLimparFeedback,
}: FormularioProdutoProps) {
  const categoriasAtivas = categorias.filter((categoria) => categoria.ativo)
  const [categoriaId, setCategoriaId] = useState(categoriasAtivas[0]?.id ?? '')
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [preco, setPreco] = useState('')
  const [erroValidacao, setErroValidacao] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (categoriaId === '' && categoriasAtivas[0]) {
      setCategoriaId(categoriasAtivas[0].id)
    }
  }, [categoriaId, categoriasAtivas])

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
      const sucesso = await onCriar(
        categoriaId,
        nome,
        precoCentavos,
        descricao.trim() || undefined,
      )

      if (sucesso) {
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
      data-testid="formulario-produto"
      onSubmit={(evento) => void handleSubmit(evento)}
    >
      <label className="formulario-produto__campo" htmlFor="categoria-produto">
        Categoria
        <select
          id="categoria-produto"
          data-testid="campo-categoria-produto"
          value={categoriaId}
          onChange={(evento) => setCategoriaId(evento.target.value)}
          disabled={carregando || enviando || categoriasAtivas.length === 0}
        >
          {categoriasAtivas.length === 0 ? (
            <option value="">Nenhuma categoria ativa</option>
          ) : (
            categoriasAtivas.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
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
          disabled={carregando || enviando}
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
          disabled={carregando || enviando}
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
          disabled={carregando || enviando}
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

      <button
        type="submit"
        data-testid="botao-criar-produto"
        disabled={carregando || enviando || categoriasAtivas.length === 0}
      >
        Criar produto
      </button>
    </form>
  )
}
