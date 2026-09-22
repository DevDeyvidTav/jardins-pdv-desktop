import { useMemo, useState, type ReactNode } from 'react'
import {
  REGRA_PRECIFICACAO_PIZZA,
  type PizzaCategoria,
  type PizzaSabor,
  type PizzaTamanho,
} from '@shared/types/pizza'
import { FormularioPizzaCategoria } from '../components/formulario-pizza-categoria'
import { FormularioPizzaTamanho } from '../components/formulario-pizza-tamanho'
import { FormularioPizzaSabor } from '../components/formulario-pizza-sabor'
import type { UsePizzasResultado } from '../hooks/use-pizzas'
import '../../produtos/pages/produtos.css'
import './pizzas.css'

interface PizzasCatalogoProps {
  pizzas: UsePizzasResultado
  permitirEdicao?: boolean
}

function rotuloRegra(regra: string): string {
  return regra === REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR
    ? 'Maior sabor'
    : 'Media dos sabores'
}

function DialogoCadastro({
  aberto,
  titulo,
  largo,
  onFechar,
  children,
}: {
  aberto: boolean
  titulo: string
  largo?: boolean
  onFechar: () => void
  children: ReactNode
}) {
  if (!aberto) return null
  return (
    <div className="modal-produtos" role="dialog">
      <button
        type="button"
        className="modal-produtos__backdrop"
        aria-label="Fechar"
        onClick={onFechar}
      />
      <div
        className={[
          'modal-produtos__conteudo',
          largo ? 'modal-produtos__conteudo--largo' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="modal-produtos__cabecalho">
          <h2>{titulo}</h2>
        </div>
        {children}
      </div>
    </div>
  )
}

export function PizzasCatalogo({ pizzas, permitirEdicao = false }: PizzasCatalogoProps) {
  const [exibirFormCategoria, setExibirFormCategoria] = useState(false)
  const [exibirFormTamanho, setExibirFormTamanho] = useState(false)
  const [exibirFormSabor, setExibirFormSabor] = useState(false)
  const [categoriaEmEdicao, setCategoriaEmEdicao] = useState<PizzaCategoria | null>(null)
  const [tamanhoEmEdicao, setTamanhoEmEdicao] = useState<PizzaTamanho | null>(null)
  const [saborEmEdicao, setSaborEmEdicao] = useState<PizzaSabor | null>(null)
  const [buscaCategoria, setBuscaCategoria] = useState('')
  const [buscaTamanho, setBuscaTamanho] = useState('')
  const [buscaSabor, setBuscaSabor] = useState('')

  const dialogoCategoriaAberto = permitirEdicao && (exibirFormCategoria || categoriaEmEdicao !== null)
  const dialogoTamanhoAberto = permitirEdicao && (exibirFormTamanho || tamanhoEmEdicao !== null)
  const dialogoSaborAberto = permitirEdicao && (exibirFormSabor || saborEmEdicao !== null)

  function fecharFormCategoria() {
    setExibirFormCategoria(false)
    setCategoriaEmEdicao(null)
  }

  function fecharFormTamanho() {
    setExibirFormTamanho(false)
    setTamanhoEmEdicao(null)
  }

  function fecharFormSabor() {
    setExibirFormSabor(false)
    setSaborEmEdicao(null)
  }

  const categoriasVisiveis = useMemo(() => {
    const termo = buscaCategoria.trim().toLowerCase()
    return pizzas.categorias.filter(
      (categoria) =>
        !termo ||
        categoria.nome.toLowerCase().includes(termo) ||
        (categoria.descricao ?? '').toLowerCase().includes(termo),
    )
  }, [pizzas.categorias, buscaCategoria])

  const tamanhosVisiveis = useMemo(() => {
    const termo = buscaTamanho.trim().toLowerCase()
    return pizzas.tamanhos.filter(
      (tamanho) =>
        !termo ||
        tamanho.nome.toLowerCase().includes(termo) ||
        tamanho.sigla.toLowerCase().includes(termo),
    )
  }, [pizzas.tamanhos, buscaTamanho])

  const saboresVisiveis = useMemo(() => {
    const termo = buscaSabor.trim().toLowerCase()
    return pizzas.sabores.filter((sabor) => {
      const bateTermo =
        !termo ||
        sabor.nome.toLowerCase().includes(termo) ||
        (sabor.descricao ?? '').toLowerCase().includes(termo)
      return bateTermo
    })
  }, [pizzas.sabores, buscaSabor])

  return (
    <div className="pizzas-catalogo" data-testid="pagina-pizzas">
      {pizzas.sucesso ? (
        <p className="produtos__sucesso" role="status" data-testid="feedback-sucesso-pizzas">
          {pizzas.sucesso}
        </p>
      ) : null}

      {pizzas.erro ? (
        <p className="produtos__erro" role="alert" data-testid="feedback-erro-pizzas">
          {pizzas.erro}
        </p>
      ) : null}

      {pizzas.carregando && pizzas.categorias.length === 0 ? (
        <p className="produtos-operacao__meta">Carregando pizzas...</p>
      ) : null}

      <div className="pizzas-catalogo__grade">
        <section className="pizzas-catalogo__secao" data-testid="secao-pizza-categorias">
          <header className="produtos-operacao__painel-cabecalho">
            <div>
              <h2>Categorias</h2>
              <p className="produtos-operacao__meta">
                {pizzas.categorias.filter((c) => c.ativa).length} ativa(s)
              </p>
            </div>
            {permitirEdicao ? (
              <button
                type="button"
                className="produtos__botao-secundario"
                onClick={() => {
                  if (dialogoCategoriaAberto) {
                    fecharFormCategoria()
                    return
                  }
                  setCategoriaEmEdicao(null)
                  setExibirFormCategoria(true)
                }}
              >
                {dialogoCategoriaAberto ? 'Fechar' : 'Nova'}
              </button>
            ) : null}
          </header>

          <input
            className="pizzas-catalogo__busca"
            type="search"
            placeholder="Filtrar categorias"
            value={buscaCategoria}
            onChange={(evento) => setBuscaCategoria(evento.target.value)}
          />

          <DialogoCadastro
            aberto={dialogoCategoriaAberto}
            titulo={categoriaEmEdicao ? 'Editar categoria' : 'Nova categoria'}
            onFechar={fecharFormCategoria}
          >
            <FormularioPizzaCategoria
              carregando={pizzas.carregando}
              categoriaInicial={categoriaEmEdicao}
              onLimparFeedback={pizzas.limparFeedback}
              onCancelar={fecharFormCategoria}
              onSalvar={async (nome, regraPrecificacao, descricao) => {
                if (categoriaEmEdicao) {
                  const ok = await pizzas.atualizarCategoria(categoriaEmEdicao.id, {
                    nome,
                    regraPrecificacao,
                    descricao: descricao ?? null,
                  })
                  if (ok) fecharFormCategoria()
                  return ok
                }
                const ok = await pizzas.criarCategoria({
                  nome,
                  regraPrecificacao,
                  descricao,
                })
                if (ok) fecharFormCategoria()
                return ok
              }}
            />
          </DialogoCadastro>

          <ul className="lista-categorias">
            {categoriasVisiveis.length === 0 ? (
              <li className="lista-categorias__vazio">Nenhuma categoria cadastrada.</li>
            ) : (
              categoriasVisiveis.map((categoria) => (
                <li
                  key={categoria.id}
                  className={[
                    'lista-categorias__item',
                    !categoria.ativa ? 'lista-categorias__item--inativa' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  data-testid="item-pizza-categoria"
                >
                  <div className="lista-categorias__selecao">
                    <strong>{categoria.nome}</strong>
                    <span>{rotuloRegra(categoria.regraPrecificacao)}</span>
                  </div>
                  <span
                    className={
                      categoria.ativa
                        ? 'lista-categorias__status lista-categorias__status--ativo'
                        : 'lista-categorias__status lista-categorias__status--inativo'
                    }
                  >
                    {categoria.ativa ? 'Ativa' : 'Inativa'}
                  </span>
                  {permitirEdicao ? (
                    <div className="lista-categorias__acoes">
                      <button
                        type="button"
                        className="lista-categorias__acao"
                        onClick={() => {
                          setExibirFormCategoria(false)
                          setCategoriaEmEdicao(categoria)
                        }}
                      >
                        Editar
                      </button>
                      {categoria.ativa ? (
                        <button
                          type="button"
                          className="lista-categorias__acao"
                          onClick={() =>
                            void pizzas.atualizarCategoria(categoria.id, { ativa: false })
                          }
                        >
                          Inativar
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="lista-categorias__acao"
                          onClick={() =>
                            void pizzas.atualizarCategoria(categoria.id, { ativa: true })
                          }
                        >
                          Reativar
                        </button>
                      )}
                    </div>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="pizzas-catalogo__secao" data-testid="secao-pizza-tamanhos">
          <header className="produtos-operacao__painel-cabecalho">
            <div>
              <h2>Tamanhos</h2>
              <p className="produtos-operacao__meta">
                {pizzas.tamanhos.filter((t) => t.ativa).length} ativo(s)
              </p>
            </div>
            {permitirEdicao ? (
              <button
                type="button"
                className="produtos__botao-secundario"
                onClick={() => {
                  if (dialogoTamanhoAberto) {
                    fecharFormTamanho()
                    return
                  }
                  setTamanhoEmEdicao(null)
                  setExibirFormTamanho(true)
                }}
              >
                {dialogoTamanhoAberto ? 'Fechar' : 'Novo'}
              </button>
            ) : null}
          </header>

          <input
            className="pizzas-catalogo__busca"
            type="search"
            placeholder="Filtrar tamanhos"
            value={buscaTamanho}
            onChange={(evento) => setBuscaTamanho(evento.target.value)}
          />

          <DialogoCadastro
            aberto={dialogoTamanhoAberto}
            titulo={tamanhoEmEdicao ? 'Editar tamanho' : 'Novo tamanho'}
            onFechar={fecharFormTamanho}
          >
            <FormularioPizzaTamanho
              carregando={pizzas.carregando}
              tamanhoInicial={tamanhoEmEdicao}
              onLimparFeedback={pizzas.limparFeedback}
              onCancelar={fecharFormTamanho}
              onSalvar={async (nome, sigla, maximoSabores) => {
                if (tamanhoEmEdicao) {
                  const ok = await pizzas.atualizarTamanho(tamanhoEmEdicao.id, {
                    nome,
                    sigla,
                    maximoSabores,
                  })
                  if (ok) fecharFormTamanho()
                  return ok
                }
                const ok = await pizzas.criarTamanho({ nome, sigla, maximoSabores })
                if (ok) fecharFormTamanho()
                return ok
              }}
            />
          </DialogoCadastro>

          <ul className="lista-categorias">
            {tamanhosVisiveis.length === 0 ? (
              <li className="lista-categorias__vazio">Nenhum tamanho cadastrado.</li>
            ) : (
              tamanhosVisiveis.map((tamanho) => (
                <li
                  key={tamanho.id}
                  className={[
                    'lista-categorias__item',
                    !tamanho.ativa ? 'lista-categorias__item--inativa' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  data-testid="item-pizza-tamanho"
                >
                  <div className="lista-categorias__selecao">
                    <strong>
                      {tamanho.nome} ({tamanho.sigla})
                    </strong>
                    <span>Max. {tamanho.maximoSabores} sabor(es)</span>
                  </div>
                  <span
                    className={
                      tamanho.ativa
                        ? 'lista-categorias__status lista-categorias__status--ativo'
                        : 'lista-categorias__status lista-categorias__status--inativo'
                    }
                  >
                    {tamanho.ativa ? 'Ativo' : 'Inativo'}
                  </span>
                  {permitirEdicao ? (
                    <div className="lista-categorias__acoes">
                      <button
                        type="button"
                        className="lista-categorias__acao"
                        onClick={() => {
                          setExibirFormTamanho(false)
                          setTamanhoEmEdicao(tamanho)
                        }}
                      >
                        Editar
                      </button>
                      {tamanho.ativa ? (
                        <button
                          type="button"
                          className="lista-categorias__acao"
                          onClick={() =>
                            void pizzas.atualizarTamanho(tamanho.id, { ativa: false })
                          }
                        >
                          Inativar
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="lista-categorias__acao"
                          onClick={() =>
                            void pizzas.atualizarTamanho(tamanho.id, { ativa: true })
                          }
                        >
                          Reativar
                        </button>
                      )}
                    </div>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="pizzas-catalogo__secao" data-testid="secao-pizza-sabores">
          <header className="produtos-operacao__painel-cabecalho">
            <div>
              <h2>Sabores</h2>
              <p className="produtos-operacao__meta">
                {pizzas.sabores.filter((s) => s.ativa).length} ativo(s)
              </p>
            </div>
            {permitirEdicao ? (
              <button
                type="button"
                className="produtos__botao-secundario"
                onClick={() => {
                  if (dialogoSaborAberto) {
                    fecharFormSabor()
                    return
                  }
                  setSaborEmEdicao(null)
                  setExibirFormSabor(true)
                }}
              >
                {dialogoSaborAberto ? 'Fechar' : 'Novo'}
              </button>
            ) : null}
          </header>

          <input
            className="pizzas-catalogo__busca"
            type="search"
            placeholder="Filtrar sabores"
            value={buscaSabor}
            onChange={(evento) => setBuscaSabor(evento.target.value)}
          />

          <DialogoCadastro
            aberto={dialogoSaborAberto}
            titulo={saborEmEdicao ? 'Editar sabor' : 'Novo sabor'}
            largo
            onFechar={fecharFormSabor}
          >
            <FormularioPizzaSabor
              pizzas={pizzas}
              categorias={pizzas.categorias}
              tamanhos={pizzas.tamanhos}
              saborEmEdicao={saborEmEdicao}
              onFecharEdicao={fecharFormSabor}
            />
          </DialogoCadastro>

          <ul className="lista-categorias">
            {saboresVisiveis.length === 0 ? (
              <li className="lista-categorias__vazio">Nenhum sabor cadastrado.</li>
            ) : (
              saboresVisiveis.map((sabor) => (
                <li
                  key={sabor.id}
                  className={[
                    'lista-categorias__item',
                    !sabor.ativa ? 'lista-categorias__item--inativa' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  data-testid="item-pizza-sabor"
                >
                  <div className="lista-categorias__selecao">
                    <strong>{sabor.nome}</strong>
                    {sabor.descricao ? <span>{sabor.descricao}</span> : null}
                  </div>
                  <span
                    className={
                      sabor.ativa
                        ? 'lista-categorias__status lista-categorias__status--ativo'
                        : 'lista-categorias__status lista-categorias__status--inativo'
                    }
                  >
                    {sabor.ativa ? 'Ativo' : 'Inativo'}
                  </span>
                  {permitirEdicao ? (
                    <div className="lista-categorias__acoes">
                      <button
                        type="button"
                        className="lista-categorias__acao"
                        onClick={() => {
                          setExibirFormSabor(false)
                          setSaborEmEdicao(sabor)
                        }}
                      >
                        Precos / vinculos
                      </button>
                      {sabor.ativa ? (
                        <button
                          type="button"
                          className="lista-categorias__acao"
                          onClick={() => void pizzas.atualizarSabor(sabor.id, { ativa: false })}
                        >
                          Inativar
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="lista-categorias__acao"
                          onClick={() => void pizzas.atualizarSabor(sabor.id, { ativa: true })}
                        >
                          Reativar
                        </button>
                      )}
                    </div>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  )
}
