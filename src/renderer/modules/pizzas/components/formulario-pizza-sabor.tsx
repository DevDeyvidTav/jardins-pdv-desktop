import { useEffect, useState, type FormEvent } from 'react'
import type { PizzaCategoria, PizzaSabor, PizzaTamanho } from '@shared/types/pizza'
import { converterReaisParaCentavos, formatarMoeda } from '@shared/utils/moeda'
import type { UsePizzasResultado } from '../hooks/use-pizzas'

function formatarCentavosParaInput(centavos: number): string {
  return (centavos / 100).toFixed(2).replace('.', ',')
}

interface FormularioPizzaSaborProps {
  pizzas: UsePizzasResultado
  categorias: PizzaCategoria[]
  tamanhos: PizzaTamanho[]
  saborEmEdicao: PizzaSabor | null
  onFecharEdicao: () => void
}

export function FormularioPizzaSabor({
  pizzas,
  categorias,
  tamanhos,
  saborEmEdicao,
  onFecharEdicao,
}: FormularioPizzaSaborProps) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoriasVinculadas, setCategoriasVinculadas] = useState<Set<string>>(new Set())
  const [precosReais, setPrecosReais] = useState<Record<string, string>>({})
  const [erroValidacao, setErroValidacao] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false)

  const editando = saborEmEdicao !== null
  const tamanhosAtivos = tamanhos.filter((t) => t.ativa)
  const categoriasAtivas = categorias.filter((c) => c.ativa)

  useEffect(() => {
    let cancelado = false

    async function carregarDetalhes() {
      if (!saborEmEdicao) {
        setNome('')
        setDescricao('')
        setCategoriasVinculadas(new Set())
        setPrecosReais({})
        setErroValidacao(null)
        return
      }

      setNome(saborEmEdicao.nome)
      setDescricao(saborEmEdicao.descricao ?? '')
      setCarregandoDetalhes(true)

      try {
        const [categoriaIds, precos] = await Promise.all([
          pizzas.listarCategoriasDoSabor(saborEmEdicao.id),
          pizzas.listarPrecosSabor(saborEmEdicao.id),
        ])

        if (cancelado) return

        setCategoriasVinculadas(new Set(categoriaIds))
        const mapa: Record<string, string> = {}
        for (const tamanho of tamanhos) {
          const preco = precos.find((p) => p.pizzaTamanhoId === tamanho.id && p.ativo)
          mapa[tamanho.id] = preco ? formatarCentavosParaInput(preco.valorCentavos) : ''
        }
        setPrecosReais(mapa)
      } catch {
        if (!cancelado) {
          setErroValidacao('Nao foi possivel carregar vinculos e precos do sabor.')
        }
      } finally {
        if (!cancelado) setCarregandoDetalhes(false)
      }
    }

    void carregarDetalhes()
    return () => {
      cancelado = true
    }
  }, [saborEmEdicao, pizzas, tamanhos])

  async function handleCriar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    pizzas.limparFeedback()
    setErroValidacao(null)

    if (nome.trim() === '') {
      setErroValidacao('Informe o nome do sabor.')
      return
    }

    setEnviando(true)
    try {
      const ok = await pizzas.criarSabor({
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
      })
      if (ok) {
        setNome('')
        setDescricao('')
      }
    } finally {
      setEnviando(false)
    }
  }

  async function handleToggleCategoria(categoriaId: string, marcado: boolean) {
    if (!saborEmEdicao) return
    pizzas.limparFeedback()
    setEnviando(true)
    try {
      const ok = await pizzas.vincularSaborCategoria(saborEmEdicao.id, categoriaId, marcado)
      if (ok) {
        setCategoriasVinculadas((atual) => {
          const proximo = new Set(atual)
          if (marcado) proximo.add(categoriaId)
          else proximo.delete(categoriaId)
          return proximo
        })
      }
    } finally {
      setEnviando(false)
    }
  }

  async function handleSalvarPrecos() {
    if (!saborEmEdicao) return
    pizzas.limparFeedback()
    setErroValidacao(null)

    const precos: Array<{ tamanhoId: string; valorCentavos: number }> = []
    for (const tamanho of tamanhosAtivos) {
      const valorTexto = precosReais[tamanho.id] ?? ''
      if (valorTexto.trim() === '') continue
      const centavos = converterReaisParaCentavos(valorTexto)
      if (centavos === null) {
        setErroValidacao(`Preco invalido para o tamanho ${tamanho.sigla}.`)
        return
      }
      precos.push({ tamanhoId: tamanho.id, valorCentavos: centavos })
    }

    if (precos.length === 0) {
      setErroValidacao('Informe ao menos um preco por tamanho.')
      return
    }

    setEnviando(true)
    try {
      await pizzas.definirPrecosSabor(saborEmEdicao.id, precos)
    } finally {
      setEnviando(false)
    }
  }

  if (!editando) {
    return (
      <form
        className="formulario-produto"
        data-testid="formulario-pizza-sabor"
        onSubmit={(evento) => void handleCriar(evento)}
      >
        <label className="formulario-produto__campo" htmlFor="nome-pizza-sabor">
          Nome
          <input
            id="nome-pizza-sabor"
            data-testid="campo-nome-pizza-sabor"
            type="text"
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            disabled={pizzas.carregando || enviando}
          />
        </label>

        <label className="formulario-produto__campo" htmlFor="descricao-pizza-sabor">
          Descricao
          <input
            id="descricao-pizza-sabor"
            type="text"
            value={descricao}
            onChange={(evento) => setDescricao(evento.target.value)}
            disabled={pizzas.carregando || enviando}
            placeholder="Opcional"
          />
        </label>

        {erroValidacao ? (
          <p className="formulario-produto__erro" role="alert">
            {erroValidacao}
          </p>
        ) : null}

        <div className="formulario-produto__acoes">
          <button
            type="submit"
            data-testid="botao-criar-pizza-sabor"
            disabled={pizzas.carregando || enviando}
          >
            Criar sabor
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="formulario-produto" data-testid="formulario-pizza-sabor">
      <p className="produtos-operacao__meta">
        Editando sabor: <strong>{saborEmEdicao.nome}</strong>
      </p>

      {carregandoDetalhes ? <p className="produtos-operacao__meta">Carregando detalhes...</p> : null}

      <fieldset className="pizzas-catalogo__fieldset" disabled={enviando || carregandoDetalhes}>
        <legend>Categorias vinculadas</legend>
        {categoriasAtivas.length === 0 ? (
          <p className="produtos-operacao__meta">Nenhuma categoria ativa.</p>
        ) : (
          categoriasAtivas.map((categoria) => (
            <label key={categoria.id} className="pizzas-catalogo__checkbox">
              <input
                type="checkbox"
                data-testid={`checkbox-vincular-categoria-${categoria.id}`}
                checked={categoriasVinculadas.has(categoria.id)}
                onChange={(evento) =>
                  void handleToggleCategoria(categoria.id, evento.target.checked)
                }
              />
              {categoria.nome}
            </label>
          ))
        )}
      </fieldset>

      <fieldset className="pizzas-catalogo__fieldset" disabled={enviando || carregandoDetalhes}>
        <legend>Precos por tamanho (R$)</legend>
        {tamanhosAtivos.length === 0 ? (
          <p className="produtos-operacao__meta">Nenhum tamanho ativo.</p>
        ) : (
          tamanhosAtivos.map((tamanho) => {
            const preview = converterReaisParaCentavos(precosReais[tamanho.id] ?? '')
            return (
              <label
                key={tamanho.id}
                className="formulario-produto__campo"
                htmlFor={`preco-sabor-${tamanho.sigla}`}
              >
                {tamanho.nome} ({tamanho.sigla})
                <input
                  id={`preco-sabor-${tamanho.sigla}`}
                  data-testid={`campo-preco-sabor-tamanho-${tamanho.sigla}`}
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={precosReais[tamanho.id] ?? ''}
                  onChange={(evento) =>
                    setPrecosReais((atual) => ({
                      ...atual,
                      [tamanho.id]: evento.target.value,
                    }))
                  }
                />
                {preview !== null ? (
                  <span className="formulario-produto__preview">{formatarMoeda(preview)}</span>
                ) : null}
              </label>
            )
          })
        )}
      </fieldset>

      {erroValidacao ? (
        <p className="formulario-produto__erro" role="alert">
          {erroValidacao}
        </p>
      ) : null}

      <div className="formulario-produto__acoes">
        <button
          type="button"
          className="produtos__botao-secundario"
          disabled={enviando}
          onClick={onFecharEdicao}
        >
          Fechar
        </button>
        <button
          type="button"
          data-testid="botao-salvar-precos-sabor"
          disabled={enviando || carregandoDetalhes || tamanhosAtivos.length === 0}
          onClick={() => void handleSalvarPrecos()}
        >
          Salvar precos
        </button>
      </div>
    </div>
  )
}
