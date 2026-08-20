import { useState } from 'react'
import { LogoMarca } from '../componentes/logo-marca'
import '../componentes/logo-marca.css'
import { AberturaCaixaPage } from '../modules/caixa/pages/abertura-caixa.page'
import { CaixaAtualPage } from '../modules/caixa/pages/caixa-atual.page'
import { FechamentoCaixaPage } from '../modules/caixa/pages/fechamento-caixa.page'
import { PosFechamentoCaixaPage } from '../modules/caixa/pages/pos-fechamento-caixa.page'
import { CardapioPage } from '../modules/produtos/pages/cardapio.page'
import { PedidosPage } from '../modules/pedidos/pages/pedidos.page'
import { ClientesPage } from '../modules/clientes/pages/clientes.page'
import { useCaixa } from '../modules/caixa/hooks/use-caixa'
import { useProdutos } from '../modules/produtos/hooks/use-produtos'
import { usePizzas } from '../modules/pizzas/hooks/use-pizzas'
import { usePedidos } from '../modules/pedidos/hooks/use-pedidos'
import { useClientes } from '../modules/clientes/hooks/use-clientes'
import { STATUS_SESSAO_CAIXA } from '@shared/types/sessao-caixa'
import '../modules/produtos/pages/produtos.css'
import '../modules/pedidos/pages/pedidos.css'
import '../modules/pizzas/pages/pizzas.css'
import '../modules/clientes/pages/clientes.css'

type SecaoApp = 'caixa' | 'produtos' | 'pedidos' | 'clientes'

function NavegacaoPrincipal({
  secaoAtiva,
  onMudarSecao,
}: {
  secaoAtiva: SecaoApp
  onMudarSecao: (secao: SecaoApp) => void
}) {
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
      </div>
    </nav>
  )
}

function FluxoCaixa() {
  const caixa = useCaixa()

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
  const produtos = useProdutos()
  const pizzas = usePizzas()
  const pedidos = usePedidos()
  const clientes = useClientes()

  return (
    <>
      <NavegacaoPrincipal secaoAtiva={secaoAtiva} onMudarSecao={setSecaoAtiva} />
      {secaoAtiva === 'produtos' ? (
        <CardapioPage produtos={produtos} pizzas={pizzas} />
      ) : secaoAtiva === 'pedidos' ? (
        <PedidosPage pedidos={pedidos} />
      ) : secaoAtiva === 'clientes' ? (
        <ClientesPage clientes={clientes} />
      ) : (
        <FluxoCaixa />
      )}
    </>
  )
}
