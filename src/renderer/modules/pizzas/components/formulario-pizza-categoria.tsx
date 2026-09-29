import { useEffect, useState, type FormEvent } from 'react'
import {
  REGRA_PRECIFICACAO_PIZZA,
  rotuloRegraPrecificacaoPizza,
  type PizzaCategoria,
  type RegraPrecificacaoPizza,
} from '@shared/types/pizza'

interface FormularioPizzaCategoriaProps {
  carregando: boolean
  categoriaInicial?: PizzaCategoria | null
  onSalvar: (
    nome: string,
    regraPrecificacao: RegraPrecificacaoPizza,
    descricao?: string,
  ) => Promise<boolean>
  onLimparFeedback: () => void
  onCancelar?: () => void
}

export function FormularioPizzaCategoria({
  carregando,
  categoriaInicial = null,
  onSalvar,
  onLimparFeedback,
  onCancelar,
}: FormularioPizzaCategoriaProps) {
  const editando = categoriaInicial !== null
  const [nome, setNome] = useState(categoriaInicial?.nome ?? '')
  const [descricao, setDescricao] = useState(categoriaInicial?.descricao ?? '')
  const [regra, setRegra] = useState<RegraPrecificacaoPizza>(
    categoriaInicial?.regraPrecificacao ?? REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR,
  )
  const [erroValidacao, setErroValidacao] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    setNome(categoriaInicial?.nome ?? '')
    setDescricao(categoriaInicial?.descricao ?? '')
    setRegra(categoriaInicial?.regraPrecificacao ?? REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR)
    setErroValidacao(null)
  }, [categoriaInicial])

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    onLimparFeedback()
    setErroValidacao(null)

    if (nome.trim() === '') {
      setErroValidacao('Informe o nome da categoria.')
      return
    }

    setEnviando(true)
    try {
      const ok = await onSalvar(nome, regra, descricao.trim() || undefined)
      if (ok && !editando) {
        setNome('')
        setDescricao('')
        setRegra(REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR)
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form
      className="formulario-produto"
      data-testid="formulario-pizza-categoria"
      onSubmit={(evento) => void handleSubmit(evento)}
    >
      <label className="formulario-produto__campo" htmlFor="nome-pizza-categoria">
        Nome
        <input
          id="nome-pizza-categoria"
          data-testid="campo-nome-pizza-categoria"
          type="text"
          value={nome}
          onChange={(evento) => setNome(evento.target.value)}
          disabled={carregando || enviando}
        />
      </label>

      <label className="formulario-produto__campo" htmlFor="regra-pizza-categoria">
        Como cobrar pizza com mais de um sabor
        <select
          id="regra-pizza-categoria"
          data-testid="campo-regra-pizza-categoria"
          value={regra}
          onChange={(evento) => setRegra(evento.target.value as RegraPrecificacaoPizza)}
          disabled={carregando || enviando}
        >
          <option value={REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR}>
            {rotuloRegraPrecificacaoPizza(REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR)}
          </option>
          <option value={REGRA_PRECIFICACAO_PIZZA.MEDIA_SABORES}>
            {rotuloRegraPrecificacaoPizza(REGRA_PRECIFICACAO_PIZZA.MEDIA_SABORES)}
          </option>
        </select>
        <small>
          {regra === REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR
            ? 'Cobra o preço do sabor mais caro. Se misturar com outra categoria que usa média, vale o mais caro.'
            : 'Cobra a média dos sabores. Vale também ao misturar categorias que usam a mesma regra.'}
        </small>
      </label>

      <label className="formulario-produto__campo" htmlFor="descricao-pizza-categoria">
        Descricao
        <input
          id="descricao-pizza-categoria"
          type="text"
          value={descricao}
          onChange={(evento) => setDescricao(evento.target.value)}
          disabled={carregando || enviando}
          placeholder="Opcional"
        />
      </label>

      {erroValidacao ? (
        <p className="formulario-produto__erro" role="alert">
          {erroValidacao}
        </p>
      ) : null}

      <div className="formulario-produto__acoes">
        {onCancelar ? (
          <button
            type="button"
            className="produtos__botao-secundario"
            disabled={carregando || enviando}
            onClick={onCancelar}
          >
            Cancelar
          </button>
        ) : null}
        <button
          type="submit"
          data-testid="botao-criar-pizza-categoria"
          disabled={carregando || enviando}
        >
          {editando ? 'Salvar categoria' : 'Criar categoria'}
        </button>
      </div>
    </form>
  )
}
