import {
  consultarValorMetadata,
  definirValorMetadata,
  type ConexaoSqlite,
} from '../conexao-sqlite'
import { criarCategoriaProdutoRepository } from '../../modules/produtos/repositories/categoria-produto.repository'
import { criarProdutoRepository } from '../../modules/produtos/repositories/produto.repository'
import { criarCriarCategoriaProduto } from '../../modules/produtos/use-cases/criar-categoria-produto'
import { criarCriarProduto } from '../../modules/produtos/use-cases/criar-produto'
import { SETOR_POR_CATEGORIA_JARDINS } from './setores-categoria-jardins'

export const CHAVE_METADATA_CARDAPIO_JARDINS = 'cardapio_jardins_config_v2'

const FISCAL_PADRAO = {
  fiscalNcm: '21069090',
  fiscalCest: null as string | null,
  fiscalCfop: '5102',
  fiscalIcmsCsosn: '102',
  fiscalPisCst: '07',
  fiscalCofinsCst: '07',
}

const RENOMEAR_PRATOS_ITALIANO: Record<string, string> = {
  'PQ FRANGO A PARMEGIANA': 'Frango à Parmegiana Italiano',
  'PQ FILE A PARMEGIANA': 'Filé à Parmegiana Italiano',
  'PQ CAMARAO A PARMEGIANA': 'Camarão à Parmegiana Italiano',
  'PQ MEDALHAO DE FILE MIGNON': 'Medalhão de Filé Mignon',
  'PQ CAMARAO INTERNACIONAL': 'Camarão Internacional',
  'PQ CAMARAO CROCANTE COM ARROZ CREMOSO': 'Camarão Crocante',
  'PQ CAMARAO AO MOLHOS DE TOMATE': 'Camarão ao Molho de Tomate',
  'CAMARAO AO MOLHO DE TOMATE': 'Camarão ao Molho de Tomate',
}

const PRECO_BEBIDAS: Record<string, number> = {
  'LIMONETO 500': 800,
  'H2O 500': 800,
  'COCA COLA LATA': 800,
  'COCA COLA ZERO LATA': 800,
  'GUARANA LATA': 800,
  'FANTA LATA': 800,
  'SODA LATA': 800,
  'COCA COLA 1 LITRO': 1400,
  'GUARANA 1 LITRO': 1400,
  'SUCO ACEROLA COPO': 800,
  'SUCO CAJA COPO': 800,
  'SUCO GOIABA COPO': 800,
  'SUCO GRAVIOLA COPO': 800,
  'SUCO LARANJA COPO': 800,
  'SUCO LIMAO COPO': 800,
  'SUCO MARACUJA COPO': 800,
  'SUCO MORANGO COPO': 800,
  'SUCO ACEROLA JARRA': 1600,
  'SUCO CAJA JARRA': 1600,
  'SUCO GOIABA JARRA': 1600,
  'SUCO GRAVIOLA JARRA': 1600,
  'SUCO LARANJA JARRA': 1600,
  'SUCO LIMAO JARRA': 1600,
  'SUCO MARACUJA JARRA': 1600,
  'SUCO MORANGO JARRA': 1600,
}

const RENOMEAR_PETISCOS: Record<string, string> = {
  'FILE AO MOLHO MADEIRA COM FRITAS': 'Filé com Fritas',
  'CALABRESA COM FRITAS': 'Calabresa com Fritas',
  'CAMARAO AO PANKO COM CREAM': 'Camarão ao Panko com Cream Cheese (8 un.)',
  'CAMARAO EMPANADO': 'Camarão Empanado (10 un.)',
  'CAMARAO ALHO E OLEO': 'Camarão ao Alho e Óleo',
  'BATATA FRITA P': 'Batata Frita P',
  'BATATA FRITA G': 'Batata Frita M',
}

