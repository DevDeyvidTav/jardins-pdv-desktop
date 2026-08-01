import { useEffect, useState, type FormEvent } from 'react'
import type { CategoriaProduto } from '@shared/types/categoria-produto'

interface FormularioCategoriaProps {
  carregando: boolean
  erroExterno: string | null
  categoriaInicial?: CategoriaProduto | null
  onSalvar: (nome: string, descricao?: string) => Promise<boolean>
  onLimparFeedback: () => void
  onCancelar?: () => void
}

export function FormularioCategoria({
  carregando,
  erroExterno,
  categoriaInicial = null,
  onSalvar,
  onLimparFeedback,
  onCancelar,
}: FormularioCategoriaProps) {
  const editando = categoriaInicial !== null
  const [nome, setNome] = useState(categoriaInicial?.nome ?? '')
  const [descricao, setDescricao] = useState(categoriaInicial?.descricao ?? '')
  const [erroValidacao, setErroValidacao] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    setNome(categoriaInicial?.nome ?? '')
    setDescricao(categoriaInicial?.descricao ?? '')
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
      const sucesso = await onSalvar(nome, descricao.trim() || undefined)

      if (sucesso && !editando) {
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
      data-testid={editando ? 'formulario-editar-categoria' : 'formulario-categoria'}
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

      <div className="formulario-categoria__acoes">
        {onCancelar ? (
          <button
            type="button"
            className="produtos__botao-secundario"
            data-testid="botao-cancelar-edicao-categoria"
            disabled={carregando || enviando}
            onClick={onCancelar}
          >
            Cancelar
          </button>
        ) : null}
        <button
          type="submit"
          data-testid={editando ? 'botao-salvar-categoria' : 'botao-criar-categoria'}
          disabled={carregando || enviando}
        >
          {editando ? 'Salvar categoria' : 'Criar categoria'}
        </button>
      </div>
    </form>
  )
}
