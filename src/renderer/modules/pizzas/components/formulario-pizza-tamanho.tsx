import { useState, type FormEvent } from 'react'

interface FormularioPizzaTamanhoProps {
  carregando: boolean
  onSalvar: (nome: string, sigla: string, maximoSabores: number) => Promise<boolean>
  onLimparFeedback: () => void
}

export function FormularioPizzaTamanho({
  carregando,
  onSalvar,
  onLimparFeedback,
}: FormularioPizzaTamanhoProps) {
  const [nome, setNome] = useState('')
  const [sigla, setSigla] = useState('')
  const [maximoSabores, setMaximoSabores] = useState('1')
  const [erroValidacao, setErroValidacao] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    onLimparFeedback()
    setErroValidacao(null)

    if (nome.trim() === '') {
      setErroValidacao('Informe o nome do tamanho.')
      return
    }

    if (sigla.trim() === '') {
      setErroValidacao('Informe a sigla do tamanho.')
      return
    }

    const maximo = Number(maximoSabores)
    if (!Number.isInteger(maximo) || maximo < 1) {
      setErroValidacao('Maximo de sabores deve ser um inteiro maior que zero.')
      return
    }

    setEnviando(true)
    try {
      const ok = await onSalvar(nome.trim(), sigla.trim().toUpperCase(), maximo)
      if (ok) {
        setNome('')
        setSigla('')
        setMaximoSabores('1')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form
      className="formulario-produto"
      data-testid="formulario-pizza-tamanho"
      onSubmit={(evento) => void handleSubmit(evento)}
    >
      <label className="formulario-produto__campo" htmlFor="nome-pizza-tamanho">
        Nome
        <input
          id="nome-pizza-tamanho"
          type="text"
          value={nome}
          onChange={(evento) => setNome(evento.target.value)}
          disabled={carregando || enviando}
          placeholder="Ex.: Grande"
        />
      </label>

      <label className="formulario-produto__campo" htmlFor="sigla-pizza-tamanho">
        Sigla
        <input
          id="sigla-pizza-tamanho"
          type="text"
          value={sigla}
          onChange={(evento) => setSigla(evento.target.value)}
          disabled={carregando || enviando}
          placeholder="Ex.: G"
        />
      </label>

      <label className="formulario-produto__campo" htmlFor="maximo-sabores-tamanho">
        Maximo de sabores
        <input
          id="maximo-sabores-tamanho"
          data-testid="campo-maximo-sabores-tamanho"
          type="number"
          min={1}
          value={maximoSabores}
          onChange={(evento) => setMaximoSabores(evento.target.value)}
          disabled={carregando || enviando}
        />
      </label>

      {erroValidacao ? (
        <p className="formulario-produto__erro" role="alert">
          {erroValidacao}
        </p>
      ) : null}

      <div className="formulario-produto__acoes">
        <button type="submit" disabled={carregando || enviando}>
          Criar tamanho
        </button>
      </div>
    </form>
  )
}
