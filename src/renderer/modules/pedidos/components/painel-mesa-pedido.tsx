import { useState } from 'react'
import type { Mesa, ResumoMesaAgrupamento } from '@shared/types/mesa'
import type { Cliente } from '@shared/types/cliente'
import { STATUS_MESA } from '@shared/types/mesa'
import type { ResumoPedido } from '@shared/types/pedido'
import { TIPO_PEDIDO } from '@shared/types/pedido'
import type { CategoriaProduto } from '@shared/types/categoria-produto'
import type { ProdutoComCategoria } from '@shared/types/produto'
import {
  STATUS_DIVISAO_CONTA,
  type CriarParteDivisaoEntrada,
} from '@shared/types/divisao-conta'
import { formatarMoeda, converterReaisParaCentavos } from '@shared/utils/moeda'
import { ROTULOS_STATUS_MESA } from '../constants/mesa-status-cores'
import { ModalMotivoCancelamento } from './modal-motivo-cancelamento'
import { FormularioAdicionarItemPedido } from './formulario-adicionar-item-pedido'
import { ListaItensPedido } from './pedido-itens'
import { FormularioPagamentoPedido } from '../../pagamentos/components/formulario-pagamento-pedido'
import { DadosEntrega } from '../../delivery/components/dados-entrega'
import { StatusEntregaPanel } from '../../delivery/components/status-entrega'
import { ModalTransferirMesa } from './modal-transferir-mesa'
import { ModalAgruparMesas } from './modal-agrupar-mesas'
import { ModalDividirConta } from './modal-dividir-conta'
import { PainelDivisaoConta } from './painel-divisao-conta'
import type { PagamentoInformado } from '@shared/types/pagamento-pedido'
import { itemPedidoEstaAtivo } from '@shared/types/pedido'
import { useImpressaoPedido } from '../../impressao/hooks/use-impressao-pedido'

interface PainelMesaPedidoProps {
  mesaSelecionada: Mesa | null
  mesas: Mesa[]
  resumoPedido: ResumoPedido | null
  resumoAgrupamento: ResumoMesaAgrupamento | null
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
  onAdicionarPizzaPedido: (
    categoriaId: string,
    tamanhoId: string,
    saborIds: string[],
    observacao?: string,
  ) => Promise<boolean>
  onAlterarQuantidade: (itemId: string, quantidade: number) => Promise<boolean>
  onRemoverItem: (itemId: string, motivoCancelamento: string) => Promise<boolean>
  onAplicarDesconto?: (
    descontoCentavos: number,
    motivoDesconto?: string,
  ) => Promise<boolean>
  onCancelarPedido: (motivoCancelamento: string) => Promise<boolean>
  onRegistrarPagamento: (pagamento: PagamentoInformado) => Promise<boolean>
  onCriarDivisaoConta: (partes: CriarParteDivisaoEntrada[]) => Promise<boolean>
  onRegistrarPagamentoParte: (
    parteId: string,
    pagamento: PagamentoInformado,
  ) => Promise<boolean>
  onCancelarDivisaoConta: (motivo?: string) => Promise<boolean>
  onTransferirMesa?: (mesaDestinoId: string, motivo: string) => Promise<boolean>
  onAgruparMesas?: (mesaIds: string[], motivo?: string) => Promise<boolean>
  onEncerrarAgrupamento?: (observacao?: string) => Promise<boolean>
  onRecarregarResumo?: () => Promise<void>
  onVincularCliente?: (clienteId: string | null) => Promise<boolean>
  clientes?: Cliente[]
  erroPagamento?: string | null
}

