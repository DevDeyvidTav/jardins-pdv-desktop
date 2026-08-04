import {
  REGRA_PRECIFICACAO_PIZZA,
  type RegraPrecificacaoPizza,
} from '../../src/shared/types/pizza'
import {
  criarPedidoDivisaoContaRepository,
  criarPedidoDivisaoMovimentacaoRepository,
  criarPedidoDivisaoParteRepository,
} from '../../src/main/modules/divisao-conta/repositories/divisao-conta.repository'
import { criarCriarDivisaoConta } from '../../src/main/modules/divisao-conta/use-cases/criar-divisao-conta'
import { criarCancelarItemPedido } from '../../src/main/modules/pedidos/use-cases/cancelar-item-pedido'
import { criarAplicarDescontoPedido } from '../../src/main/modules/pedidos/use-cases/aplicar-desconto-pedido'
import { criarPizzaCategoriaRepository } from '../../src/main/modules/pizzas/repositories/pizza-categoria.repository'
import { criarPizzaPedidoItemRepository } from '../../src/main/modules/pizzas/repositories/pizza-pedido-item.repository'
import { criarPizzaSaborPrecoRepository } from '../../src/main/modules/pizzas/repositories/pizza-sabor-preco.repository'
import { criarPizzaSaborRepository } from '../../src/main/modules/pizzas/repositories/pizza-sabor.repository'
import { criarPizzaTamanhoRepository } from '../../src/main/modules/pizzas/repositories/pizza-tamanho.repository'
import { criarAdicionarPizzaAoPedido } from '../../src/main/modules/pizzas/use-cases/adicionar-pizza-ao-pedido'
import {
  criarAtualizarPizzaCategoria,
  criarCriarPizzaCategoria,
  criarListarPizzaCategorias,
} from '../../src/main/modules/pizzas/use-cases/categorias-pizza'
import { criarMontarPreviewPizza } from '../../src/main/modules/pizzas/use-cases/montar-preview-pizza'
import { criarObterPizzaPedidoItem } from '../../src/main/modules/pizzas/use-cases/obter-pizza-pedido-item'
import {
  criarAtualizarPizzaSabor,
  criarCriarPizzaSabor,
  criarDefinirPrecoSaborPorTamanho,
  criarListarCategoriasDoSabor,
  criarListarPizzaSabores,
  criarListarPrecosSabor,
  criarVincularSaborCategoria,
} from '../../src/main/modules/pizzas/use-cases/sabores-pizza'
import {
  criarAtualizarPizzaTamanho,
  criarCriarPizzaTamanho,
  criarListarPizzaTamanhos,
} from '../../src/main/modules/pizzas/use-cases/tamanhos-pizza'
import { prepararAmbientePedidos } from './pedido-teste'

export const IDS_TAMANHO_SEED = {
  P: 'pizza-tamanho-p',
  M: 'pizza-tamanho-m',
  G: 'pizza-tamanho-g',
} as const

