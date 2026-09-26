import { useEffect, useState } from 'react'
import { LogoMarca } from '../componentes/logo-marca'
import '../componentes/logo-marca.css'
import { AberturaCaixaPage } from '../modules/caixa/pages/abertura-caixa.page'
import { CaixaAtualPage } from '../modules/caixa/pages/caixa-atual.page'
import { FechamentoCaixaPage } from '../modules/caixa/pages/fechamento-caixa.page'
import { PosFechamentoCaixaPage } from '../modules/caixa/pages/pos-fechamento-caixa.page'
import { CardapioPage } from '../modules/produtos/pages/cardapio.page'
import { PedidosPage } from '../modules/pedidos/pages/pedidos.page'
import { ModalEmissaoNfce } from '../modules/fiscal/components/modal-emissao-nfce'
import { ClientesPage } from '../modules/clientes/pages/clientes.page'
import { ConfiguracoesPage } from '../modules/configuracoes/pages/configuracoes.page'
import { TelaLoginOperador } from '../modules/configuracoes/pages/tela-login-operador'
import { ModalAtualizacao } from '../modules/configuracoes/components/modal-atualizacao'
import { useOperador } from '../modules/configuracoes/hooks/use-operador'
import { useCaixa } from '../modules/caixa/hooks/use-caixa'
import { useProdutos } from '../modules/produtos/hooks/use-produtos'
import { usePizzas } from '../modules/pizzas/hooks/use-pizzas'
import { usePedidos } from '../modules/pedidos/hooks/use-pedidos'
import { useClientes } from '../modules/clientes/hooks/use-clientes'
import { STATUS_SESSAO_CAIXA } from '@shared/types/sessao-caixa'
import { PERMISSAO_PDV } from '@shared/types/operador'
import type { UseOperadorResultado } from '../modules/configuracoes/hooks/use-operador'
import '../modules/produtos/pages/produtos.css'
import '../modules/pedidos/pages/pedidos.css'
import '../modules/pizzas/pages/pizzas.css'
import '../modules/clientes/pages/clientes.css'
import '../modules/configuracoes/pages/configuracoes.css'

type SecaoApp = 'caixa' | 'produtos' | 'pedidos' | 'clientes' | 'configuracoes'

function NavegacaoPrincipal({
  secaoAtiva,
  onMudarSecao,
  operador,
}: {
  secaoAtiva: SecaoApp
  onMudarSecao: (secao: SecaoApp) => void
  operador: UseOperadorResultado
}) {
  const podeConfigurar = operador.temPermissao(PERMISSAO_PDV.CONFIGURACOES)

  return (
    <nav className="navegacao-principal" data-testid="navegacao-principal">
      <LogoMarca tamanho="compacto" />
      <div className="navegacao-principal__links">
        <button
          type="button"
          data-testid="nav-caixa"
          data-ativo={secaoAtiva === 'caixa'}
          onClick={() => onMudarSecao('caixa')}
        >
          Caixa
        </button>
        <button
          type="button"
          data-testid="nav-produtos"
          data-ativo={secaoAtiva === 'produtos'}
          onClick={() => onMudarSecao('produtos')}
        >
          Cardápio
        </button>
        <button
          type="button"
          data-testid="nav-pedidos"
          data-ativo={secaoAtiva === 'pedidos'}
          onClick={() => onMudarSecao('pedidos')}
        >
          Pedidos
        </button>
        <button
          type="button"
          data-testid="nav-clientes"
          data-ativo={secaoAtiva === 'clientes'}
          onClick={() => onMudarSecao('clientes')}
        >
          Clientes
        </button>
        {podeConfigurar ? (
          <button
            type="button"
            data-testid="nav-configuracoes"
            data-ativo={secaoAtiva === 'configuracoes'}
            onClick={() => onMudarSecao('configuracoes')}
          >
            Configurações
          </button>
        ) : null}
      </div>
    </nav>
  )
}

function FluxoCaixa({ operadorAtivo }: { operadorAtivo: import('@shared/types/operador').OperadorConfig | null }) {
  const caixa = useCaixa(operadorAtivo)

  if (caixa.carregando) {
    return (
      <main className="app-carregando" data-testid="app-carregando">
        <p>Carregando...</p>
      </main>
    )
  }

  if (
    !caixa.sessaoAberta &&
    caixa.paginaAtiva === 'pos-fechamento' &&
    caixa.ultimaSessao?.status === STATUS_SESSAO_CAIXA.FECHADO
  ) {
    return <PosFechamentoCaixaPage caixa={caixa} />
  }

  if (!caixa.sessaoAberta) {
    return <AberturaCaixaPage caixa={caixa} />
  }

  if (caixa.paginaAtiva === 'fechamento') {
    return <FechamentoCaixaPage caixa={caixa} />
  }

  return <CaixaAtualPage caixa={caixa} />
}

export function App() {
  const [secaoAtiva, setSecaoAtiva] = useState<SecaoApp>('caixa')
  const operador = useOperador()
  const produtos = useProdutos()
  const pizzas = usePizzas()
  const pedidos = usePedidos()
  const clientes = useClientes()
  const operadorAtivo = operador.autenticado ? operador.operador : null
  const podeConfigurar = operador.temPermissao(PERMISSAO_PDV.CONFIGURACOES)
  const podeEditarFiscal = operador.temPermissao(PERMISSAO_PDV.FISCAL_PRODUTO)
  const podeEditarCatalogoPizza = operador.temPermissao(PERMISSAO_PDV.CATALOGO_PIZZA)
  const podeAlterarTaxaEntrega = operador.temPermissao(PERMISSAO_PDV.TAXA_ENTREGA_PADRAO)

  useEffect(() => {
    if (!operador.autenticado) {
      return
    }

    if (secaoAtiva === 'configuracoes' && !podeConfigurar) {
      setSecaoAtiva('caixa')
    }
  }, [operador.autenticado, podeConfigurar, secaoAtiva])

  if (!operador.autenticado) {
    return <TelaLoginOperador operador={operador} />
  }

  return (
    <>
      <NavegacaoPrincipal
        secaoAtiva={secaoAtiva}
        onMudarSecao={setSecaoAtiva}
        operador={operador}
      />
      {secaoAtiva === 'produtos' ? (
        <CardapioPage
          produtos={produtos}
          pizzas={pizzas}
          permitirFiscal={podeEditarFiscal}
          permitirCatalogoPizza={podeEditarCatalogoPizza}
        />
      ) : secaoAtiva === 'pedidos' ? (
        <PedidosPage
          pedidos={pedidos}
          permitirAlterarTaxaEntrega={podeAlterarTaxaEntrega}
        />
      ) : secaoAtiva === 'clientes' ? (
        <ClientesPage clientes={clientes} />
      ) : secaoAtiva === 'configuracoes' && podeConfigurar ? (
        <ConfiguracoesPage operador={operador} />
      ) : (
        <FluxoCaixa operadorAtivo={operadorAtivo} />
      )}
      {pedidos.emissaoNfcePedidoId ? (
        <ModalEmissaoNfce
          pedidoId={pedidos.emissaoNfcePedidoId}
          onFechar={pedidos.fecharEmissaoNfce}
        />
      ) : null}
      <ModalAtualizacao />
    </>
  )
}
