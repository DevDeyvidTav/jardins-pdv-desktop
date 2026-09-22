import { useMemo, useState } from 'react'
import type { CategoriaProduto } from '@shared/types/categoria-produto'
import type { ProdutoComCategoria } from '@shared/types/produto'
import { FormularioCategoria } from '../components/formulario-categoria'
import { ListaCategorias } from '../components/lista-categorias'
import { FormularioProduto } from '../components/formulario-produto'
import { ListaProdutos } from '../components/lista-produtos'
import { BuscaProdutos } from '../components/busca-produtos'
import { ModalConfirmarExclusao } from '../components/modal-confirmar-exclusao'
import type { UseProdutosResultado } from '../hooks/use-produtos'
import './produtos.css'

interface ProdutosPageProps {
  produtos: UseProdutosResultado
  permitirFiscal?: boolean
}

type VisaoProdutos = 'ativos' | 'todos'

export function ProdutosPage({ produtos, permitirFiscal = false }: ProdutosPageProps) {
  const [exibirFormCategoria, setExibirFormCategoria] = useState(false)
  const [exibirFormProduto, setExibirFormProduto] = useState(false)
  const [categoriaEmEdicao, setCategoriaEmEdicao] = useState<CategoriaProduto | null>(null)
  const [produtoEmEdicao, setProdutoEmEdicao] = useState<ProdutoComCategoria | null>(null)
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState<CategoriaProduto | null>(
    null,
  )
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<ProdutoComCategoria | null>(
    null,
  )
  const [excluindo, setExcluindo] = useState(false)
  const [visaoProdutos, setVisaoProdutos] = useState<VisaoProdutos>('ativos')

  const produtosExibidos = useMemo(() => {
    const base =
      visaoProdutos === 'ativos' ? produtos.produtos : produtos.produtosAdministrativos

    const termo = produtos.termoBusca.trim().toLowerCase()
    return base.filter((produto) => {
      const bateCategoria =
        !produtos.categoriaFiltroId || produto.categoriaId === produtos.categoriaFiltroId
      const bateTermo = !termo || produto.nome.toLowerCase().includes(termo)
      const bateVisao = visaoProdutos === 'todos' || produto.ativo
      return bateCategoria && bateTermo && bateVisao
    })
  }, [
    produtos.produtos,
    produtos.produtosAdministrativos,
    produtos.termoBusca,
    produtos.categoriaFiltroId,
    visaoProdutos,
  ])

  const categoriasVisiveisCount = produtos.categorias.length

  const fecharFormCategoria = () => {
    setExibirFormCategoria(false)
    setCategoriaEmEdicao(null)
  }

  const fecharFormProduto = () => {
    setExibirFormProduto(false)
    setProdutoEmEdicao(null)
  }

  return (
    <div className="produtos produtos--operacao" data-testid="pagina-produtos">
      <div className="produtos-operacao">
        <aside className="produtos-operacao__categorias" data-testid="painel-categorias">
          <header className="produtos-operacao__painel-cabecalho">
            <div>
              <h1>Categorias</h1>
              <p className="produtos-operacao__meta">
                {categoriasVisiveisCount} categoria
                {categoriasVisiveisCount === 1 ? '' : 's'} no cardapio
              </p>
            </div>
            <button
              type="button"
              className="produtos__botao-secundario"
              data-testid="botao-toggle-categoria"
              onClick={() => {
                if (exibirFormCategoria || categoriaEmEdicao) {
                  fecharFormCategoria()
                  return
                }
                setCategoriaEmEdicao(null)
                setExibirFormCategoria(true)
              }}
            >
              {exibirFormCategoria || categoriaEmEdicao ? 'Fechar' : 'Nova'}
            </button>
          </header>

          {produtos.sucesso ? (
            <p className="produtos__sucesso" role="status" data-testid="feedback-sucesso-produtos">
              {produtos.sucesso}
            </p>
          ) : null}

          {produtos.erro ? (
            <p className="produtos__erro" role="alert" data-testid="feedback-erro-produtos">
              {produtos.erro}
            </p>
          ) : null}

          {exibirFormCategoria || categoriaEmEdicao ? (
            <div className="modal-produtos" role="dialog">
              <button
                type="button"
                className="modal-produtos__backdrop"
                aria-label="Fechar"
                onClick={fecharFormCategoria}
              />
              <div className="modal-produtos__conteudo">
                <div className="modal-produtos__cabecalho">
                  <h2>{categoriaEmEdicao ? 'Editar categoria' : 'Nova categoria'}</h2>
                </div>
                <FormularioCategoria
                  carregando={produtos.carregando}
                  erroExterno={null}
                  categoriaInicial={categoriaEmEdicao}
                  onSalvar={async (nome, descricao) => {
                    if (categoriaEmEdicao) {
                      const ok = await produtos.atualizarCategoria(
                        categoriaEmEdicao.id,
                        nome,
                        descricao,
                      )
                      if (ok) fecharFormCategoria()
                      return ok
                    }

                    const ok = await produtos.criarCategoria(nome, descricao)
                    if (ok) fecharFormCategoria()
                    return ok
                  }}
                  onLimparFeedback={produtos.limparFeedback}
                  onCancelar={fecharFormCategoria}
                />
              </div>
            </div>
          ) : null}

          <div className="produtos-operacao__filtros-categoria">
            <button
              type="button"
              className="produtos-operacao__chip"
              data-ativo={produtos.categoriaFiltroId === ''}
              data-testid="filtro-categoria-todas"
              onClick={() => produtos.definirCategoriaFiltro('')}
            >
              Todas
            </button>
          </div>

          <div className="produtos-operacao__lista-scroll">
            <ListaCategorias
              categorias={produtos.categorias}
              categoriaSelecionadaId={produtos.categoriaFiltroId}
              onSelecionar={produtos.definirCategoriaFiltro}
              onEditar={(categoria) => {
                setExibirFormCategoria(false)
                setCategoriaEmEdicao(categoria)
              }}
              onInativar={produtos.inativarCategoria}
              onReativar={produtos.reativarCategoria}
              onExcluir={setCategoriaParaExcluir}
            />
          </div>
        </aside>

        <section className="produtos-operacao__produtos">
          <header className="produtos-operacao__toolbar">
            <div>
              <h1>Produtos</h1>
              <p className="produtos-operacao__meta">
                {produtosExibidos.length} exibido{produtosExibidos.length === 1 ? '' : 's'}
              </p>
            </div>
            <div className="produtos-operacao__acoes-toolbar">
              <button
                type="button"
                className="produtos__botao-secundario"
                data-testid="botao-toggle-produto"
                onClick={() => {
                  if (exibirFormProduto || produtoEmEdicao) {
                    fecharFormProduto()
                    return
                  }
                  setProdutoEmEdicao(null)
                  setExibirFormProduto(true)
                }}
              >
                {exibirFormProduto || produtoEmEdicao ? 'Fechar formulario' : 'Novo produto'}
              </button>
            </div>
          </header>

          <div className="produtos-operacao__controles">
            <BuscaProdutos
              termo={produtos.termoBusca}
              categoriaFiltroId={produtos.categoriaFiltroId}
              categorias={produtos.categorias.filter((categoria) => categoria.ativo)}
              onTermoChange={produtos.definirTermoBusca}
              onCategoriaChange={produtos.definirCategoriaFiltro}
              compacto
            />

            <div className="produtos-operacao__filtros-visao" data-testid="filtros-visao-produtos">
              <button
                type="button"
                className="produtos-operacao__chip"
                data-ativo={visaoProdutos === 'ativos'}
                data-testid="filtro-produtos-ativos"
                onClick={() => setVisaoProdutos('ativos')}
              >
                Ativos
              </button>
              <button
                type="button"
                className="produtos-operacao__chip"
                data-ativo={visaoProdutos === 'todos'}
                data-testid="filtro-produtos-todos"
                onClick={() => setVisaoProdutos('todos')}
              >
                Todos
              </button>
            </div>
          </div>

          {exibirFormProduto || produtoEmEdicao ? (
            <div
              className="produtos-operacao__form-painel"
              data-testid="painel-formulario-produto"
            >
              <FormularioProduto
                categorias={produtos.categorias}
                categoriaPadraoId={produtos.categoriaFiltroId || undefined}
                produtoInicial={produtoEmEdicao}
                carregando={produtos.carregando}
                permitirFiscal={permitirFiscal}
                onSalvar={async (dados) => {
                  if (produtoEmEdicao) {
                    const ok = await produtos.atualizarProduto(produtoEmEdicao.id, dados)
                    if (ok) fecharFormProduto()
                    return ok
                  }

                  const ok = await produtos.criarProduto(dados)
                  if (ok) fecharFormProduto()
                  return ok
                }}
                onLimparFeedback={produtos.limparFeedback}
                onCancelar={fecharFormProduto}
              />
            </div>
          ) : null}

          {exibirFormProduto || produtoEmEdicao ? null : (
            <div className="produtos-operacao__lista-scroll">
              <ListaProdutos
                produtos={produtosExibidos}
                compacto
                exibirInativos={visaoProdutos === 'todos'}
                onEditar={(produto) => {
                  setExibirFormProduto(false)
                  setProdutoEmEdicao(produto)
                }}
                onInativar={produtos.inativarProduto}
                onReativar={produtos.reativarProduto}
                onExcluir={setProdutoParaExcluir}
              />
            </div>
          )}
        </section>
      </div>

      {categoriaParaExcluir ? (
        <ModalConfirmarExclusao
          titulo="Remover categoria"
          descricao={`Remover "${categoriaParaExcluir.nome}" do cardapio? Todos os produtos vinculados tambem serao removidos do cardapio (soft delete). Os registros permanecem no banco e o historico de pedidos nao e alterado.`}
          testId="modal-confirmar-exclusao-categoria"
          excluindo={excluindo}
          onFechar={() => {
            if (!excluindo) setCategoriaParaExcluir(null)
          }}
          onConfirmar={async () => {
            setExcluindo(true)
            try {
              const ok = await produtos.excluirCategoria(categoriaParaExcluir.id)
              if (ok) {
                setCategoriaParaExcluir(null)
                if (categoriaEmEdicao?.id === categoriaParaExcluir.id) {
                  fecharFormCategoria()
                }
              }
            } finally {
              setExcluindo(false)
            }
          }}
        />
      ) : null}

      {produtoParaExcluir ? (
        <ModalConfirmarExclusao
          titulo="Remover produto"
          descricao={`Remover "${produtoParaExcluir.nome}" do cardapio? Se o produto ja foi usado em pedidos, ele sera apenas inativado (soft delete) e podera ser reativado depois.`}
          testId="modal-confirmar-exclusao-produto"
          excluindo={excluindo}
          onFechar={() => {
            if (!excluindo) setProdutoParaExcluir(null)
          }}
          onConfirmar={async () => {
            setExcluindo(true)
            try {
              const ok = await produtos.excluirProduto(produtoParaExcluir.id)
              if (ok) {
                setProdutoParaExcluir(null)
                if (produtoEmEdicao?.id === produtoParaExcluir.id) {
                  fecharFormProduto()
                }
              }
            } finally {
              setExcluindo(false)
            }
          }}
        />
      ) : null}
    </div>
  )
}
