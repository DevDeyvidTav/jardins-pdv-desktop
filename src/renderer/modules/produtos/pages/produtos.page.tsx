import { FormularioCategoria } from '../components/formulario-categoria'
import { ListaCategorias } from '../components/lista-categorias'
import { FormularioProduto } from '../components/formulario-produto'
import { ListaProdutos } from '../components/lista-produtos'
import { BuscaProdutos } from '../components/busca-produtos'
import type { UseProdutosResultado } from '../hooks/use-produtos'
import './produtos.css'

interface ProdutosPageProps {
  produtos: UseProdutosResultado
}

export function ProdutosPage({ produtos }: ProdutosPageProps) {
  return (
    <main className="produtos" data-testid="pagina-produtos">
      <section className="produtos__cartao">
        <h1>Catalogo de Produtos</h1>

        {produtos.sucesso ? (
          <p className="produtos__sucesso" role="status" data-testid="feedback-sucesso-produtos">
            {produtos.sucesso}
          </p>
        ) : null}

        <section className="produtos__secao">
          <h2>Categorias</h2>
          <FormularioCategoria
            carregando={produtos.carregando}
            erroExterno={produtos.erro}
            onCriar={produtos.criarCategoria}
            onLimparFeedback={produtos.limparFeedback}
          />
          <ListaCategorias
            categorias={produtos.categorias}
            onInativar={produtos.inativarCategoria}
            onReativar={produtos.reativarCategoria}
          />
        </section>

        <section className="produtos__secao">
          <h2>Produtos</h2>
          <FormularioProduto
            categorias={produtos.categorias}
            carregando={produtos.carregando}
            onCriar={produtos.criarProduto}
            onLimparFeedback={produtos.limparFeedback}
          />

          <BuscaProdutos
            termo={produtos.termoBusca}
            categoriaFiltroId={produtos.categoriaFiltroId}
            categorias={produtos.categorias.filter((categoria) => categoria.ativo)}
            onTermoChange={produtos.definirTermoBusca}
            onCategoriaChange={produtos.definirCategoriaFiltro}
          />

          <ListaProdutos
            produtos={produtos.produtos}
            titulo="Selecao principal (ativos)"
            onInativar={produtos.inativarProduto}
          />

          <ListaProdutos
            produtos={produtos.produtosAdministrativos}
            titulo="Visao administrativa (todos)"
            exibirInativos
            onReativar={produtos.reativarProduto}
          />
        </section>
      </section>
    </main>
  )
}
