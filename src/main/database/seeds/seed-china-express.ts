import {

  confirmarTransacao,

  consultarValorMetadata,

  definirValorMetadata,

  iniciarTransacaoImediata,

  persistirConexaoBanco,

  reverterTransacao,

  type ConexaoSqlite,

} from '../conexao-sqlite'

import { criarCriarCategoriaProduto } from '../../modules/produtos/use-cases/criar-categoria-produto'

import { criarCriarProduto } from '../../modules/produtos/use-cases/criar-produto'

import { criarCategoriaProdutoRepository } from '../../modules/produtos/repositories/categoria-produto.repository'

import { criarProdutoRepository } from '../../modules/produtos/repositories/produto.repository'

import { criarPizzaCategoriaRepository } from '../../modules/pizzas/repositories/pizza-categoria.repository'

import { criarPizzaSaborRepository } from '../../modules/pizzas/repositories/pizza-sabor.repository'

import { criarPizzaSaborPrecoRepository } from '../../modules/pizzas/repositories/pizza-sabor-preco.repository'

import { criarPizzaTamanhoRepository } from '../../modules/pizzas/repositories/pizza-tamanho.repository'

import {

  criarCriarPizzaCategoria,

  criarListarPizzaCategorias,

} from '../../modules/pizzas/use-cases/categorias-pizza'

import {

  criarCriarPizzaSabor,

  criarDefinirPrecoSaborPorTamanho,

  criarListarPizzaSabores,

  criarVincularSaborCategoria,

} from '../../modules/pizzas/use-cases/sabores-pizza'

import {

  criarCriarPizzaTamanho,

  criarListarPizzaTamanhos,

} from '../../modules/pizzas/use-cases/tamanhos-pizza'

import { IDS_TAMANHO_PIZZA } from './dados-apresentacao'

import {

  CATEGORIAS_CHINA_EXPRESS,

  CHAVE_METADATA_SEED_CHINA_EXPRESS,

  TOTAL_CATEGORIAS_CHINA_EXPRESS,

  TOTAL_PRODUTOS_CHINA_EXPRESS,

} from './dados-china-express'

import { aplicarCardapioJardins } from './aplicar-cardapio-jardins'

import {

  CATEGORIAS_PIZZA_CHINA_EXPRESS,

  TOTAL_CATEGORIAS_PIZZA_CHINA_EXPRESS,

  TOTAL_SABORES_PIZZA_CHINA_EXPRESS,

  type PrecosPizzaChinaExpressSeed,

} from './dados-china-express-pizzas'



export interface ResultadoSeedChinaExpress {

  aplicado: boolean

  motivo?: string

  resumo: {

    produtosRemovidos: number

    categoriasRemovidas: number

    itensPedidoRemovidos: number

    pizzasRemovidas: number

    categoriasCriadas: number

    produtosCriados: number

    categoriasPizzaCriadas: number

    saboresPizzaCriados: number

  }

}



function seedJaAplicado(conexao: ConexaoSqlite): boolean {

  return consultarValorMetadata(conexao, CHAVE_METADATA_SEED_CHINA_EXPRESS) === '1'

}



function limparCatalogoProdutos(conexao: ConexaoSqlite): {

  produtosRemovidos: number

  categoriasRemovidas: number

  itensPedidoRemovidos: number

} {

  iniciarTransacaoImediata(conexao)



  try {

    const itensPedido = conexao.instancia.exec(

      'SELECT COUNT(*) AS total FROM pedido_item WHERE produto_id IS NOT NULL',

    )[0]?.values?.[0]?.[0]

    const produtos = conexao.instancia.exec('SELECT COUNT(*) AS total FROM produto')[0]?.values?.[0]?.[0]

    const categorias = conexao.instancia.exec('SELECT COUNT(*) AS total FROM categoria_produto')[0]

      ?.values?.[0]?.[0]



    conexao.instancia.run('DELETE FROM pedido_item WHERE produto_id IS NOT NULL')

    conexao.instancia.run('DELETE FROM produto')

    conexao.instancia.run('DELETE FROM categoria_produto')



    confirmarTransacao(conexao)

    persistirConexaoBanco(conexao)



    return {

      produtosRemovidos: Number(produtos) || 0,

      categoriasRemovidas: Number(categorias) || 0,

      itensPedidoRemovidos: Number(itensPedido) || 0,

    }

  } catch (erro) {

    reverterTransacao(conexao)

    throw erro

  }

}