export function PainelMesaPedido({
  mesaSelecionada,
  mesas,
  resumoPedido,
  resumoAgrupamento,
  produtosAtivos,
  categoriasAtivas,
  exibirFormularioItem,
  carregandoPedido,
  onAbrirPedido,
  onAdicionarItem,
  onFecharFormularioItem,
  onAdicionarItemPedido,
  onAdicionarPizzaPedido,
  onAlterarQuantidade,
  onRemoverItem,
  onAplicarDesconto,
  onCancelarPedido,
  onRegistrarPagamento,
  onCriarDivisaoConta,
  onRegistrarPagamentoParte,
  onCancelarDivisaoConta,
  onTransferirMesa,
  onAgruparMesas,
  onEncerrarAgrupamento,
  onRecarregarResumo,
  onVincularCliente,
  clientes = [],
  erroPagamento = null,
}: PainelMesaPedidoProps) {
  const pedidoAtivo = resumoPedido !== null
  const pedidoBalcao = resumoPedido?.pedido.tipo === TIPO_PEDIDO.BALCAO
  const pedidoDelivery = resumoPedido?.pedido.tipo === TIPO_PEDIDO.DELIVERY
  const pedidoMesa = resumoPedido?.pedido.tipo === TIPO_PEDIDO.MESA
  const temAgrupamentoAtivo = Boolean(resumoAgrupamento)
  const clienteVinculado = clientes.find((c) => c.id === resumoPedido?.pedido.clienteId)
  const permitirTalao = Boolean(
    clienteVinculado?.ativo && clienteVinculado.liberaTalao,
  )
  const divisaoAtiva =
    resumoPedido?.divisao?.divisao.status === STATUS_DIVISAO_CONTA.ATIVA
  const podeDividirConta =
    Boolean(resumoPedido) &&
    resumoPedido!.pedido.status === 'ABERTO' &&
    resumoPedido!.pedido.totalCentavos > 0 &&
    resumoPedido!.pedido.valorPagoCentavos === 0 &&
    resumoPedido!.pedido.valorCortesiaCentavos === 0 &&
    !resumoPedido!.divisao
  const impressao = useImpressaoPedido()
  const [mostrarPagamento, setMostrarPagamento] = useState(false)
  const [mostrarDesconto, setMostrarDesconto] = useState(false)
  const [mostrarConfirmacaoCancelar, setMostrarConfirmacaoCancelar] = useState(false)
  const [mostrarTransferir, setMostrarTransferir] = useState(false)
  const [mostrarAgrupar, setMostrarAgrupar] = useState(false)
  const [mostrarDividirConta, setMostrarDividirConta] = useState(false)
  const [cancelandoPedido, setCancelandoPedido] = useState(false)
  const [valorDescontoReais, setValorDescontoReais] = useState('')
  const [motivoDesconto, setMotivoDesconto] = useState('')
  const [erroDesconto, setErroDesconto] = useState<string | null>(null)

  if (!mesaSelecionada && !pedidoAtivo) {
    return (
      <aside className="painel-mesa-pedido painel-mesa-pedido--vazio" data-testid="painel-mesa-vazio">
        <p className="painel-mesa-pedido__instrucao">
          Selecione uma mesa na grade para ver opcoes e o pedido.
        </p>
      </aside>
    )
  }

  const numeroExibido = pedidoDelivery
    ? `Delivery${resumoPedido?.entrega ? ` · ${resumoPedido.entrega.clienteNome}` : ''}`
    : pedidoBalcao
      ? 'Balcao'
      : (mesaSelecionada?.numero ?? '—')

  const statusExibido = mesaSelecionada
    ? ROTULOS_STATUS_MESA[mesaSelecionada.status]
    : pedidoAtivo
      ? 'Ocupada'
      : ''

  const handleConfirmarCancelamento = async (motivoCancelamento: string) => {
    setCancelandoPedido(true)
    try {
      const ok = await onCancelarPedido(motivoCancelamento)
      if (ok) setMostrarConfirmacaoCancelar(false)
    } finally {
      setCancelandoPedido(false)
    }
  }

  const handleConfirmarDesconto = async () => {
    setErroDesconto(null)
    const centavos = converterReaisParaCentavos(valorDescontoReais)
    if (centavos === null) {
      setErroDesconto('Informe um valor valido de desconto em reais.')
      return
    }

    if (centavos <= 0) {
      setErroDesconto('Informe um valor valido de desconto em reais.')
      return
    }

    if (!motivoDesconto.trim()) {
      setErroDesconto('Informe o motivo do desconto.')
      return
    }

    if (onAplicarDesconto) {
      const ok = await onAplicarDesconto(centavos, motivoDesconto.trim())
      if (ok) {
        setMostrarDesconto(false)
        setValorDescontoReais('')
        setMotivoDesconto('')
      }
    }
  }

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
          {pedidoAtivo && resumoPedido.pedido.referencia > 0 ? (
            <span
              className="painel-mesa-pedido__referencia"
              data-testid="pedido-referencia"
            >
              #{resumoPedido.pedido.referencia}
            </span>
          ) : null}
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

        {pedidoAtivo && resumoPedido?.pedido.status === 'ABERTO' && !divisaoAtiva ? (
          <button
            type="button"
            className="painel-mesa-pedido__botao-receber"
            data-testid="botao-abrir-pagamento"
            onClick={() => setMostrarPagamento(true)}
          >
            <span className="painel-mesa-pedido__botao-receber-icone" aria-hidden>
              $
            </span>
            Receber
          </button>
        ) : null}

        {podeDividirConta ? (
          <button
            type="button"
            className="painel-mesa-pedido__acao-secundaria"
            data-testid="botao-dividir-conta"
            onClick={() => setMostrarDividirConta(true)}
          >
            Dividir conta
          </button>
        ) : null}

        {pedidoAtivo && resumoPedido?.pedido.status === 'FINALIZADO' ? (
          <span data-testid="pedido-finalizado" className="painel-mesa-pedido__finalizado">
            Finalizado
          </span>
        ) : null}
      </header>

      <div className="painel-mesa-pedido__conteudo">
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

          {mesaSelecionada.status === STATUS_MESA.OCUPADA ||
          mesaSelecionada.status === STATUS_MESA.AGRUPADA ? (
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
          {resumoPedido.pedido.status === 'ABERTO' && onVincularCliente ? (
            <label className="painel-mesa-pedido__campo-cliente" htmlFor="pedido-cliente">
              Cliente
              <select
                id="pedido-cliente"
                data-testid="select-cliente-pedido"
                value={resumoPedido.pedido.clienteId ?? ''}
                disabled={carregandoPedido}
                onChange={(evento) => {
                  const valor = evento.target.value
                  void onVincularCliente(valor ? valor : null)
                }}
              >
                <option value="">Sem cliente</option>
                {clientes
                  .filter((cliente) => cliente.ativo)
                  .map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                      {cliente.liberaTalao ? ' · talão' : ''}
                    </option>
                  ))}
              </select>
            </label>
          ) : null}

          {resumoPedido.entrega ? <DadosEntrega entrega={resumoPedido.entrega} /> : null}

          {temAgrupamentoAtivo && resumoAgrupamento ? (
            <div className="painel-mesa-pedido__agrupamento" data-testid="selo-agrupamento">
              <strong>Mesas agrupadas</strong>
              <ul>
                {resumoAgrupamento.mesas
                  .filter((m) => !m.removidaEm)
                  .map((mesa) => (
                    <li key={mesa.id}>
                      Mesa {mesa.numero}
                      {mesa.ehPrincipal ? ' (principal)' : ''}
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}

          {resumoPedido.entrega && resumoPedido.pedido.status === 'ABERTO' ? (
            <StatusEntregaPanel
              entrega={resumoPedido.entrega}
              pedidoFinalizado={false}
              carregando={carregandoPedido}
              onAvancar={async (status) => {
                await window.pdv.delivery.atualizarStatusEntrega({
                  pedidoId: resumoPedido.pedido.id,
                  status,
                })
                await onRecarregarResumo?.()
              }}
            />
          ) : null}

          {resumoPedido.divisao &&
          (resumoPedido.divisao.divisao.status === STATUS_DIVISAO_CONTA.ATIVA ||
            resumoPedido.divisao.divisao.status === STATUS_DIVISAO_CONTA.QUITADA) ? (
            <PainelDivisaoConta
              resumo={resumoPedido.divisao}
              erroExterno={erroPagamento}
              permitirTalao={permitirTalao}
              onRegistrarPagamentoParte={onRegistrarPagamentoParte}
              onCancelarDivisao={onCancelarDivisaoConta}
            />
          ) : null}

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
              editavel={resumoPedido.pedido.status === 'ABERTO'}
            />
          </div>

          <div className="painel-mesa-pedido__inferior">
            {exibirFormularioItem && resumoPedido.pedido.status === 'ABERTO' ? (
              <FormularioAdicionarItemPedido
                produtos={produtosAtivos}
                categoriasProduto={categoriasAtivas}
                onAdicionarProduto={onAdicionarItemPedido}
                onAdicionarPizza={onAdicionarPizzaPedido}
              />
            ) : null}

            <footer className="painel-mesa-pedido__rodape">
              {resumoPedido.pedido.status === 'ABERTO' ? (
                <div className="painel-mesa-pedido__acoes-pedido">
                  {exibirFormularioItem ? (
                    <button
                      type="button"
                      className="painel-mesa-pedido__acao-secundaria"
                      data-testid="botao-fechar-adicionar-item"
                      onClick={onFecharFormularioItem}
                    >
                      Fechar busca
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

                  {resumoPedido.itens.some(itemPedidoEstaAtivo) ? (
                    <>
                      <button
                        type="button"
                        className="painel-mesa-pedido__acao-secundaria"
                        data-testid="botao-imprimir-conta"
                        disabled={impressao.carregando}
                        onClick={() =>
                          void impressao.imprimirConta(resumoPedido.pedido.id)
                        }
                      >
                        Imprimir conta
                      </button>
                      <button
                        type="button"
                        className="painel-mesa-pedido__acao-secundaria"
                        data-testid="botao-imprimir-comanda"
                        disabled={impressao.carregando}
                        onClick={() =>
                          void impressao.imprimirComanda(resumoPedido.pedido.id)
                        }
                      >
                        Imprimir comanda
                      </button>
                    </>
                  ) : null}

                  <button
                    type="button"
                    className="painel-mesa-pedido__acao-secundaria"
                    data-testid="botao-abrir-desconto"
                    onClick={() => setMostrarDesconto(true)}
                  >
                    Desconto
                  </button>

                  {pedidoMesa && mesaSelecionada && onTransferirMesa && !temAgrupamentoAtivo ? (
                    <button
                      type="button"
                      className="painel-mesa-pedido__acao-secundaria"
                      data-testid="botao-transferir-mesa"
                      onClick={() => setMostrarTransferir(true)}
                    >
                      Transferir mesa
                    </button>
                  ) : null}

                  {pedidoMesa && mesaSelecionada && onAgruparMesas && !temAgrupamentoAtivo ? (
                    <button
                      type="button"
                      className="painel-mesa-pedido__acao-secundaria"
                      data-testid="botao-agrupar-mesas"
                      onClick={() => setMostrarAgrupar(true)}
                    >
                      Agrupar mesas
                    </button>
                  ) : null}

                  {pedidoMesa && temAgrupamentoAtivo && onEncerrarAgrupamento ? (
                    <button
                      type="button"
                      className="painel-mesa-pedido__acao-secundaria"
                      data-testid="botao-encerrar-agrupamento"
                      onClick={() => void onEncerrarAgrupamento()}
                    >
                      Encerrar agrupamento
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className="painel-mesa-pedido__acao-cancelar"
                    data-testid="botao-cancelar-pedido"
                    onClick={() => setMostrarConfirmacaoCancelar(true)}
                  >
                    Cancelar pedido
                  </button>
                </div>
              ) : null}

              {impressao.sucesso ? (
                <p
                  className="painel-mesa-pedido__feedback-impressao"
                  role="status"
                  data-testid="feedback-sucesso-impressao"
                >
                  {impressao.sucesso}
                </p>
              ) : null}
              {impressao.erro ? (
                <p
                  className="painel-mesa-pedido__feedback-impressao painel-mesa-pedido__feedback-impressao--erro"
                  role="alert"
                  data-testid="feedback-erro-impressao"
                >
                  {impressao.erro}
                </p>
              ) : null}

              <div className="painel-mesa-pedido__cupom" data-testid="pedido-totais">
                <div className="painel-mesa-pedido__cupom-linha">
                  <span>Subtotal</span>
                  <span data-testid="pedido-subtotal">
                    {formatarMoeda(resumoPedido.pedido.subtotalCentavos)}
                  </span>
                </div>
                <div className="painel-mesa-pedido__cupom-linha">
                  <span>Desc. itens</span>
                  <span data-testid="pedido-desconto-itens">
                    {formatarMoeda(resumoPedido.pedido.descontoItensCentavos)}
                  </span>
                </div>
                <div className="painel-mesa-pedido__cupom-linha">
                  <span>Desc. pedido</span>
                  <span data-testid="pedido-desconto-geral">
                    {formatarMoeda(resumoPedido.pedido.descontoPedidoCentavos)}
                  </span>
                </div>
                {resumoPedido.pedido.taxaEntregaCentavos > 0 || pedidoDelivery ? (
                  <div className="painel-mesa-pedido__cupom-linha">
                    <span>Taxa entrega</span>
                    <span data-testid="pedido-taxa-entrega">
                      {formatarMoeda(resumoPedido.pedido.taxaEntregaCentavos)}
                    </span>
                  </div>
                ) : null}
                <div className="painel-mesa-pedido__cupom-linha painel-mesa-pedido__cupom-linha--total">
                  <span>Total</span>
                  <span data-testid="pedido-total">
                    {formatarMoeda(resumoPedido.pedido.totalCentavos)}
                  </span>
                </div>
                <div className="painel-mesa-pedido__cupom-linha">
                  <span>Pago</span>
                  <span data-testid="pedido-valor-pago">
                    {formatarMoeda(resumoPedido.pedido.valorPagoCentavos)}
                  </span>
                </div>
                <div className="painel-mesa-pedido__cupom-linha">
                  <span>Cortesia</span>
                  <span data-testid="pedido-valor-cortesia">
                    {formatarMoeda(resumoPedido.pedido.valorCortesiaCentavos)}
                  </span>
                </div>
                <div className="painel-mesa-pedido__cupom-linha painel-mesa-pedido__cupom-linha--restante">
                  <span>Restante</span>
                  <span data-testid="pedido-valor-restante">
                    {formatarMoeda(resumoPedido.pedido.valorRestanteCentavos)}
                  </span>
                </div>
              </div>
            </footer>
          </div>
        </>
      ) : null}
      </div>

      {mostrarConfirmacaoCancelar ? (
        <ModalMotivoCancelamento
          titulo="Cancelar pedido"
          descricao="Deseja realmente cancelar este pedido? Itens ativos serao cancelados e a mesa sera liberada, se houver."
          testId="modal-confirmar-cancelamento"
          confirmando={cancelandoPedido}
          onFechar={() => {
            if (!cancelandoPedido) setMostrarConfirmacaoCancelar(false)
          }}
          onConfirmar={handleConfirmarCancelamento}
        />
      ) : null}

      {pedidoAtivo && resumoPedido && mostrarDesconto ? (
        <div className="modal-pagamento" data-testid="modal-desconto-pedido">
          <div
            className="modal-pagamento__backdrop"
            onClick={() => setMostrarDesconto(false)}
          />
          <div className="modal-pagamento__conteudo" role="dialog" aria-modal="true">
            <header className="modal-pagamento__cabecalho">
              <h2>Desconto geral no pedido</h2>
              <button
                type="button"
                className="modal-pagamento__fechar"
                onClick={() => setMostrarDesconto(false)}
              >
                Fechar
              </button>
            </header>
            <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>
                  Valor do Desconto (R$):
                </label>
                <input
                  type="text"
                  placeholder="0,00"
                  value={valorDescontoReais}
                  onChange={(e) => setValorDescontoReais(e.target.value)}
                  data-testid="input-desconto-pedido"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>
                  Motivo *:
                </label>
                <input
                  type="text"
                  placeholder="Motivo do desconto"
                  value={motivoDesconto}
                  onChange={(e) => setMotivoDesconto(e.target.value)}
                  data-testid="input-motivo-desconto"
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
              {erroDesconto ? (
                <p style={{ color: '#dc2626', fontSize: '13px' }}>{erroDesconto}</p>
              ) : null}
              <button
                type="button"
                className="painel-mesa-pedido__acao-principal"
                data-testid="botao-confirmar-desconto"
                onClick={() => void handleConfirmarDesconto()}
              >
                Aplicar Desconto
              </button>
            </div>
          </div>
        </div>
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
                  Total do Pedido: {formatarMoeda(resumoPedido.pedido.totalCentavos)}
                </p>
                <p className="modal-pagamento__total" style={{ fontSize: '14px', color: '#4b5563' }}>
                  Restante: {formatarMoeda(resumoPedido.pedido.valorRestanteCentavos)}
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
              totalCentavos={resumoPedido.pedido.valorRestanteCentavos}
              erroExterno={erroPagamento}
              permitirTalao={permitirTalao}
              onConfirmar={async (pagamento) => {
                const ok = await onRegistrarPagamento(pagamento)
                if (ok) setMostrarPagamento(false)
                return ok
              }}
            />
          </div>
        </div>
      ) : null}

      {mostrarDividirConta && resumoPedido ? (
        <ModalDividirConta
          totalCentavos={resumoPedido.pedido.totalCentavos}
          carregando={carregandoPedido}
          erroExterno={erroPagamento}
          onConfirmar={onCriarDivisaoConta}
          onFechar={() => setMostrarDividirConta(false)}
        />
      ) : null}

      {mostrarTransferir && mesaSelecionada && onTransferirMesa ? (
        <ModalTransferirMesa
          mesaAtual={mesaSelecionada}
          mesas={mesas}
          carregando={carregandoPedido}
          onConfirmar={onTransferirMesa}
          onFechar={() => setMostrarTransferir(false)}
        />
      ) : null}

      {mostrarAgrupar && mesaSelecionada && onAgruparMesas ? (
        <ModalAgruparMesas
          mesaPrincipal={mesaSelecionada}
          mesas={mesas}
          carregando={carregandoPedido}
          onConfirmar={onAgruparMesas}
          onFechar={() => setMostrarAgrupar(false)}
        />
      ) : null}
    </aside>
  )
}
