import {
  consultarValorMetadata,
  definirValorMetadata,
  type ConexaoSqlite,
} from '../conexao-sqlite'
import { criarAbrirSessaoCaixa } from '../../modules/caixa/use-cases/abrir-sessao-caixa'
import { criarSessaoCaixaRepository } from '../../modules/caixa/repositories/sessao-caixa.repository'
import { criarCriarMesasPorIntervalo } from '../../modules/mesas/use-cases/criar-mesas-por-intervalo'
import { criarMesaRepository } from '../../modules/mesas/repositories/mesa.repository'
import { criarCriarCliente } from '../../modules/clientes/use-cases/criar-cliente'
import { criarListarClientes } from '../../modules/clientes/use-cases/consultar-atualizar-cliente'
import { criarClienteRepository } from '../../modules/clientes/repositories/cliente.repository'
import { criarCriarCategoriaProduto } from '../../modules/produtos/use-cases/criar-categoria-produto'
import { criarCriarProduto } from '../../modules/produtos/use-cases/criar-produto'
import { criarListarCategoriasProduto } from '../../modules/produtos/use-cases/listar-categorias-produto'
import { criarCategoriaProdutoRepository } from '../../modules/produtos/repositories/categoria-produto.repository'
import { criarProdutoRepository } from '../../modules/produtos/repositories/produto.repository'
import { criarPizzaCategoriaRepository } from '../../modules/pizzas/repositories/pizza-categoria.repository'
import { criarPizzaSaborRepository } from '../../modules/pizzas/repositories/pizza-sabor.repository'
import { criarPizzaSaborPrecoRepository } from '../../modules/pizzas/repositories/pizza-sabor-preco.repository'
import { criarPizzaTamanhoRepository } from '../../modules/pizzas/repositories/pizza-tamanho.repository'
import { criarCriarPizzaCategoria } from '../../modules/pizzas/use-cases/categorias-pizza'
import { criarListarPizzaCategorias } from '../../modules/pizzas/use-cases/categorias-pizza'
import { criarCriarPizzaSabor } from '../../modules/pizzas/use-cases/sabores-pizza'
import { criarDefinirPrecoSaborPorTamanho } from '../../modules/pizzas/use-cases/sabores-pizza'
import { criarListarPizzaSabores } from '../../modules/pizzas/use-cases/sabores-pizza'
import { criarVincularSaborCategoria } from '../../modules/pizzas/use-cases/sabores-pizza'
import { criarListarPizzaTamanhos } from '../../modules/pizzas/use-cases/tamanhos-pizza'
import {
  CAIXA_APRESENTACAO,
  CATEGORIAS_PIZZA_APRESENTACAO,
  CATEGORIAS_PRODUTO_APRESENTACAO,
  CHAVE_METADATA_SEED_APRESENTACAO,
  CLIENTES_APRESENTACAO,
  IDS_TAMANHO_PIZZA,
  MESAS_APRESENTACAO,
} from './dados-apresentacao'

export interface ResultadoSeedApresentacao {
  aplicado: boolean
  motivo?: string
  resumo: {
    categoriasProduto: number
    produtos: number
    categoriasPizza: number
    saboresPizza: number
    mesasNovas: number
    clientes: number
    caixaAberto: boolean
  }
}

function seedJaAplicado(conexao: ConexaoSqlite): boolean {
  return consultarValorMetadata(conexao, CHAVE_METADATA_SEED_APRESENTACAO) === '1'
}