function limparCatalogoPizzas(conexao: ConexaoSqlite): number {

  iniciarTransacaoImediata(conexao)



  try {

    const sabores = conexao.instancia.exec('SELECT COUNT(*) AS total FROM pizza_sabor')[0]?.values?.[0]?.[0]



    conexao.instancia.run('DELETE FROM pizza_pedido_item_sabor')

    conexao.instancia.run('DELETE FROM pizza_pedido_item')

    conexao.instancia.run("DELETE FROM pedido_item WHERE tipo = 'PIZZA'")

    conexao.instancia.run('DELETE FROM pizza_sabor_preco')

    conexao.instancia.run('DELETE FROM pizza_categoria_sabor')

    conexao.instancia.run('DELETE FROM pizza_sabor')

    conexao.instancia.run('DELETE FROM pizza_categoria')



    confirmarTransacao(conexao)

    persistirConexaoBanco(conexao)



    return Number(sabores) || 0

  } catch (erro) {

    reverterTransacao(conexao)

    throw erro

  }

}



function obterMapaTamanhosPizza() {

  const repositorioPizzaTamanho = criarPizzaTamanhoRepository()

  const listarPizzaTamanhos = criarListarPizzaTamanhos(repositorioPizzaTamanho)

  const criarPizzaTamanho = criarCriarPizzaTamanho(repositorioPizzaTamanho)



  const tamanhos = listarPizzaTamanhos({ apenasAtivas: false })

  const tamanhoP = tamanhos.find((t) => t.id === IDS_TAMANHO_PIZZA.P)

  const tamanhoM = tamanhos.find((t) => t.id === IDS_TAMANHO_PIZZA.M)

  const tamanhoG = tamanhos.find((t) => t.id === IDS_TAMANHO_PIZZA.G)

  let tamanhoMini = tamanhos.find((t) => t.sigla === 'MINI')



  if (!tamanhoP || !tamanhoM || !tamanhoG) {

    throw new Error('Tamanhos P/M/G nao encontrados. Execute as migrations antes do seed.')

  }



  if (!tamanhoMini) {

    tamanhoMini = criarPizzaTamanho({

      nome: 'Mini',

      sigla: 'MINI',

      maximoSabores: 1,

      ordem: 0,

    })

  }



  return {

    mini: tamanhoMini.id,

    p: tamanhoP.id,

    m: tamanhoM.id,

    g: tamanhoG.id,

  }

}



function importarPizzasChinaExpress(): {

  categoriasPizzaCriadas: number

  saboresPizzaCriados: number

} {

  const repositorioPizzaCategoria = criarPizzaCategoriaRepository()

  const repositorioPizzaSabor = criarPizzaSaborRepository()

  const repositorioPizzaPreco = criarPizzaSaborPrecoRepository()



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

    criarPizzaTamanhoRepository(),

  )



  const tamanhos = obterMapaTamanhosPizza()

  const nomesPizzaCategoria = new Set(

    listarPizzaCategorias({ apenasAtivas: false }).map((c) => c.nome.toLowerCase()),

  )

  const nomesPizzaSabor = new Set(

    listarPizzaSabores({ apenasAtivos: false }).map((s) => s.nome.toLowerCase()),

  )



  let categoriasPizzaCriadas = 0

  let saboresPizzaCriados = 0



  for (const categoriaPizza of CATEGORIAS_PIZZA_CHINA_EXPRESS) {

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

      categoriasPizzaCriadas++

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

          ordem: saborSeed.ordem,

        })

        saborId = criado.id

        nomesPizzaSabor.add(chaveSabor)

        saboresPizzaCriados++

      }



      vincularSabor({ categoriaId, saborId })

      aplicarPrecosPizza(definirPreco, saborId, tamanhos, saborSeed.precos)

    }

  }



  return { categoriasPizzaCriadas, saboresPizzaCriados }

}



