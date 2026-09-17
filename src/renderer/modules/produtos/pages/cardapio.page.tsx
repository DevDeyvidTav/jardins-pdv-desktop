import { useState } from 'react'
import { ProdutosPage } from '../../produtos/pages/produtos.page'
import type { UseProdutosResultado } from '../../produtos/hooks/use-produtos'
import { PizzasCatalogo } from '../../pizzas/pages/pizzas-catalogo'
import type { UsePizzasResultado } from '../../pizzas/hooks/use-pizzas'
import '../../pizzas/pages/pizzas.css'

interface CardapioPageProps {
  produtos: UseProdutosResultado
  pizzas: UsePizzasResultado
  permitirFiscal?: boolean
  permitirCatalogoPizza?: boolean
}

type AbaCardapio = 'produtos' | 'pizzas'

export function CardapioPage({
  produtos,
  pizzas,
  permitirFiscal = false,
  permitirCatalogoPizza = false,
}: CardapioPageProps) {
  const [abaAtiva, setAbaAtiva] = useState<AbaCardapio>('produtos')

  return (
    <main className="cardapio" data-testid="pagina-cardapio">
      <header className="cardapio__cabecalho">
        <h1>Cardápio</h1>
        <div className="cardapio__abas" data-testid="abas-cardapio">
          <button
            type="button"
            className="cardapio__aba"
            data-ativo={abaAtiva === 'produtos'}
            data-testid="aba-cardapio-produtos"
            onClick={() => setAbaAtiva('produtos')}
          >
            Produtos
          </button>
          <button
            type="button"
            className="cardapio__aba"
            data-ativo={abaAtiva === 'pizzas'}
            data-testid="aba-cardapio-pizzas"
            onClick={() => setAbaAtiva('pizzas')}
          >
            Pizzas
          </button>
        </div>
      </header>

      <div className="cardapio__conteudo">
        {abaAtiva === 'produtos' ? (
          <ProdutosPage produtos={produtos} permitirFiscal={permitirFiscal} />
        ) : (
          <PizzasCatalogo pizzas={pizzas} permitirEdicao={permitirCatalogoPizza} />
        )}
      </div>
    </main>
  )
}
