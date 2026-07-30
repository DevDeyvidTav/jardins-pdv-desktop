import { useState } from 'react'
import type { Mesa } from '@shared/types/mesa'
import { STATUS_MESA } from '@shared/types/mesa'
import type { ResumoPedido } from '@shared/types/pedido'
import { TIPO_PEDIDO } from '@shared/types/pedido'
import type { CategoriaProduto } from '@shared/types/categoria-produto'
import type { ProdutoComCategoria } from '@shared/types/produto'
import { formatarMoeda } from '@shared/utils/moeda'
import { ROTULOS_STATUS_MESA } from '../constants/mesa-status-cores'
import { BuscaProdutosPedido, ListaItensPedido } from './pedido-itens'
import { FormularioPagamentoPedido } from '../../pagamentos/components/formulario-pagamento-pedido'
import type { PagamentoInformado } from '@shared/types/pagamento-pedido'

interface PainelMesaPedidoProps {
  mesaSelecionada: Mesa | null
  resumoPedido: ResumoPedido | null
  produtosAtivos: ProdutoComCategoria[]
  categoriasAtivas: CategoriaProduto[]
  exibirFormularioItem: boolean
  carregandoPedido: boolean
  onAbrirPedido: () => void
  onAdicionarItem: () => void
  onFecharFormularioItem: () => void
  onAdicionarItemPedido: (
    produtoId: string,
    quantidade: number,
    observacao?: string,
  ) => Promise<boolean>
  onAlterarQuantidade: (itemId: string, quantidade: number) => Promise<boolean>
  onRemoverItem: (itemId: string) => Promise<boolean>
  onRegistrarPagamento: (pagamentos: PagamentoInformado[]) => Promise<boolean>
}

