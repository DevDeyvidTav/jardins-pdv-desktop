import { afterEach, describe, expect, it } from 'vitest'
import { ZodError } from 'zod'
import {
  calcularPrecoPizzaCentavos,
  REGRA_PRECIFICACAO_PIZZA,
  TIPO_PEDIDO_ITEM,
} from '../../../src/shared/types/pizza'
import { FORMA_PAGAMENTO } from '../../../src/shared/types/pagamento-pedido'
import {
  CODIGOS_ERRO_PIZZAS,
  ErroPizzas,
} from '../../../src/main/modules/pizzas/errors/erros-pizzas'
import {
  adicionarPizzaAoPedidoSchema,
  atualizarPizzaCategoriaSchema,
  criarPizzaCategoriaSchema,
  criarPizzaSaborSchema,
  criarPizzaTamanhoSchema,
  definirPrecoSaborPorTamanhoSchema,
  montarPreviewPizzaSchema,
  vincularSaborCategoriaSchema,
} from '../../../src/main/modules/pizzas/schemas/pizza.schema'
import { criarAdicionarPizzaAoPedido } from '../../../src/main/modules/pizzas/use-cases/adicionar-pizza-ao-pedido'
import { criarPizzaPedidoItemRepository } from '../../../src/main/modules/pizzas/repositories/pizza-pedido-item.repository'
import { obterConexaoBancoLocal } from '../../../src/main/database/inicializar-banco'
import {
  IDS_TAMANHO_SEED,
  prepararAmbientePizzas,
} from '../../helpers/pizza-teste'

function esperarErroPizzas(fn: () => unknown, codigo: string) {
  try {
    fn()
    throw new Error(`Esperava ErroPizzas ${codigo}`)
  } catch (erro) {
    expect(erro).toBeInstanceOf(ErroPizzas)
    expect((erro as ErroPizzas).codigo).toBe(codigo)
  }
}

/** Espelha o tratamento de ZodError do IPC de pizzas. */
function parseEntradaIpc<T>(
  schema: { parse: (entrada: unknown) => T },
  entrada: unknown,
): T {
  try {
    return schema.parse(entrada)
  } catch (erro) {
    if (erro instanceof ZodError) {
      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.ENTRADA_INVALIDA,
        erro.issues[0]?.message ?? 'Entrada invalida.',
      )
    }
    throw erro
  }
}

describe('calcularPrecoPizzaCentavos', () => {
  it('usa o maior valor com MAIOR_SABOR', () => {
    expect(
      calcularPrecoPizzaCentavos(
        [3000, 5000, 4200],
        REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR,
      ),
    ).toBe(5000)
  })

  it('faz media com Math.round em MEDIA_SABORES (1000+1001 → 1001)', () => {
    expect(
      calcularPrecoPizzaCentavos(
        [1000, 1001],
        REGRA_PRECIFICACAO_PIZZA.MEDIA_SABORES,
      ),
    ).toBe(1001)
  })

  it('arredonda media .5 para cima com Math.round', () => {
    expect(
      calcularPrecoPizzaCentavos(
        [1000, 1001, 1000],
        REGRA_PRECIFICACAO_PIZZA.MEDIA_SABORES,
      ),
    ).toBe(1000)
  })

  it('rejeita lista vazia', () => {
    expect(() =>
      calcularPrecoPizzaCentavos([], REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR),
    ).toThrow(/vazia/)
  })
})

