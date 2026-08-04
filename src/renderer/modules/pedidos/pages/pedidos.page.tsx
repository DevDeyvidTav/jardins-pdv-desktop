import { useEffect, useState } from 'react'
import { FormularioMesa } from '../components/formulario-mesa'
import { GradeMesas } from '../components/grade-mesas'
import { FiltrosStatusMesas } from '../components/filtros-status-mesas'
import { FiltrosHistoricoPedidos } from '../components/filtros-historico-pedidos'
import { HistoricoPedidosLista } from '../components/historico-pedidos-lista'
import { PainelMesaPedido } from '../components/painel-mesa-pedido'
import { ModalTaxaEntregaPadrao } from '../components/modal-taxa-entrega-padrao'
import { FormularioDelivery } from '../../delivery/components/formulario-delivery'
import { ListaDeliveries } from '../../delivery/components/lista-deliveries'
import type { UsePedidosResultado } from '../hooks/use-pedidos'
import './pedidos.css'
import '../../delivery/pages/delivery.css'

interface PedidosPageProps {
  pedidos: UsePedidosResultado
}

export function PedidosPage({ pedidos }: PedidosPageProps) {
  const [exibirFormDelivery, setExibirFormDelivery] = useState(false)
  const [exibirTaxaPadrao, setExibirTaxaPadrao] = useState(false)

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
          mesas={pedidos.mesas}
          resumoPedido={pedidos.resumoPedido}
          resumoAgrupamento={pedidos.resumoAgrupamento}
          produtosAtivos={pedidos.produtosAtivos}
          categoriasAtivas={pedidos.categoriasAtivas}
          exibirFormularioItem={pedidos.exibirFormularioItem}
          carregandoPedido={pedidos.carregandoPedido}
          onAbrirPedido={() => void pedidos.abrirPedidoDaMesaSelecionada()}
          onAdicionarItem={pedidos.abrirFormularioItem}
          onFecharFormularioItem={pedidos.fecharFormularioItem}
          onAdicionarItemPedido={pedidos.adicionarItem}
          onAdicionarPizzaPedido={pedidos.adicionarPizza}
          onAlterarQuantidade={pedidos.alterarQuantidadeItem}
          onRemoverItem={pedidos.removerItem}
          onAplicarDesconto={pedidos.aplicarDescontoPedido}
          onCancelarPedido={pedidos.cancelarPedido}
          onRegistrarPagamento={pedidos.registrarPagamento}
          onCriarDivisaoConta={pedidos.criarDivisaoConta}
          onRegistrarPagamentoParte={pedidos.registrarPagamentoParte}
          onCancelarDivisaoConta={pedidos.cancelarDivisaoConta}
          onTransferirMesa={pedidos.transferirPedidoMesa}
          onAgruparMesas={pedidos.agruparMesasPedido}
          onEncerrarAgrupamento={pedidos.encerrarAgrupamentoManual}
          onRecarregarResumo={async () => {
            if (pedidos.resumoPedido) {
              await pedidos.selecionarDelivery(pedidos.resumoPedido.pedido.id)
            }
          }}
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
                  className="pedidos__botao-secundario"
                  data-testid="botao-taxa-entrega"
                  onClick={() => setExibirTaxaPadrao(true)}
                >
                  Taxa entrega
                </button>
                <button
                  type="button"
                  data-testid="botao-pedido-balcao"
                  onClick={() => void pedidos.abrirPedidoBalcao()}
                >
                  Pedido balcao
                </button>
                <button
                  type="button"
                  className="pedidos-operacao__botao-delivery"
                  data-testid="botao-pedido-delivery"
                  onClick={() => {
                    setExibirFormDelivery(true)
                    pedidos.limparFeedback()
                  }}
                >
                  <span className="pedidos-operacao__icone-delivery" aria-hidden>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M19.15 8.15a1.5 1.5 0 0 0-1.1-.48H15V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v9a1 1 0 0 0 1 1h1.18a2.5 2.5 0 0 0 4.64 0h5.36a2.5 2.5 0 0 0 4.64 0H21a1 1 0 0 0 1-1v-3.17a3 3 0 0 0-.85-2.05l-2-2.03ZM6.5 16.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm10 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2ZM15 9.67h2.67L19.5 11.5H15V9.67Z" />
                    </svg>
                  </span>
                  Delivery
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

              {pedidos.deliveriesAbertos.length > 0 ? (
                <section className="pedidos-operacao__deliveries" data-testid="lista-deliveries-abertos">
                  <h2 className="pedidos-operacao__deliveries-titulo">Deliveries abertos</h2>
                  <ListaDeliveries
                    itens={pedidos.deliveriesAbertos}
                    pedidoSelecionadoId={pedidos.resumoPedido?.pedido.id ?? null}
                    onSelecionar={(id) => void pedidos.selecionarDelivery(id)}
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

      {exibirFormDelivery ? (
        <div className="modal-pagamento" data-testid="modal-novo-delivery">
          <div
            className="modal-pagamento__backdrop"
            onClick={() => setExibirFormDelivery(false)}
          />
          <div className="modal-pagamento__conteudo" role="dialog" aria-modal="true">
            <FormularioDelivery
              carregando={pedidos.carregandoPedido}
              taxaPadraoCentavos={pedidos.taxaEntregaPadraoCentavos}
              onCriar={async (entrada) => {
                const ok = await pedidos.criarPedidoDelivery(entrada)
                if (ok) setExibirFormDelivery(false)
              }}
              onCancelar={() => setExibirFormDelivery(false)}
            />
          </div>
        </div>
      ) : null}

      {exibirTaxaPadrao ? (
        <ModalTaxaEntregaPadrao
          taxaAtualCentavos={pedidos.taxaEntregaPadraoCentavos}
          onSalvar={pedidos.definirTaxaEntregaPadrao}
          onFechar={() => setExibirTaxaPadrao(false)}
        />
      ) : null}
    </main>
  )
}