export function PainelMesaPedido({
  mesaSelecionada,
  resumoPedido,
  produtosAtivos,
  categoriasAtivas,
  exibirFormularioItem,
  carregandoPedido,
  onAbrirPedido,
  onAdicionarItem,
  onFecharFormularioItem,
  onAdicionarItemPedido,
  onAlterarQuantidade,
  onRemoverItem,
  onRegistrarPagamento,
}: PainelMesaPedidoProps) {
  const pedidoAtivo = resumoPedido !== null
  const pedidoBalcao = resumoPedido?.pedido.tipo === TIPO_PEDIDO.BALCAO
  const [mostrarPagamento, setMostrarPagamento] = useState(false)

  if (!mesaSelecionada && !pedidoAtivo) {
    return (
      <aside className="painel-mesa-pedido painel-mesa-pedido--vazio" data-testid="painel-mesa-vazio">
        <p className="painel-mesa-pedido__instrucao">
          Selecione uma mesa na grade para ver opcoes e o pedido.
        </p>
      </aside>
    )
  }

  const numeroExibido = pedidoBalcao ? 'Balcao' : (mesaSelecionada?.numero ?? '—')

  const statusExibido = mesaSelecionada
    ? ROTULOS_STATUS_MESA[mesaSelecionada.status]
    : pedidoAtivo
      ? 'Ocupada'
      : ''

  return (
    <aside
      className="painel-mesa-pedido"
      data-testid={pedidoAtivo ? 'pagina-pedido-aberto' : 'painel-mesa-selecionada'}
    >
      <header className="painel-mesa-pedido__cabecalho">
        <div className="painel-mesa-pedido__mesa-info">
          <span className="painel-mesa-pedido__rotulo">Mesa:</span>
          <span className="painel-mesa-pedido__numero" data-testid="painel-mesa-numero">
            {numeroExibido}
          </span>
          {statusExibido ? (
            <span
              className={`painel-mesa-pedido__status painel-mesa-pedido__status--${
                mesaSelecionada?.status.toLowerCase() ?? 'ocupada'
              }`}
              data-testid="mesa-status"
            >
              {statusExibido}
            </span>
          ) : null}
        </div>
      </header>

      {mesaSelecionada && !pedidoAtivo && mesaSelecionada.ativo ? (
        <div className="painel-mesa-pedido__acoes" data-testid="painel-mesa-acoes">
          {mesaSelecionada.status === STATUS_MESA.LIVRE ? (
            <button
              type="button"
              className="painel-mesa-pedido__acao-principal"
              data-testid="botao-abrir-mesa"
              disabled={carregandoPedido}
              onClick={onAbrirPedido}
            >
              Criar pedido
            </button>
          ) : null}

          {mesaSelecionada.status === STATUS_MESA.OCUPADA ? (
            <button
              type="button"
              className="painel-mesa-pedido__acao-principal"
              data-testid="botao-ver-pedido"
              disabled={carregandoPedido}
              onClick={onAbrirPedido}
            >
              Ver pedido
            </button>
          ) : null}
        </div>
      ) : null}

      {pedidoAtivo && resumoPedido ? (
        <>
          <div className="painel-mesa-pedido__lista">
            <div className="painel-mesa-pedido__tabela-cabecalho">
              <span>Qtde</span>
              <span>Produto</span>
              <span>Valor</span>
              <span>Total</span>
            </div>

            <ListaItensPedido
              itens={resumoPedido.itens}
              onAlterarQuantidade={onAlterarQuantidade}
              onRemover={onRemoverItem}
              variant="tabela"
            />
          </div>

          <div className="painel-mesa-pedido__inferior">
            {exibirFormularioItem ? (
              <BuscaProdutosPedido
                produtos={produtosAtivos}
                categorias={categoriasAtivas}
                onAdicionar={onAdicionarItemPedido}
                compacto
              />
            ) : null}

            <footer className="painel-mesa-pedido__rodape">
              <div className="painel-mesa-pedido__totais" data-testid="pedido-totais">
                <span data-testid="pedido-subtotal">
                  Sub: {formatarMoeda(resumoPedido.pedido.subtotalCentavos)}
                </span>
                <span className="painel-mesa-pedido__total" data-testid="pedido-total">
                  {formatarMoeda(resumoPedido.pedido.totalCentavos)}
                </span>
              </div>

              <div className="painel-mesa-pedido__acoes-pedido">
                {exibirFormularioItem ? (
                  <button
                    type="button"
                    className="painel-mesa-pedido__acao-secundaria"
                    data-testid="botao-fechar-adicionar-item"
                    onClick={onFecharFormularioItem}
                  >
                    Fechar
                  </button>
                ) : (
                  <button
                    type="button"
                    className="painel-mesa-pedido__acao-principal"
                    data-testid="botao-adicionar-item-painel"
                    onClick={onAdicionarItem}
                  >
                    Adicionar item
                  </button>
                )}
                {resumoPedido.pedido.status === 'ABERTO' ? (
                  <button
                    type="button"
                    className="painel-mesa-pedido__acao-secundaria"
                    data-testid="botao-abrir-pagamento"
                    onClick={() => setMostrarPagamento(true)}
                  >
                    Receber pagamento
                  </button>
                ) : (
                  <span data-testid="pedido-finalizado">Pedido finalizado</span>
                )}
              </div>
            </footer>
          </div>
        </>
      ) : null}
      {pedidoAtivo && resumoPedido && mostrarPagamento ? (
        <div className="modal-pagamento" data-testid="modal-pagamento">
          <div
            className="modal-pagamento__backdrop"
            onClick={() => setMostrarPagamento(false)}
          />
          <div className="modal-pagamento__conteudo" role="dialog" aria-modal="true">
            <header className="modal-pagamento__cabecalho">
              <div>
                <h2>Pagamento do pedido</h2>
                <p className="modal-pagamento__total">
                  Total: {formatarMoeda(resumoPedido.pedido.totalCentavos)}
                </p>
              </div>
              <button
                type="button"
                className="modal-pagamento__fechar"
                onClick={() => setMostrarPagamento(false)}
              >
                Fechar
              </button>
            </header>
            <FormularioPagamentoPedido
              totalCentavos={resumoPedido.pedido.totalCentavos}
              onConfirmar={async (pagamentos) => {
                const ok = await onRegistrarPagamento(pagamentos)
                if (ok) setMostrarPagamento(false)
                return ok
              }}
            />
          </div>
        </div>
      ) : null}
    </aside>
  )
}