describe('pizzas', () => {
  let encerrar: (() => void) | undefined
  afterEach(() => {
    encerrar?.()
    encerrar = undefined
  })

  async function setup(opcoes?: Parameters<typeof prepararAmbientePizzas>[0]) {
    const ambiente = await prepararAmbientePizzas(opcoes)
    encerrar = ambiente.encerrar
    return ambiente
  }

  it('seed P/M/G com limites 2/2/3', async () => {
    const ambiente = await setup()
    const p = ambiente.listarTamanhos().find((t) => t.id === IDS_TAMANHO_SEED.P)
    const m = ambiente.listarTamanhos().find((t) => t.id === IDS_TAMANHO_SEED.M)
    const g = ambiente.listarTamanhos().find((t) => t.id === IDS_TAMANHO_SEED.G)

    expect(p).toMatchObject({
      id: IDS_TAMANHO_SEED.P,
      sigla: 'P',
      maximoSabores: 2,
      ativa: true,
    })
    expect(m).toMatchObject({
      id: IDS_TAMANHO_SEED.M,
      sigla: 'M',
      maximoSabores: 2,
      ativa: true,
    })
    expect(g).toMatchObject({
      id: IDS_TAMANHO_SEED.G,
      sigla: 'G',
      maximoSabores: 3,
      ativa: true,
    })
  })

  it('atualiza maximoSabores do tamanho e persiste', async () => {
    const ambiente = await setup()
    const atualizado = ambiente.atualizarTamanho({
      tamanhoId: ambiente.tamanhoP.id,
      maximoSabores: 4,
    })

    expect(atualizado.maximoSabores).toBe(4)
    expect(
      ambiente.listarTamanhos().find((t) => t.id === ambiente.tamanhoP.id)
        ?.maximoSabores,
    ).toBe(4)
  })

  it('CRUD categoria, tamanho e sabor', async () => {
    const ambiente = await setup()

    const categoria = ambiente.criarCategoria({
      nome: 'Doces',
      regraPrecificacao: REGRA_PRECIFICACAO_PIZZA.MEDIA_SABORES,
      ordem: 10,
    })
    expect(categoria.nome).toBe('Doces')
    expect(categoria.regraPrecificacao).toBe(
      REGRA_PRECIFICACAO_PIZZA.MEDIA_SABORES,
    )

    const categoriaAtualizada = ambiente.atualizarCategoria({
      categoriaId: categoria.id,
      nome: 'Doces Premium',
      descricao: 'Linha doce',
    })
    expect(categoriaAtualizada.nome).toBe('Doces Premium')
    expect(categoriaAtualizada.descricao).toBe('Linha doce')

    const categoriaComRegra = ambiente.atualizarCategoria({
      categoriaId: categoria.id,
      regraPrecificacao: REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR,
    })
    expect(categoriaComRegra.regraPrecificacao).toBe(
      REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR,
    )

    const tamanho = ambiente.criarTamanho({
      nome: 'Familia',
      sigla: 'F',
      maximoSabores: 4,
      ordem: 4,
    })
    expect(tamanho.sigla).toBe('F')
    expect(tamanho.maximoSabores).toBe(4)

    const tamanhoAtualizado = ambiente.atualizarTamanho({
      tamanhoId: tamanho.id,
      nome: 'Familia XL',
      ativa: false,
    })
    expect(tamanhoAtualizado.nome).toBe('Familia XL')
    expect(tamanhoAtualizado.ativa).toBe(false)

    const sabor = ambiente.criarSabor({ nome: 'Chocolate', ordem: 1 })
    expect(sabor.nome).toBe('Chocolate')
    expect(sabor.ativa).toBe(true)

    const saborAtualizado = ambiente.atualizarSabor({
      saborId: sabor.id,
      descricao: 'Ao leite',
      ativa: false,
    })
    expect(saborAtualizado.descricao).toBe('Ao leite')
    expect(saborAtualizado.ativa).toBe(false)

    expect(ambiente.listarCategorias({ apenasAtivas: true }).some((c) => c.id === categoria.id)).toBe(
      true,
    )
    expect(ambiente.listarSabores({ apenasAtivos: false }).some((s) => s.id === sabor.id)).toBe(
      true,
    )
  })

  it('vincula sabor a categoria e lista vinculos', async () => {
    const ambiente = await setup()
    const saborExtra = ambiente.criarSabor({ nome: 'Bacon' })
    ambiente.vincularSaborCategoria({
      categoriaId: ambiente.categoria.id,
      saborId: saborExtra.id,
    })

    const categorias = ambiente.listarCategoriasDoSabor({ saborId: saborExtra.id })
    expect(categorias).toContain(ambiente.categoria.id)

    const saboresDaCategoria = ambiente.listarSabores({
      categoriaId: ambiente.categoria.id,
      apenasAtivos: true,
    })
    expect(saboresDaCategoria.some((s) => s.id === saborExtra.id)).toBe(true)
  })

  it('bloqueia sabor sem categoria vinculada', async () => {
    const ambiente = await setup()
    const saborOrfao = ambiente.criarSabor({ nome: 'Orfao' })
    ambiente.definirPreco({
      saborId: saborOrfao.id,
      tamanhoId: ambiente.tamanhoP.id,
      valorCentavos: 4000,
    })

    esperarErroPizzas(
      () =>
        ambiente.montarPreview({
          tamanhoId: ambiente.tamanhoP.id,
          saborIds: [saborOrfao.id],
        }),
      CODIGOS_ERRO_PIZZAS.PIZZA_SABOR_NAO_PERTENCE_A_CATEGORIA,
    )
  })

  it('permite misturar sabores de categorias diferentes com MAIOR_SABOR', async () => {
    const ambiente = await setup({
      regraPrecificacao: REGRA_PRECIFICACAO_PIZZA.MEDIA_SABORES,
    })
    const categoriaEspecial = ambiente.criarCategoria({
      nome: 'Especial',
      regraPrecificacao: REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR,
    })
    const saborEspecial = ambiente.criarSabor({ nome: 'Premium' })
    ambiente.vincularSaborCategoria({
      categoriaId: categoriaEspecial.id,
      saborId: saborEspecial.id,
    })
    ambiente.definirPreco({
      saborId: saborEspecial.id,
      tamanhoId: ambiente.tamanhoM.id,
      valorCentavos: 5000,
    })

    const preview = ambiente.montarPreview({
      tamanhoId: ambiente.tamanhoM.id,
      saborIds: [ambiente.sabores.mussarela.id, saborEspecial.id],
    })

    expect(preview.valorFinalCentavos).toBe(5000)
    expect(preview.categoria.regraPrecificacao).toBe(REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR)
  })

  it('mantem precos diferentes por tamanho', async () => {
    const ambiente = await setup()
    const precos = ambiente.listarPrecosSabor({
      saborId: ambiente.sabores.calabresa.id,
      apenasAtivos: true,
    })

    const porTamanho = Object.fromEntries(
      precos.map((p) => [p.pizzaTamanhoId, p.valorCentavos]),
    )
    expect(porTamanho[IDS_TAMANHO_SEED.P]).toBe(3000)
    expect(porTamanho[IDS_TAMANHO_SEED.M]).toBe(4000)
    expect(porTamanho[IDS_TAMANHO_SEED.G]).toBe(5000)
  })

  it('calcula MAIOR_SABOR no preview e no pedido', async () => {
    const ambiente = await setup({
      regraPrecificacao: REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR,
    })
    const preview = ambiente.montarPreview({
      categoriaId: ambiente.categoria.id,
      tamanhoId: ambiente.tamanhoM.id,
      saborIds: [ambiente.sabores.mussarela.id, ambiente.sabores.portuguesa.id],
    })
    // M: mussarela 3500, portuguesa 4200 → maior 4200
    expect(preview.valorFinalCentavos).toBe(4200)

    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    const resumo = ambiente.adicionarPizza({
      pedidoId: pedido.id,
      categoriaId: ambiente.categoria.id,
      tamanhoId: ambiente.tamanhoM.id,
      saborIds: [ambiente.sabores.mussarela.id, ambiente.sabores.portuguesa.id],
    })
    expect(resumo.pedido.totalCentavos).toBe(4200)
  })

  it('calcula MEDIA_SABORES com arredondamento (1000+1001 → 1001)', async () => {
    const ambiente = await setup({
      regraPrecificacao: REGRA_PRECIFICACAO_PIZZA.MEDIA_SABORES,
    })
    const a = ambiente.criarSabor({ nome: 'Media A' })
    const b = ambiente.criarSabor({ nome: 'Media B' })
    for (const sabor of [a, b]) {
      ambiente.vincularSaborCategoria({
        categoriaId: ambiente.categoria.id,
        saborId: sabor.id,
      })
    }
    ambiente.definirPreco({
      saborId: a.id,
      tamanhoId: ambiente.tamanhoP.id,
      valorCentavos: 1000,
    })
    ambiente.definirPreco({
      saborId: b.id,
      tamanhoId: ambiente.tamanhoP.id,
      valorCentavos: 1001,
    })

    const preview = ambiente.montarPreview({
      categoriaId: ambiente.categoria.id,
      tamanhoId: ambiente.tamanhoP.id,
      saborIds: [a.id, b.id],
    })
    expect(preview.valorFinalCentavos).toBe(1001)
  })

  it('adiciona pizza com 1 sabor; P/M com 2; G com 3', async () => {
    const ambiente = await setup()
    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })

    const uma = ambiente.adicionarPizza({
      pedidoId: pedido.id,
      categoriaId: ambiente.categoria.id,
      tamanhoId: ambiente.tamanhoP.id,
      saborIds: [ambiente.sabores.calabresa.id],
    })
    expect(uma.itens).toHaveLength(1)
    expect(uma.itens[0]?.tipo).toBe(TIPO_PEDIDO_ITEM.PIZZA)
    expect(uma.pedido.totalCentavos).toBe(3000)

    const duasP = ambiente.adicionarPizza({
      pedidoId: pedido.id,
      categoriaId: ambiente.categoria.id,
      tamanhoId: ambiente.tamanhoP.id,
      saborIds: [ambiente.sabores.calabresa.id, ambiente.sabores.mussarela.id],
    })
    expect(duasP.itens).toHaveLength(2)

    const duasM = ambiente.adicionarPizza({
      pedidoId: pedido.id,
      categoriaId: ambiente.categoria.id,
      tamanhoId: ambiente.tamanhoM.id,
      saborIds: [ambiente.sabores.calabresa.id, ambiente.sabores.frango.id],
    })
    expect(duasM.itens).toHaveLength(3)

    const tresG = ambiente.adicionarPizza({
      pedidoId: pedido.id,
      categoriaId: ambiente.categoria.id,
      tamanhoId: ambiente.tamanhoG.id,
      saborIds: [
        ambiente.sabores.calabresa.id,
        ambiente.sabores.mussarela.id,
        ambiente.sabores.portuguesa.id,
      ],
    })
    expect(tresG.itens).toHaveLength(4)
  })

  it('bloqueia P/M com 3 sabores, G com 4, vazio, duplicado, sem preco e inativos', async () => {
    const ambiente = await setup()
    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    const base = {
      pedidoId: pedido.id,
      categoriaId: ambiente.categoria.id,
    }
    const tresSabores = [
      ambiente.sabores.calabresa.id,
      ambiente.sabores.mussarela.id,
      ambiente.sabores.portuguesa.id,
    ]

    esperarErroPizzas(
      () =>
        ambiente.adicionarPizza({
          ...base,
          tamanhoId: ambiente.tamanhoP.id,
          saborIds: tresSabores,
        }),
      CODIGOS_ERRO_PIZZAS.PIZZA_QUANTIDADE_SABORES_EXCEDE_LIMITE,
    )

    esperarErroPizzas(
      () =>
        ambiente.adicionarPizza({
          ...base,
          tamanhoId: ambiente.tamanhoM.id,
          saborIds: tresSabores,
        }),
      CODIGOS_ERRO_PIZZAS.PIZZA_QUANTIDADE_SABORES_EXCEDE_LIMITE,
    )

    esperarErroPizzas(
      () =>
        ambiente.adicionarPizza({
          ...base,
          tamanhoId: ambiente.tamanhoG.id,
          saborIds: [
            ...tresSabores,
            ambiente.sabores.frango.id,
          ],
        }),
      CODIGOS_ERRO_PIZZAS.PIZZA_QUANTIDADE_SABORES_EXCEDE_LIMITE,
    )

    esperarErroPizzas(
      () =>
        ambiente.adicionarPizza({
          ...base,
          tamanhoId: ambiente.tamanhoP.id,
          saborIds: [],
        }),
      CODIGOS_ERRO_PIZZAS.PIZZA_SEM_SABOR,
    )

    esperarErroPizzas(
      () =>
        ambiente.adicionarPizza({
          ...base,
          tamanhoId: ambiente.tamanhoP.id,
          saborIds: [
            ambiente.sabores.calabresa.id,
            ambiente.sabores.calabresa.id,
          ],
        }),
      CODIGOS_ERRO_PIZZAS.PIZZA_SABOR_DUPLICADO,
    )

    const semPreco = ambiente.criarSabor({ nome: 'Sem Preco' })
    ambiente.vincularSaborCategoria({
      categoriaId: ambiente.categoria.id,
      saborId: semPreco.id,
    })
    esperarErroPizzas(
      () =>
        ambiente.adicionarPizza({
          ...base,
          tamanhoId: ambiente.tamanhoP.id,
          saborIds: [semPreco.id],
        }),
      CODIGOS_ERRO_PIZZAS.PIZZA_PRECO_NAO_CONFIGURADO_PARA_TAMANHO,
    )

    ambiente.atualizarCategoria({
      categoriaId: ambiente.categoria.id,
      ativa: false,
    })
    esperarErroPizzas(
      () =>
        ambiente.adicionarPizza({
          ...base,
          tamanhoId: ambiente.tamanhoP.id,
          saborIds: [ambiente.sabores.calabresa.id],
        }),
      CODIGOS_ERRO_PIZZAS.PIZZA_CATEGORIA_INATIVA,
    )
    ambiente.atualizarCategoria({
      categoriaId: ambiente.categoria.id,
      ativa: true,
    })

    ambiente.atualizarTamanho({
      tamanhoId: ambiente.tamanhoP.id,
      ativa: false,
    })
    esperarErroPizzas(
      () =>
        ambiente.adicionarPizza({
          ...base,
          tamanhoId: ambiente.tamanhoP.id,
          saborIds: [ambiente.sabores.calabresa.id],
        }),
      CODIGOS_ERRO_PIZZAS.PIZZA_TAMANHO_INATIVO,
    )
    ambiente.atualizarTamanho({
      tamanhoId: ambiente.tamanhoP.id,
      ativa: true,
    })

    ambiente.atualizarSabor({
      saborId: ambiente.sabores.calabresa.id,
      ativa: false,
    })
    esperarErroPizzas(
      () =>
        ambiente.adicionarPizza({
          ...base,
          tamanhoId: ambiente.tamanhoP.id,
          saborIds: [ambiente.sabores.calabresa.id],
        }),
      CODIGOS_ERRO_PIZZAS.PIZZA_SABOR_INATIVO,
    )
  })

  it('cria pedido_item + pizza_pedido_item + sabores com snapshots', async () => {
    const ambiente = await setup()
    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    const resumo = ambiente.adicionarPizza({
      pedidoId: pedido.id,
      categoriaId: ambiente.categoria.id,
      tamanhoId: ambiente.tamanhoG.id,
      saborIds: [
        ambiente.sabores.calabresa.id,
        ambiente.sabores.mussarela.id,
      ],
      observacao: 'Sem cebola',
    })

    const item = resumo.itens[0]!
    expect(item.tipo).toBe(TIPO_PEDIDO_ITEM.PIZZA)
    expect(item.produtoId).toBeNull()
    expect(item.quantidade).toBe(1)
    expect(item.observacao).toBe('Sem cebola')
    expect(item.produtoNome).toContain('Calabresa')
    expect(item.produtoNome).toContain('Mussarela')

    const pizza = ambiente.obterPizzaItem({ pedidoItemId: item.id })
    expect(pizza.pedidoItemId).toBe(item.id)
    expect(pizza.categoriaNomeSnapshot).toBe('Tradicional')
    expect(pizza.tamanhoNomeSnapshot).toBe(ambiente.tamanhoG.nome)
    expect(pizza.regraPrecificacaoSnapshot).toBe(
      REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR,
    )
    // G: calabresa 5000, mussarela 4500 → MAIOR_SABOR = 5000
    expect(pizza.valorCalculadoCentavos).toBe(5000)
    expect(pizza.sabores).toHaveLength(2)
    expect(pizza.sabores[0]).toMatchObject({
      pizzaSaborId: ambiente.sabores.calabresa.id,
      saborNomeSnapshot: 'Calabresa',
      valorSaborSnapshotCentavos: 5000,
      ordem: 1,
    })
    expect(pizza.sabores[1]).toMatchObject({
      pizzaSaborId: ambiente.sabores.mussarela.id,
      saborNomeSnapshot: 'Mussarela',
      valorSaborSnapshotCentavos: 4500,
      ordem: 2,
    })
  })

  it('alteracao posterior de preco nao muda item ja adicionado', async () => {
    const ambiente = await setup()
    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    const resumo = ambiente.adicionarPizza({
      pedidoId: pedido.id,
      categoriaId: ambiente.categoria.id,
      tamanhoId: ambiente.tamanhoP.id,
      saborIds: [ambiente.sabores.calabresa.id],
    })
    const item = resumo.itens[0]!
    expect(item.precoUnitarioCentavos).toBe(3000)

    ambiente.definirPreco({
      saborId: ambiente.sabores.calabresa.id,
      tamanhoId: ambiente.tamanhoP.id,
      valorCentavos: 9999,
    })

    const pizza = ambiente.obterPizzaItem({ pedidoItemId: item.id })
    expect(pizza.valorCalculadoCentavos).toBe(3000)
    expect(pizza.sabores[0]?.valorSaborSnapshotCentavos).toBe(3000)

    const pedidoAtual = ambiente.repositorioPedido.buscarPorId(pedido.id)!
    expect(pedidoAtual.totalCentavos).toBe(3000)

    const itemPersistido = ambiente.repositorioItem.buscarPorId(item.id)!
    expect(itemPersistido.precoUnitarioCentavos).toBe(3000)
  })

  it('pizza atualiza total do pedido', async () => {
    const ambiente = await setup()
    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 1,
    })

    const resumo = ambiente.adicionarPizza({
      pedidoId: pedido.id,
      categoriaId: ambiente.categoria.id,
      tamanhoId: ambiente.tamanhoP.id,
      saborIds: [ambiente.sabores.calabresa.id],
    })

    // produto 600 + pizza 3000
    expect(resumo.pedido.subtotalCentavos).toBe(3600)
    expect(resumo.pedido.totalCentavos).toBe(3600)
    expect(resumo.pedido.valorRestanteCentavos).toBe(3600)
  })

  it('desconto e cortesia funcionam em pedido com pizza', async () => {
    const ambiente = await setup()
    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    ambiente.adicionarPizza({
      pedidoId: pedido.id,
      categoriaId: ambiente.categoria.id,
      tamanhoId: ambiente.tamanhoP.id,
      saborIds: [ambiente.sabores.calabresa.id],
    })

    const comDesconto = ambiente.aplicarDesconto({
      pedidoId: pedido.id,
      descontoCentavos: 500,
      motivoDesconto: 'Promocao pizza',
    })
    expect(comDesconto.pedido.descontoPedidoCentavos).toBe(500)
    expect(comDesconto.pedido.totalCentavos).toBe(2500)
    expect(comDesconto.pedido.valorRestanteCentavos).toBe(2500)

    const cortesia = ambiente.registrarPagamentoPedido({
      pedidoId: pedido.id,
      formaPagamento: FORMA_PAGAMENTO.CORTESIA,
      valorCentavos: 1000,
      motivoCortesia: 'Cortesia da casa',
    })
    expect(cortesia.valorRestanteCentavos).toBe(1500)
  })

  it('bloqueia adicionar e remover pizza com divisao ativa', async () => {
    const ambiente = await setup()
    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    const resumo = ambiente.adicionarPizza({
      pedidoId: pedido.id,
      categoriaId: ambiente.categoria.id,
      tamanhoId: ambiente.tamanhoP.id,
      saborIds: [ambiente.sabores.calabresa.id],
    })
    const itemPizza = resumo.itens[0]!
    const total = resumo.pedido.totalCentavos
    const metade = total / 2

    ambiente.criarDivisao({
      pedidoId: pedido.id,
      partes: [
        { identificacao: 'A', valorDefinidoCentavos: metade },
        { identificacao: 'B', valorDefinidoCentavos: metade },
      ],
    })

    esperarErroPizzas(
      () =>
        ambiente.adicionarPizza({
          pedidoId: pedido.id,
          categoriaId: ambiente.categoria.id,
          tamanhoId: ambiente.tamanhoP.id,
          saborIds: [ambiente.sabores.mussarela.id],
        }),
      CODIGOS_ERRO_PIZZAS.ALTERACAO_PIZZA_BLOQUEADA_POR_DIVISAO_ATIVA,
    )

    esperarErroPizzas(
      () =>
        ambiente.cancelarItemPedido({
          pedidoId: pedido.id,
          itemId: itemPizza.id,
          motivoCancelamento: 'tentativa com divisao ativa',
        }),
      CODIGOS_ERRO_PIZZAS.ALTERACAO_PIZZA_BLOQUEADA_POR_DIVISAO_ATIVA,
    )
  })

  it('faz rollback sem deixar pedido_item orfao se pizza_pedido_item falhar', async () => {
    const ambiente = await setup()
    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })

    const repositorioPizzaItem = criarPizzaPedidoItemRepository()
    const repositorioPizzaItemFalhando = {
      buscarPorPedidoItemId: repositorioPizzaItem.buscarPorPedidoItemId.bind(
        repositorioPizzaItem,
      ),
      listarPorPedidoItemIds: repositorioPizzaItem.listarPorPedidoItemIds.bind(
        repositorioPizzaItem,
      ),
      inserir: () => {
        throw new Error('falha forçada no pizza_pedido_item')
      },
    } as unknown as ReturnType<typeof criarPizzaPedidoItemRepository>

    const adicionarComFalha = criarAdicionarPizzaAoPedido(
      ambiente.repositorioPedido,
      ambiente.repositorioItem,
      repositorioPizzaItemFalhando,
      ambiente.repositorioCategoria,
      ambiente.repositorioTamanho,
      ambiente.repositorioSabor,
      ambiente.repositorioPreco,
      ambiente.repositorioDivisao,
    )

    expect(() =>
      adicionarComFalha({
        pedidoId: pedido.id,
        categoriaId: ambiente.categoria.id,
        tamanhoId: ambiente.tamanhoP.id,
        saborIds: [ambiente.sabores.calabresa.id],
      }),
    ).toThrow(/falha forçada/)

    const itens = ambiente.repositorioItem.listarPorPedido(pedido.id)
    expect(itens).toHaveLength(0)

    const conexao = obterConexaoBancoLocal()
    const consulta = conexao.instancia.prepare(
      'SELECT COUNT(*) AS total FROM pizza_pedido_item',
    )
    consulta.step()
    const total = (consulta.getAsObject() as { total: number }).total
    consulta.free()
    expect(total).toBe(0)

    const pedidoAtual = ambiente.repositorioPedido.buscarPorId(pedido.id)!
    expect(pedidoAtual.totalCentavos).toBe(0)
  })

  it('valida schemas Zod e mapeia para ENTRADA_INVALIDA no estilo IPC', async () => {
    await setup()

    expect(() =>
      criarPizzaCategoriaSchema.parse({ nome: '   ' }),
    ).toThrow(ZodError)

    esperarErroPizzas(
      () => parseEntradaIpc(criarPizzaCategoriaSchema, { nome: '' }),
      CODIGOS_ERRO_PIZZAS.ENTRADA_INVALIDA,
    )

    esperarErroPizzas(
      () =>
        parseEntradaIpc(criarPizzaTamanhoSchema, {
          nome: 'Pequena',
          sigla: 'P',
          maximoSabores: 0,
        }),
      CODIGOS_ERRO_PIZZAS.ENTRADA_INVALIDA,
    )

    esperarErroPizzas(
      () => parseEntradaIpc(criarPizzaSaborSchema, { nome: '  ' }),
      CODIGOS_ERRO_PIZZAS.ENTRADA_INVALIDA,
    )

    esperarErroPizzas(
      () =>
        parseEntradaIpc(definirPrecoSaborPorTamanhoSchema, {
          saborId: 's1',
          tamanhoId: 't1',
          valorCentavos: -1,
        }),
      CODIGOS_ERRO_PIZZAS.ENTRADA_INVALIDA,
    )

    esperarErroPizzas(
      () =>
        parseEntradaIpc(vincularSaborCategoriaSchema, {
          categoriaId: '',
          saborId: 's1',
        }),
      CODIGOS_ERRO_PIZZAS.ENTRADA_INVALIDA,
    )

    esperarErroPizzas(
      () =>
        parseEntradaIpc(adicionarPizzaAoPedidoSchema, {
          pedidoId: 'p1',
          categoriaId: 'c1',
          tamanhoId: 't1',
          saborIds: [''],
        }),
      CODIGOS_ERRO_PIZZAS.ENTRADA_INVALIDA,
    )

    esperarErroPizzas(
      () =>
        parseEntradaIpc(montarPreviewPizzaSchema, {
          categoriaId: 'c1',
          tamanhoId: 't1',
          saborIds: 'nao-array',
        }),
      CODIGOS_ERRO_PIZZAS.ENTRADA_INVALIDA,
    )

    expect(
      atualizarPizzaCategoriaSchema.parse({
        categoriaId: 'cat-1',
        nome: 'Ok',
      }).nome,
    ).toBe('Ok')
  })
})