const SUSHI_TRADICIONAL_NOVOS: string[] = [
  'HOSSOMAKI DE ARCO IRIS',
  'NUVEM',
  'HOSSOMAKI CANAPE DE CAMARAO',
  'URAMAKI DE PEIXE BRANCO',
  'NIGUIRI DE SALMAO MACARICADO COM CREAM CHEESE',
  'CANAPE DE PASTA DE SKIN',
  'URAMAKI DE PASTA DE ATUM',
  'CANAPE DE ACELGA COM CAMARAO',
  'KANI-S',
  'URAMAKI DE POLVO',
  'HOSSOMAKI DE POLVO',
  'HOT ROLL DE CAMARAO MACARICADO',
  'HOT ROLL DE SALMAO MACARICADO',
  'NIGUIRI DE POLVO',
  'NIGUIRI DE SKIN',
  'NIGUIRI DE SALMAO',
  'CANAPE FRITO DE PASTA DE SKIN',
  'COCADA DE SKIN',
  'CANAPE FRITO PASTA SALMAO',
  'BACALHAU C BANANA FRITA',
  'HOT ROLL KANI',
  'CARIOCA KANI',
  'TROUXINHA',
  'HOT CANAPE DE SKIN',
  'CANAPE DE ROLINHO COM PASTA DE SALMAO',
  'CANAPE DE BACALHAU',
  'BOLINHO SKIN',
  'HOT MACARICADO PASTA DE ATUM',
]

const SUSHI_ESPECIAL_NOVOS: Array<{ nome: string; precoCentavos: number }> = [
  { nome: 'Joy Ebi Hot (5 un.)', precoCentavos: 3500 },
  { nome: 'Kani Queijo Maçaricado (5 un.)', precoCentavos: 3500 },
  { nome: 'Kani Queijo (5 un.)', precoCentavos: 3500 },
  { nome: 'Ebi Joy Hot (5 un.)', precoCentavos: 3500 },
  { nome: 'Doritos Joy (5 un.)', precoCentavos: 3500 },
  { nome: 'Joy Joy Maracujá (5 un.)', precoCentavos: 3500 },
  { nome: 'Ebi de Kani com Peixe Branco Maçaricado (5 un.)', precoCentavos: 3500 },
  { nome: 'Ebi de Kani com Peixe Branco (5 un.)', precoCentavos: 3500 },
]

const SUSHI_DOCE_NOVOS: Array<{ nome: string; precoCentavos: number }> = [
  { nome: 'Suíte Raquel com Manga', precoCentavos: 350 },
  { nome: 'Suíte Raquel com Coco Ralado', precoCentavos: 350 },
  { nome: 'Suíte Raquel', precoCentavos: 350 },
  { nome: 'Suíte Raquel com Leite Condensado', precoCentavos: 350 },
  { nome: 'Suíte Raquel com Raspa de Limão', precoCentavos: 350 },
  { nome: 'Canapé de Banana com Creme de Avelã', precoCentavos: 350 },
]

function normalizarNome(nome: string): string {
  return nome.trim().toUpperCase()
}

function buscarCategoriaPorNome(
  repositorio: ReturnType<typeof criarCategoriaProdutoRepository>,
  nome: string,
) {
  return repositorio.listar().find((c) => c.nome === nome) ?? null
}

function garantirCategoria(
  repositorio: ReturnType<typeof criarCategoriaProdutoRepository>,
  criarCategoria: ReturnType<typeof criarCriarCategoriaProduto>,
  nome: string,
) {
  const existente = buscarCategoriaPorNome(repositorio, nome)
  if (existente) {
    return existente
  }

  return criarCategoria({ nome })
}

function aplicarSetoresCategoria(
  repositorio: ReturnType<typeof criarCategoriaProdutoRepository>,
) {
  for (const categoria of repositorio.listar()) {
    const setor = SETOR_POR_CATEGORIA_JARDINS[categoria.nome]
    if (setor && categoria.setorImpressao !== setor) {
      repositorio.atualizarSetorImpressao(categoria.id, setor)
    }
  }
}