export function executarSeedApresentacao(
  conexao: ConexaoSqlite,
  opcoes: { forcar?: boolean } = {},
): ResultadoSeedApresentacao {
  const resumo = {
    categoriasProduto: 0,
    produtos: 0,
    categoriasPizza: 0,
    saboresPizza: 0,
    mesasNovas: 0,
    clientes: 0,
    caixaAberto: false,
  }

  if (seedJaAplicado(conexao) && !opcoes.forcar) {
    return {
      aplicado: false,
      motivo: 'Seed de apresentacao ja aplicado. Use --force para executar novamente.',
      resumo,
    }
  }

  const repositorioCategoriaProduto = criarCategoriaProdutoRepository()
  const repositorioProduto = criarProdutoRepository()
  const criarCategoriaProduto = criarCriarCategoriaProduto(repositorioCategoriaProduto)
  const criarProduto = criarCriarProduto(repositorioProduto, repositorioCategoriaProduto)
  const listarCategoriasProduto = criarListarCategoriasProduto(repositorioCategoriaProduto)

  const nomesCategoriasExistentes = new Set(
    listarCategoriasProduto({ apenasAtivas: false }).map((c) => c.nome.toLowerCase()),
  )
  const produtosExistentes = new Set(
    repositorioProduto
      .listarComCategoria({ apenasAtivos: false })
      .map((p) => `${p.categoriaNome.toLowerCase()}::${p.nome.toLowerCase()}`),
  )

  for (const categoriaSeed of CATEGORIAS_PRODUTO_APRESENTACAO) {
    let categoriaId: string
    const chaveCategoria = categoriaSeed.nome.toLowerCase()

    if (nomesCategoriasExistentes.has(chaveCategoria)) {
      const existente = listarCategoriasProduto({ apenasAtivas: false }).find(
        (c) => c.nome.toLowerCase() === chaveCategoria,
      )!
      categoriaId = existente.id
    } else {
      const criada = criarCategoriaProduto({
        nome: categoriaSeed.nome,
        descricao: categoriaSeed.descricao,
      })
      categoriaId = criada.id
      nomesCategoriasExistentes.add(chaveCategoria)
      resumo.categoriasProduto++
    }

    for (const produtoSeed of categoriaSeed.produtos) {
      const chaveProduto = `${chaveCategoria}::${produtoSeed.nome.toLowerCase()}`
      if (produtosExistentes.has(chaveProduto)) continue

      criarProduto({
        categoriaId,
        nome: produtoSeed.nome,
        descricao: produtoSeed.descricao,
        precoCentavos: produtoSeed.precoCentavos,
      })
      produtosExistentes.add(chaveProduto)
      resumo.produtos++
    }
  }

  const repositorioPizzaCategoria = criarPizzaCategoriaRepository()
  const repositorioPizzaSabor = criarPizzaSaborRepository()
  const repositorioPizzaPreco = criarPizzaSaborPrecoRepository()
  const repositorioPizzaTamanho = criarPizzaTamanhoRepository()

  const criarPizzaCategoria = criarCriarPizzaCategoria(repositorioPizzaCategoria)
  const listarPizzaCategorias = criarListarPizzaCategorias(repositorioPizzaCategoria)
  const criarPizzaSabor = criarCriarPizzaSabor(repositorioPizzaSabor)
  const listarPizzaSabores = criarListarPizzaSabores(repositorioPizzaSabor)
  const vincularSabor = criarVincularSaborCategoria(
    repositorioPizzaSabor,
    repositorioPizzaCategoria,
  )
  const definirPreco = criarDefinirPrecoSaborPorTamanho(
    repositorioPizzaPreco,
    repositorioPizzaSabor,
    repositorioPizzaTamanho,
  )
  const listarTamanhos = criarListarPizzaTamanhos(repositorioPizzaTamanho)

  const tamanhos = listarTamanhos({ apenasAtivas: false })
  const tamanhoP = tamanhos.find((t) => t.id === IDS_TAMANHO_PIZZA.P)
  const tamanhoM = tamanhos.find((t) => t.id === IDS_TAMANHO_PIZZA.M)
  const tamanhoG = tamanhos.find((t) => t.id === IDS_TAMANHO_PIZZA.G)

  if (!tamanhoP || !tamanhoM || !tamanhoG) {
    throw new Error(
      'Tamanhos P/M/G nao encontrados. Execute as migrations antes do seed.',
    )
  }

  const nomesPizzaCategoria = new Set(
    listarPizzaCategorias({ apenasAtivas: false }).map((c) => c.nome.toLowerCase()),
  )
  const nomesPizzaSabor = new Set(
    listarPizzaSabores({ apenasAtivos: false }).map((s) => s.nome.toLowerCase()),
  )

  for (const categoriaPizza of CATEGORIAS_PIZZA_APRESENTACAO) {
    let categoriaId: string
    const chaveCat = categoriaPizza.nome.toLowerCase()

    if (nomesPizzaCategoria.has(chaveCat)) {
      categoriaId = listarPizzaCategorias({ apenasAtivas: false }).find(
        (c) => c.nome.toLowerCase() === chaveCat,
      )!.id
    } else {
      const criada = criarPizzaCategoria({
        nome: categoriaPizza.nome,
        descricao: categoriaPizza.descricao,
        regraPrecificacao: categoriaPizza.regraPrecificacao,
        ordem: categoriaPizza.ordem,
      })
      categoriaId = criada.id
      nomesPizzaCategoria.add(chaveCat)
      resumo.categoriasPizza++
    }

    for (const saborSeed of categoriaPizza.sabores) {
      let saborId: string
      const chaveSabor = saborSeed.nome.toLowerCase()

      if (nomesPizzaSabor.has(chaveSabor)) {
        saborId = listarPizzaSabores({ apenasAtivos: false }).find(
          (s) => s.nome.toLowerCase() === chaveSabor,
        )!.id
      } else {
        const criado = criarPizzaSabor({
          nome: saborSeed.nome,
          descricao: saborSeed.descricao,
          ordem: saborSeed.ordem,
        })
        saborId = criado.id
        nomesPizzaSabor.add(chaveSabor)
        resumo.saboresPizza++
      }

      vincularSabor({ categoriaId, saborId })

      definirPreco({ saborId, tamanhoId: tamanhoP.id, valorCentavos: saborSeed.precos.p })
      definirPreco({ saborId, tamanhoId: tamanhoM.id, valorCentavos: saborSeed.precos.m })
      definirPreco({ saborId, tamanhoId: tamanhoG.id, valorCentavos: saborSeed.precos.g })
    }
  }

  const criarMesas = criarCriarMesasPorIntervalo(criarMesaRepository())
  resumo.mesasNovas = criarMesas(MESAS_APRESENTACAO).length

  const repositorioCliente = criarClienteRepository()
  const criarCliente = criarCriarCliente(repositorioCliente)
  const nomesClientesExistentes = new Set(
    criarListarClientes(repositorioCliente)({ apenasAtivos: false }).map((c) =>
      c.nome.toLowerCase(),
    ),
  )
  for (const clienteSeed of CLIENTES_APRESENTACAO) {
    if (nomesClientesExistentes.has(clienteSeed.nome.toLowerCase())) {
      continue
    }
    criarCliente({
      nome: clienteSeed.nome,
      telefone: clienteSeed.telefone,
      documento: clienteSeed.documento,
      endereco: clienteSeed.endereco,
      liberaTalao: clienteSeed.liberaTalao,
    })
    resumo.clientes++
  }

  const repositorioSessao = criarSessaoCaixaRepository()
  if (!repositorioSessao.buscarSessaoAberta()) {
    const abrirCaixa = criarAbrirSessaoCaixa(repositorioSessao)
    abrirCaixa(CAIXA_APRESENTACAO)
    resumo.caixaAberto = true
  }

  definirValorMetadata(conexao, CHAVE_METADATA_SEED_APRESENTACAO, '1')

  return { aplicado: true, resumo }
}
