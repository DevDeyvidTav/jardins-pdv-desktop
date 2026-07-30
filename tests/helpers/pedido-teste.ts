import { prepararBancoTeste } from './banco-teste'
import { criarAbrirSessaoCaixa } from '../../src/main/modules/caixa/use-cases/abrir-sessao-caixa'
import { criarSessaoCaixaRepository } from '../../src/main/modules/caixa/repositories/sessao-caixa.repository'
import { criarCategoriaProdutoRepository } from '../../src/main/modules/produtos/repositories/categoria-produto.repository'
import { criarProdutoRepository } from '../../src/main/modules/produtos/repositories/produto.repository'
import { criarCriarCategoriaProduto } from '../../src/main/modules/produtos/use-cases/criar-categoria-produto'
import { criarCriarProduto } from '../../src/main/modules/produtos/use-cases/criar-produto'
import { criarMesaRepository } from '../../src/main/modules/mesas/repositories/mesa.repository'
import { criarPedidoRepository } from '../../src/main/modules/pedidos/repositories/pedido.repository'
import { criarPedidoItemRepository } from '../../src/main/modules/pedidos/repositories/pedido-item.repository'
import { criarCriarMesasPorIntervalo } from '../../src/main/modules/mesas/use-cases/criar-mesas-por-intervalo'
import { criarCriarPedidoMesa } from '../../src/main/modules/pedidos/use-cases/criar-pedido-mesa'
import { criarCriarPedidoBalcao } from '../../src/main/modules/pedidos/use-cases/criar-pedido-balcao'
import { criarAdicionarItemPedido } from '../../src/main/modules/pedidos/use-cases/adicionar-item-pedido'
import { criarAlterarQuantidadeItemPedido } from '../../src/main/modules/pedidos/use-cases/alterar-quantidade-item-pedido'
import { criarRemoverItemPedido } from '../../src/main/modules/pedidos/use-cases/remover-item-pedido'
import { criarCancelarPedido } from '../../src/main/modules/pedidos/use-cases/cancelar-pedido'
import { criarInativarProduto } from '../../src/main/modules/produtos/use-cases/inativar-produto'

export async function prepararAmbientePedidos() {
  const banco = await prepararBancoTeste()

  const repositorioSessao = criarSessaoCaixaRepository()
  const repositorioCategoria = criarCategoriaProdutoRepository()
  const repositorioProduto = criarProdutoRepository()
  const repositorioMesa = criarMesaRepository()
  const repositorioPedido = criarPedidoRepository()
  const repositorioItem = criarPedidoItemRepository()

  const abrirSessaoCaixa = criarAbrirSessaoCaixa(repositorioSessao)
  const criarCategoriaProduto = criarCriarCategoriaProduto(repositorioCategoria)
  const criarProduto = criarCriarProduto(repositorioProduto, repositorioCategoria)
  const inativarProduto = criarInativarProduto(repositorioProduto)
  const criarMesasPorIntervalo = criarCriarMesasPorIntervalo(repositorioMesa)
  const criarPedidoMesa = criarCriarPedidoMesa(
    repositorioPedido,
    repositorioMesa,
    repositorioSessao,
  )
  const criarPedidoBalcao = criarCriarPedidoBalcao(repositorioPedido, repositorioSessao)
  const adicionarItemPedido = criarAdicionarItemPedido(
    repositorioPedido,
    repositorioItem,
    repositorioProduto,
  )
  const alterarQuantidadeItemPedido = criarAlterarQuantidadeItemPedido(
    repositorioPedido,
    repositorioItem,
  )
  const removerItemPedido = criarRemoverItemPedido(repositorioPedido, repositorioItem)
  const cancelarPedido = criarCancelarPedido(repositorioPedido, repositorioMesa)

  const sessao = abrirSessaoCaixa({
    operadorId: 'local',
    operadorNome: 'Operador Local',
    saldoInicialCentavos: 0,
  })

  const categoria = criarCategoriaProduto({ nome: 'Bebidas' })
  const produto = criarProduto({
    categoriaId: categoria.id,
    nome: 'Coca-Cola lata',
    precoCentavos: 600,
  })

  const [mesa] = criarMesasPorIntervalo({ numeroInicial: 1, numeroFinal: 1 })

  return {
    encerrar: banco.encerrar,
    sessao,
    categoria,
    produto,
    mesa,
    repositorioMesa,
    repositorioProduto,
    criarPedidoMesa,
    criarPedidoBalcao,
    adicionarItemPedido,
    alterarQuantidadeItemPedido,
    removerItemPedido,
    cancelarPedido,
    inativarProduto,
    criarMesasPorIntervalo,
  }
}