export function aplicarCardapioJardins(
  conexao: ConexaoSqlite,
  opcoes: { forcar?: boolean } = {},
): { aplicado: boolean; motivo?: string } {
  if (consultarValorMetadata(conexao, CHAVE_METADATA_CARDAPIO_JARDINS) === '1' && !opcoes.forcar) {
    return { aplicado: false, motivo: 'Cardapio Jardins ja configurado.' }
  }

  const repositorioCategoria = criarCategoriaProdutoRepository(conexao)
  const categoriasIniciais = repositorioCategoria.listar()

  if (categoriasIniciais.length === 0) {
    return { aplicado: false, motivo: 'Catalogo vazio — execute o seed antes.' }
  }
  const repositorioProduto = criarProdutoRepository(conexao)
  const criarCategoria = criarCriarCategoriaProduto(repositorioCategoria)
  const criarProduto = criarCriarProduto(repositorioProduto, repositorioCategoria)

  const pratosQuentes = buscarCategoriaPorNome(repositorioCategoria, 'Pratos Quentes')
  if (pratosQuentes) {
    repositorioCategoria.atualizar({
      categoriaId: pratosQuentes.id,
      nome: 'Pratos Quentes Chinesa',
    })
  }

  const pratosItaliano = garantirCategoria(
    repositorioCategoria,
    criarCategoria,
    'Pratos Quentes Italiano',
  )

  const sushiTradicional = buscarCategoriaPorNome(repositorioCategoria, 'A La Carte')
  if (sushiTradicional) {
    repositorioCategoria.atualizar({
      categoriaId: sushiTradicional.id,
      nome: 'Sushi Tradicional',
    })
  }

  const pecasEspeciais = buscarCategoriaPorNome(repositorioCategoria, 'Pecas Especiais')
  if (pecasEspeciais) {
    repositorioCategoria.atualizar({
      categoriaId: pecasEspeciais.id,
      nome: 'Sushi Especial',
    })
  }

  const sushiEspecial = buscarCategoriaPorNome(repositorioCategoria, 'Sushi Especial')
  const sushiPremium = garantirCategoria(repositorioCategoria, criarCategoria, 'Sushi Premium')
  const sushiDoce = garantirCategoria(repositorioCategoria, criarCategoria, 'Sushi Doce')
  const categoriaTradicional =
    buscarCategoriaPorNome(repositorioCategoria, 'Sushi Tradicional') ?? sushiTradicional

  const produtos = repositorioProduto.listarComCategoria({ apenasAtivos: false })
  const nomesExistentes = new Set(produtos.map((p) => normalizarNome(p.nome)))

  for (const produto of produtos) {
    const nomeUpper = normalizarNome(produto.nome)

    if (nomeUpper.startsWith('INUT')) {
      repositorioProduto.inativar(produto.id)
      continue
    }

    if (produto.categoriaNome === 'Pratos Quentes Chinesa' || produto.categoriaNome === 'Pratos Quentes') {
      const novoNome = RENOMEAR_PRATOS_ITALIANO[nomeUpper]
      if (novoNome) {
        repositorioProduto.atualizar({
          produtoId: produto.id,
          categoriaId: pratosItaliano.id,
          nome: novoNome,
        })
      }
    }

    if (produto.categoriaNome === 'Sushi Tradicional' || produto.categoriaNome === 'A La Carte') {
      if (nomeUpper === 'SUITE RAQUEL') {
        repositorioProduto.atualizar({
          produtoId: produto.id,
          categoriaId: sushiDoce.id,
          nome: 'Suíte Raquel',
          precoCentavos: 350,
        })
        continue
      }

      repositorioProduto.atualizar({
        produtoId: produto.id,
        precoCentavos: 350,
      })
    }

    if (produto.categoriaNome === 'Sushi Especial' || produto.categoriaNome === 'Pecas Especiais') {
      if (nomeUpper === 'EBI CROCK') {
        repositorioProduto.atualizar({
          produtoId: produto.id,
          categoriaId: sushiPremium.id,
          nome: 'Ebi Crock (5 un.)',
          precoCentavos: 4000,
        })
        continue
      }

      if (nomeUpper.includes('EBI JOY') || nomeUpper.includes('JOY EBI')) {
        repositorioProduto.atualizar({
          produtoId: produto.id,
          categoriaId: sushiPremium.id,
          precoCentavos: 4000,
        })
        continue
      }

      repositorioProduto.atualizar({
        produtoId: produto.id,
        precoCentavos: 3500,
      })
    }

    const precoBebida = PRECO_BEBIDAS[nomeUpper]
    if (precoBebida != null) {
      repositorioProduto.atualizar({
        produtoId: produto.id,
        precoCentavos: precoBebida,
      })
    }

    const petiscoRenomeado = RENOMEAR_PETISCOS[nomeUpper]
    if (petiscoRenomeado && produto.categoriaNome === 'Petiscos') {
      repositorioProduto.atualizar({
        produtoId: produto.id,
        nome: petiscoRenomeado,
      })
    }

    if (nomeUpper === 'PREMIUM  FIRE PORCAO INTERIA') {
      repositorioProduto.atualizar({
        produtoId: produto.id,
        nome: 'Premium Fire — Completo',
      })
    }
    if (nomeUpper === 'PREMIUM  FIRE PORCAO MEIA') {
      repositorioProduto.atualizar({
        produtoId: produto.id,
        nome: 'Premium Fire — Meio',
      })
    }
    if (nomeUpper === 'PREMIUM DRAGON PORCAO INTEIRA') {
      repositorioProduto.atualizar({
        produtoId: produto.id,
        nome: 'Premium Dragon — Completo',
      })
    }
    if (nomeUpper === 'PREMIUM DRAGON PORCAO MEIA') {
      repositorioProduto.atualizar({
        produtoId: produto.id,
        nome: 'Premium Dragon — Meio',
      })
    }
  }

  if (categoriaTradicional) {
    for (const nome of SUSHI_TRADICIONAL_NOVOS) {
      if (nomesExistentes.has(normalizarNome(nome))) {
        continue
      }

      criarProduto({
        categoriaId: categoriaTradicional.id,
        nome,
        precoCentavos: 350,
        ...FISCAL_PADRAO,
      })
      nomesExistentes.add(normalizarNome(nome))
    }
  }

  if (sushiEspecial) {
    for (const item of SUSHI_ESPECIAL_NOVOS) {
      if (nomesExistentes.has(normalizarNome(item.nome))) {
        continue
      }

      criarProduto({
        categoriaId: sushiEspecial.id,
        nome: item.nome,
        precoCentavos: item.precoCentavos,
        ...FISCAL_PADRAO,
      })
      nomesExistentes.add(normalizarNome(item.nome))
    }
  }

  for (const item of SUSHI_DOCE_NOVOS) {
    if (nomesExistentes.has(normalizarNome(item.nome))) {
      continue
    }

    criarProduto({
      categoriaId: sushiDoce.id,
      nome: item.nome,
      precoCentavos: item.precoCentavos,
      ...FISCAL_PADRAO,
    })
    nomesExistentes.add(normalizarNome(item.nome))
  }

  const combos = buscarCategoriaPorNome(repositorioCategoria, 'Combos')
  if (combos && !nomesExistentes.has(normalizarNome('Big Joy (Bolo de Sushi Joy Joy)'))) {
    criarProduto({
      categoriaId: combos.id,
      nome: 'Big Joy (Bolo de Sushi Joy Joy)',
      precoCentavos: 10500,
      ...FISCAL_PADRAO,
    })
  }

  aplicarSetoresCategoria(repositorioCategoria)
  definirValorMetadata(conexao, CHAVE_METADATA_CARDAPIO_JARDINS, '1')

  return { aplicado: true }
}
