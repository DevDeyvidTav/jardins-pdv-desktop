import { useEffect } from 'react'
import { FormularioMesa } from '../components/formulario-mesa'
import { GradeMesas } from '../components/grade-mesas'
import { FiltrosStatusMesas } from '../components/filtros-status-mesas'
import { FiltrosHistoricoPedidos } from '../components/filtros-historico-pedidos'
import { HistoricoPedidosLista } from '../components/historico-pedidos-lista'
import { PainelMesaPedido } from '../components/painel-mesa-pedido'
import type { UsePedidosResultado } from '../hooks/use-pedidos'
import './pedidos.css'

interface PedidosPageProps {
  pedidos: UsePedidosResultado
}

export function PedidosPage({ pedidos }: PedidosPageProps) {
  useEffect(() => {
    void pedidos.recarregar()
  }, [pedidos.recarregar])

  if (pedidos.carregando && pedidos.mesas.length === 0) {
    return (
      <main className="pedidos pedidos--carregando" data-testid="pagina-pedidos-carregando">
        <p>Carregando pedidos...</p>
      </main>
    )
  }

  if (!pedidos.sessaoCaixa) {
    return (
      <main className="pedidos" data-testid="pagina-pedidos">
        <section className="pedidos__cartao">
          <h1>Pedidos</h1>
          <p className="pedidos__erro" role="alert" data-testid="erro-sem-caixa-pedidos">
            Abra o caixa antes de operar pedidos.
          </p>
        </section>
      </main>
    )
  }

  const naAbaHistorico = pedidos.abaAtiva === 'historico'

  return (
    <main className="pedidos pedidos--operacao" data-testid="pagina-pedidos">
      <div className="pedidos-operacao">
        <PainelMesaPedido
          mesaSelecionada={pedidos.mesaSelecionada}
          resumoPedido={pedidos.resumoPedido}
          produtosAtivos={pedidos.produtosAtivos}
          categoriasAtivas={pedidos.categoriasAtivas}
          exibirFormularioItem={pedidos.exibirFormularioItem}
          carregandoPedido={pedidos.carregandoPedido}
          onAbrirPedido={() => void pedidos.abrirPedidoDaMesaSelecionada()}
          onAdicionarItem={pedidos.abrirFormularioItem}
          onFecharFormularioItem={pedidos.fecharFormularioItem}
          onAdicionarItemPedido={pedidos.adicionarItem}
          onAlterarQuantidade={pedidos.alterarQuantidadeItem}
          onRemoverItem={pedidos.removerItem}
          onAplicarDesconto={pedidos.aplicarDescontoPedido}
          onCancelarPedido={pedidos.cancelarPedido}
          onRegistrarPagamento={pedidos.registrarPagamento}
          erroPagamento={pedidos.erro}
        />

        <section className="pedidos-operacao__grade-area">
          <header className="pedidos-operacao__toolbar">
            <div className="pedidos-operacao__titulo-abas">
              <h1>Pedidos</h1>
              <div className="pedidos-operacao__abas" data-testid="abas-pedidos">
                <button
                  type="button"
                  className="pedidos-operacao__aba"
                  data-ativo={pedidos.abaAtiva === 'mesas'}
                  data-testid="aba-pedidos-mesas"
                  onClick={() => pedidos.definirAbaAtiva('mesas')}
                >
                  Mesas
                </button>
                <button
                  type="button"
                  className="pedidos-operacao__aba"
                  data-ativo={naAbaHistorico}
                  data-testid="aba-pedidos-historico"
                  onClick={() => pedidos.definirAbaAtiva('historico')}
                >
                  Historico
                </button>
              </div>
            </div>

            {!naAbaHistorico ? (
              <div className="pedidos-operacao__acoes-toolbar">
                <button
                  type="button"
                  className="pedidos__botao-secundario"
                  data-testid="botao-cadastrar-mesas"
                  onClick={pedidos.alternarCadastroMesas}
                >
                  Cadastrar mesas
                </button>
                <button
                  type="button"
                  data-testid="botao-pedido-balcao"
                  onClick={() => void pedidos.abrirPedidoBalcao()}
                >
                  Pedido balcao
                </button>
              </div>
            ) : null}
          </header>

          {pedidos.sucesso ? (
            <p className="pedidos__sucesso" role="status" data-testid="feedback-sucesso-pedidos">
              {pedidos.sucesso}
            </p>
          ) : null}

          {pedidos.erro ? (
            <p className="pedidos__erro" role="alert" data-testid="erro-pedidos">
              {pedidos.erro}
            </p>
          ) : null}

          {naAbaHistorico ? (
            <>
              <FiltrosHistoricoPedidos
                status={pedidos.filtroHistoricoStatus}
                formaPagamento={pedidos.filtroHistoricoFormaPagamento}
                onAlterarStatus={pedidos.definirFiltroHistoricoStatus}
                onAlterarFormaPagamento={pedidos.definirFiltroHistoricoFormaPagamento}
              />
              <div className="pedidos-operacao__grade-scroll">
                <HistoricoPedidosLista
                  itens={pedidos.historicoPedidos}
                  pedidoSelecionadoId={pedidos.historicoPedidoSelecionadoId}
                  onSelecionar={(item) => void pedidos.selecionarHistoricoPedido(item)}
                />
              </div>
            </>
          ) : (
            <>
              {pedidos.exibirCadastroMesas ? (
                <section className="pedidos-operacao__cadastro-mesas">
                  <FormularioMesa
                    carregando={pedidos.carregando}
                    onCriarIntervalo={pedidos.criarMesasPorIntervalo}
                  />
                </section>
              ) : null}

              <div className="pedidos-operacao__grade-scroll">
                <GradeMesas
                  mesas={pedidos.mesas}
                  mesaSelecionadaId={pedidos.mesaSelecionada?.id ?? null}
                  filtroStatus={pedidos.filtroStatusMesas}
                  onSelecionar={(mesa) => void pedidos.selecionarMesaNoGrid(mesa)}
                />
              </div>

              <FiltrosStatusMesas
                filtroAtivo={pedidos.filtroStatusMesas}
                onAlterarFiltro={pedidos.definirFiltroStatusMesas}
              />
            </>
          )}
        </section>
      </div>
    </main>
  )
}