function aplicarPrecosPizza(

  definirPreco: ReturnType<typeof criarDefinirPrecoSaborPorTamanho>,

  saborId: string,

  tamanhos: Record<'mini' | 'p' | 'm' | 'g', string>,

  precos: PrecosPizzaChinaExpressSeed,

) {

  if (precos.mini != null) {

    definirPreco({ saborId, tamanhoId: tamanhos.mini, valorCentavos: precos.mini })

  }

  if (precos.p != null) {

    definirPreco({ saborId, tamanhoId: tamanhos.p, valorCentavos: precos.p })

  }

  if (precos.m != null) {

    definirPreco({ saborId, tamanhoId: tamanhos.m, valorCentavos: precos.m })

  }

  if (precos.g != null) {

    definirPreco({ saborId, tamanhoId: tamanhos.g, valorCentavos: precos.g })

  }

}



export function executarSeedChinaExpress(

  conexao: ConexaoSqlite,

  opcoes: { forcar?: boolean } = {},

): ResultadoSeedChinaExpress {

  const resumo = {

    produtosRemovidos: 0,

    categoriasRemovidas: 0,

    itensPedidoRemovidos: 0,

    pizzasRemovidas: 0,

    categoriasCriadas: 0,

    produtosCriados: 0,

    categoriasPizzaCriadas: 0,

    saboresPizzaCriados: 0,

  }



  if (seedJaAplicado(conexao) && !opcoes.forcar) {

    return {

      aplicado: false,

      motivo: 'Seed China Express ja aplicado. Use --force para executar novamente.',

      resumo,

    }

  }



  resumo.pizzasRemovidas = limparCatalogoPizzas(conexao)



  const limpeza = limparCatalogoProdutos(conexao)

  resumo.produtosRemovidos = limpeza.produtosRemovidos

  resumo.categoriasRemovidas = limpeza.categoriasRemovidas

  resumo.itensPedidoRemovidos = limpeza.itensPedidoRemovidos



  const repositorioCategoriaProduto = criarCategoriaProdutoRepository()

  const repositorioProduto = criarProdutoRepository()

  const criarCategoriaProduto = criarCriarCategoriaProduto(repositorioCategoriaProduto)

  const criarProduto = criarCriarProduto(repositorioProduto, repositorioCategoriaProduto)



  for (const categoriaSeed of CATEGORIAS_CHINA_EXPRESS) {

    const categoria = criarCategoriaProduto({

      nome: categoriaSeed.nome,

    })

    resumo.categoriasCriadas++



    for (const produtoSeed of categoriaSeed.produtos) {

      criarProduto({

        categoriaId: categoria.id,

        nome: produtoSeed.nome,

        precoCentavos: produtoSeed.precoCentavos,

        fiscalNcm: produtoSeed.fiscalNcm,

        fiscalCest: produtoSeed.fiscalCest,

        fiscalCfop: produtoSeed.fiscalCfop,

        fiscalIcmsCsosn: produtoSeed.fiscalIcmsCsosn,

        fiscalPisCst: produtoSeed.fiscalPisCst,

        fiscalCofinsCst: produtoSeed.fiscalCofinsCst,

      })

      resumo.produtosCriados++

    }

  }



  if (

    resumo.categoriasCriadas !== TOTAL_CATEGORIAS_CHINA_EXPRESS ||

    resumo.produtosCriados !== TOTAL_PRODUTOS_CHINA_EXPRESS

  ) {

    throw new Error(

      `Seed incompleto: esperado ${TOTAL_CATEGORIAS_CHINA_EXPRESS} categorias e ${TOTAL_PRODUTOS_CHINA_EXPRESS} produtos.`,

    )

  }



  const pizzas = importarPizzasChinaExpress()

  resumo.categoriasPizzaCriadas = pizzas.categoriasPizzaCriadas

  resumo.saboresPizzaCriados = pizzas.saboresPizzaCriados



  if (

    resumo.categoriasPizzaCriadas !== TOTAL_CATEGORIAS_PIZZA_CHINA_EXPRESS ||

    resumo.saboresPizzaCriados !== TOTAL_SABORES_PIZZA_CHINA_EXPRESS

  ) {

    throw new Error(

      `Seed de pizzas incompleto: esperado ${TOTAL_CATEGORIAS_PIZZA_CHINA_EXPRESS} categorias e ${TOTAL_SABORES_PIZZA_CHINA_EXPRESS} sabores.`,

    )

  }



  definirValorMetadata(conexao, CHAVE_METADATA_SEED_CHINA_EXPRESS, '1')

  aplicarCardapioJardins(conexao, { forcar: true })

  return { aplicado: true, resumo }

}


