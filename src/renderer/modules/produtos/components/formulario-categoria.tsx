import { useState, type FormEvent } from 'react'

interface FormularioCategoriaProps {
  carregando: boolean
  erroExterno: string | null
  onCriar: (nome: string, descricao?: string) => Promise<boolean>
  onLimparFeedback: () => void
}

export function FormularioCategoria({
  carregando,
  erroExterno,
  onCriar,
  onLimparFeedback,
}: FormularioCategoriaProps) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [erroValidacao, setErroValidacao] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

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
      const sucesso = await onCriar(nome, descricao.trim() || undefined)

      if (sucesso) {
        setNome('')
        setDescricao('')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form
      className="formulario-categoria"
      data-testid="formulario-categoria"
      onSubmit={(evento) => void handleSubmit(evento)}
    >
      <label className="formulario-categoria__campo" htmlFor="nome-categoria">
        Nome
        <input
          id="nome-categoria"
          data-testid="campo-nome-categoria"
          type="text"
          value={nome}
          onChange={(evento) => setNome(evento.target.value)}
          disabled={carregando || enviando}
        />
      </label>

      <label className="formulario-categoria__campo" htmlFor="descricao-categoria">
        Descricao
        <input
          id="descricao-categoria"
          data-testid="campo-descricao-categoria"
          type="text"
          value={descricao}
          onChange={(evento) => setDescricao(evento.target.value)}
          disabled={carregando || enviando}
          placeholder="Opcional"
        />
      </label>

      {erroValidacao ? (
        <p className="formulario-categoria__erro" role="alert">
          {erroValidacao}
        </p>
      ) : null}

      {erroExterno ? (
        <p className="formulario-categoria__erro" role="alert" data-testid="erro-produtos">
          {erroExterno}
        </p>
      ) : null}

      <button type="submit" data-testid="botao-criar-categoria" disabled={carregando || enviando}>
        Criar categoria
      </button>
    </form>
  )
}
