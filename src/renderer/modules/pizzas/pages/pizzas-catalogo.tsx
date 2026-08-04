import { useState } from 'react'
import {
  REGRA_PRECIFICACAO_PIZZA,
  type PizzaSabor,
} from '@shared/types/pizza'
import { FormularioPizzaCategoria } from '../components/formulario-pizza-categoria'
import { FormularioPizzaTamanho } from '../components/formulario-pizza-tamanho'
import { FormularioPizzaSabor } from '../components/formulario-pizza-sabor'
import type { UsePizzasResultado } from '../hooks/use-pizzas'
import '../../produtos/pages/produtos.css'
import './pizzas.css'

interface PizzasCatalogoProps {
  pizzas: UsePizzasResultado
}

function rotuloRegra(regra: string): string {
  return regra === REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR
    ? 'Maior sabor'
    : 'Media dos sabores'
}

export function PizzasCatalogo({ pizzas }: PizzasCatalogoProps) {
  const [exibirFormCategoria, setExibirFormCategoria] = useState(false)
  const [exibirFormTamanho, setExibirFormTamanho] = useState(false)
  const [exibirFormSabor, setExibirFormSabor] = useState(false)
  const [saborEmEdicao, setSaborEmEdicao] = useState<PizzaSabor | null>(null)

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
            <button
              type="button"
              className="produtos__botao-secundario"
              onClick={() => setExibirFormCategoria((atual) => !atual)}
            >
              {exibirFormCategoria ? 'Fechar' : 'Nova'}
            </button>
          </header>

          {exibirFormCategoria ? (
            <div className="produtos-operacao__form-painel">
              <FormularioPizzaCategoria
                carregando={pizzas.carregando}
                onLimparFeedback={pizzas.limparFeedback}
                onSalvar={async (nome, regraPrecificacao, descricao) => {
                  const ok = await pizzas.criarCategoria({
                    nome,
                    regraPrecificacao,
                    descricao,
                  })
                  if (ok) setExibirFormCategoria(false)
                  return ok
                }}
              />
            </div>
          ) : null}

          <ul className="lista-categorias">
            {pizzas.categorias.length === 0 ? (
              <li className="lista-categorias__vazio">Nenhuma categoria cadastrada.</li>
            ) : (
              pizzas.categorias.map((categoria) => (
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
                  <div className="lista-categorias__acoes">
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
            <button
              type="button"
              className="produtos__botao-secundario"
              onClick={() => setExibirFormTamanho((atual) => !atual)}
            >
              {exibirFormTamanho ? 'Fechar' : 'Novo'}
            </button>
          </header>

          {exibirFormTamanho ? (
            <div className="produtos-operacao__form-painel">
              <FormularioPizzaTamanho
                carregando={pizzas.carregando}
                onLimparFeedback={pizzas.limparFeedback}
                onSalvar={async (nome, sigla, maximoSabores) => {
                  const ok = await pizzas.criarTamanho({ nome, sigla, maximoSabores })
                  if (ok) setExibirFormTamanho(false)
                  return ok
                }}
              />
            </div>
          ) : null}

          <ul className="lista-categorias">
            {pizzas.tamanhos.length === 0 ? (
              <li className="lista-categorias__vazio">Nenhum tamanho cadastrado.</li>
            ) : (
              pizzas.tamanhos.map((tamanho) => (
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
                    <label className="pizzas-catalogo__maximo-inline">
                      Max. sabores
                      <input
                        type="number"
                        min={1}
                        data-testid="campo-maximo-sabores-tamanho"
                        defaultValue={tamanho.maximoSabores}
                        key={`${tamanho.id}-${tamanho.maximoSabores}`}
                        onBlur={(evento) => {
                          const valor = Number(evento.target.value)
                          if (
                            Number.isInteger(valor) &&
                            valor >= 1 &&
                            valor !== tamanho.maximoSabores
                          ) {
                            void pizzas.atualizarTamanho(tamanho.id, {
                              maximoSabores: valor,
                            })
                          }
                        }}
                      />
                    </label>
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
                  <div className="lista-categorias__acoes">
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
            <button
              type="button"
              className="produtos__botao-secundario"
              onClick={() => {
                if (exibirFormSabor || saborEmEdicao) {
                  setExibirFormSabor(false)
                  setSaborEmEdicao(null)
                  return
                }
                setSaborEmEdicao(null)
                setExibirFormSabor(true)
              }}
            >
              {exibirFormSabor || saborEmEdicao ? 'Fechar' : 'Novo'}
            </button>
          </header>

          {exibirFormSabor || saborEmEdicao ? (
            <div className="produtos-operacao__form-painel">
              <FormularioPizzaSabor
                pizzas={pizzas}
                categorias={pizzas.categorias}
                tamanhos={pizzas.tamanhos}
                saborEmEdicao={saborEmEdicao}
                onFecharEdicao={() => {
                  setSaborEmEdicao(null)
                  setExibirFormSabor(false)
                }}
              />
            </div>
          ) : null}

          <ul className="lista-categorias">
            {pizzas.sabores.length === 0 ? (
              <li className="lista-categorias__vazio">Nenhum sabor cadastrado.</li>
            ) : (
              pizzas.sabores.map((sabor) => (
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
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  )
}