export async function prepararAmbientePizzas(opcoes?: {
  regraPrecificacao?: RegraPrecificacaoPizza
}) {
  const ambiente = await prepararAmbientePedidos()

  const repositorioCategoria = criarPizzaCategoriaRepository()
  const repositorioTamanho = criarPizzaTamanhoRepository()
  const repositorioSabor = criarPizzaSaborRepository()
  const repositorioPreco = criarPizzaSaborPrecoRepository()
  const repositorioPizzaItem = criarPizzaPedidoItemRepository()
  const repositorioDivisao = criarPedidoDivisaoContaRepository()
  const repositorioParte = criarPedidoDivisaoParteRepository()
  const repositorioMovimentacao = criarPedidoDivisaoMovimentacaoRepository()

  const criarCategoria = criarCriarPizzaCategoria(repositorioCategoria)
  const listarCategorias = criarListarPizzaCategorias(repositorioCategoria)
  const atualizarCategoria = criarAtualizarPizzaCategoria(repositorioCategoria)
  const criarTamanho = criarCriarPizzaTamanho(repositorioTamanho)
  const listarTamanhos = criarListarPizzaTamanhos(repositorioTamanho)
  const atualizarTamanho = criarAtualizarPizzaTamanho(repositorioTamanho)
  const criarSabor = criarCriarPizzaSabor(repositorioSabor)
  const listarSabores = criarListarPizzaSabores(repositorioSabor)
  const atualizarSabor = criarAtualizarPizzaSabor(repositorioSabor)
  const vincularSaborCategoria = criarVincularSaborCategoria(
    repositorioSabor,
    repositorioCategoria,
  )
  const definirPreco = criarDefinirPrecoSaborPorTamanho(
    repositorioPreco,
    repositorioSabor,
    repositorioTamanho,
  )
  const listarPrecosSabor = criarListarPrecosSabor(repositorioPreco, repositorioSabor)
  const listarCategoriasDoSabor = criarListarCategoriasDoSabor(
    repositorioSabor,
    repositorioCategoria,
  )
  const montarPreview = criarMontarPreviewPizza(
    repositorioCategoria,
    repositorioTamanho,
    repositorioSabor,
    repositorioPreco,
  )
  const obterPizzaItem = criarObterPizzaPedidoItem(repositorioPizzaItem)
  const adicionarPizza = criarAdicionarPizzaAoPedido(
    ambiente.repositorioPedido,
    ambiente.repositorioItem,
    repositorioPizzaItem,
    repositorioCategoria,
    repositorioTamanho,
    repositorioSabor,
    repositorioPreco,
    repositorioDivisao,
  )
  const cancelarItemPedido = criarCancelarItemPedido(
    ambiente.repositorioPedido,
    ambiente.repositorioItem,
    repositorioDivisao,
  )
  const criarDivisao = criarCriarDivisaoConta(
    ambiente.repositorioPedido,
    ambiente.repositorioSessao,
    ambiente.repositorioPagamento,
    repositorioDivisao,
    repositorioParte,
    repositorioMovimentacao,
  )
  const aplicarDesconto = criarAplicarDescontoPedido(
    ambiente.repositorioPedido,
    ambiente.repositorioItem,
    ambiente.repositorioSessao,
    ambiente.repositorioMesa,
  )

  const tamanhos = listarTamanhos({ apenasAtivas: false })
  const tamanhoP = tamanhos.find((t) => t.id === IDS_TAMANHO_SEED.P)!
  const tamanhoM = tamanhos.find((t) => t.id === IDS_TAMANHO_SEED.M)!
  const tamanhoG = tamanhos.find((t) => t.id === IDS_TAMANHO_SEED.G)!

  const categoria = criarCategoria({
    nome: 'Tradicional',
    descricao: 'Sabores tradicionais',
    regraPrecificacao:
      opcoes?.regraPrecificacao ?? REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR,
  })

  const calabresa = criarSabor({ nome: 'Calabresa', ordem: 1 })
  const mussarela = criarSabor({ nome: 'Mussarela', ordem: 2 })
  const portuguesa = criarSabor({ nome: 'Portuguesa', ordem: 3 })
  const frango = criarSabor({ nome: 'Frango', ordem: 4 })

  for (const sabor of [calabresa, mussarela, portuguesa, frango]) {
    vincularSaborCategoria({
      categoriaId: categoria.id,
      saborId: sabor.id,
    })
  }

  const precosPorSabor: Record<
    string,
    { p: number; m: number; g: number }
  > = {
    [calabresa.id]: { p: 3000, m: 4000, g: 5000 },
    [mussarela.id]: { p: 2800, m: 3500, g: 4500 },
    [portuguesa.id]: { p: 3200, m: 4200, g: 5500 },
    [frango.id]: { p: 3100, m: 4100, g: 5200 },
  }

  for (const [saborId, precos] of Object.entries(precosPorSabor)) {
    definirPreco({
      saborId,
      tamanhoId: tamanhoP.id,
      valorCentavos: precos.p,
    })
    definirPreco({
      saborId,
      tamanhoId: tamanhoM.id,
      valorCentavos: precos.m,
    })
    definirPreco({
      saborId,
      tamanhoId: tamanhoG.id,
      valorCentavos: precos.g,
    })
  }

  return {
    ...ambiente,
    cancelarItemPedido,
    removerItemPedido: cancelarItemPedido,
    repositorioCategoria,
    repositorioTamanho,
    repositorioSabor,
    repositorioPreco,
    repositorioPizzaItem,
    repositorioDivisao,
    criarCategoria,
    listarCategorias,
    atualizarCategoria,
    criarTamanho,
    listarTamanhos,
    atualizarTamanho,
    criarSabor,
    listarSabores,
    atualizarSabor,
    vincularSaborCategoria,
    definirPreco,
    listarPrecosSabor,
    listarCategoriasDoSabor,
    montarPreview,
    obterPizzaItem,
    adicionarPizza,
    criarDivisao,
    aplicarDesconto,
    categoria,
    tamanhoP,
    tamanhoM,
    tamanhoG,
    sabores: { calabresa, mussarela, portuguesa, frango },
    precosPorSabor,
  }
}
