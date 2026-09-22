import type {
  AtualizarPizzaSaborEntrada,
  CriarPizzaSaborEntrada,
  DefinirPrecoSaborPorTamanhoEntrada,
  PizzaSabor,
  PizzaSaborPreco,
  VincularSaborCategoriaEntrada,
} from '@shared/types/pizza'
import { CODIGOS_ERRO_PIZZAS, ErroPizzas } from '../errors/erros-pizzas'
import type { PizzaCategoriaRepository } from '../repositories/pizza-categoria.repository'
import { criarPizzaCategoriaRepository } from '../repositories/pizza-categoria.repository'
import type { PizzaSaborRepository } from '../repositories/pizza-sabor.repository'
import { criarPizzaSaborRepository } from '../repositories/pizza-sabor.repository'
import type { PizzaSaborPrecoRepository } from '../repositories/pizza-sabor-preco.repository'
import { criarPizzaSaborPrecoRepository } from '../repositories/pizza-sabor-preco.repository'
import type { PizzaTamanhoRepository } from '../repositories/pizza-tamanho.repository'
import { criarPizzaTamanhoRepository } from '../repositories/pizza-tamanho.repository'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { ACAO_AUDITORIA } from '@shared/types/auditoria'
import { formatarCentavosParaReais } from '@shared/utils/moeda'
import {
  registrarPizzaSaborPrecoSync,
  registrarPizzaSaborSync,
  registrarPizzaVinculoSync,
} from '../../sincronizacao/services/registrar-cadastro-sync'
import { registrarAcaoAuditoria } from '../../sincronizacao/services/registrar-acao-auditoria'

export function criarCriarPizzaSabor(
  repositorio: PizzaSaborRepository = criarPizzaSaborRepository(),
) {
  return function criarPizzaSabor(entrada: CriarPizzaSaborEntrada): PizzaSabor {
    const nome = entrada.nome.trim()
    if (nome === '') {
      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.NOME_OBRIGATORIO,
        'Nome do sabor e obrigatorio.',
      )
    }

    const sabor = repositorio.inserir({
      nome,
      descricao: entrada.descricao?.trim() || null,
      ordem: entrada.ordem ?? 0,
    })
    registrarPizzaSaborSync(sabor, OPERACAO_SYNC.CREATE)
    return sabor
  }
}

export const criarPizzaSabor = criarCriarPizzaSabor()

export function criarListarPizzaSabores(
  repositorio: PizzaSaborRepository = criarPizzaSaborRepository(),
) {
  return function listarPizzaSabores(entrada?: {
    apenasAtivos?: boolean
    categoriaId?: string
  }): PizzaSabor[] {
    if (entrada?.categoriaId) {
      return repositorio.listarPorCategoria(entrada.categoriaId, {
        apenasAtivos: entrada.apenasAtivos,
      })
    }

    return repositorio.listar({ apenasAtivos: entrada?.apenasAtivos })
  }
}

export const listarPizzaSabores = criarListarPizzaSabores()

export function criarListarPizzaSaboresComCategorias(
  repositorio: PizzaSaborRepository = criarPizzaSaborRepository(),
) {
  return function listarPizzaSaboresComCategorias() {
    return repositorio.listarComCategoriasAtivas()
  }
}

export const listarPizzaSaboresComCategorias = criarListarPizzaSaboresComCategorias()

export function criarAtualizarPizzaSabor(
  repositorio: PizzaSaborRepository = criarPizzaSaborRepository(),
) {
  return function atualizarPizzaSabor(entrada: AtualizarPizzaSaborEntrada): PizzaSabor {
    const existente = repositorio.buscarPorId(entrada.saborId)
    if (!existente) {
      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.PIZZA_SABOR_NAO_ENCONTRADO,
        'Sabor de pizza nao encontrado.',
      )
    }

    if (entrada.nome !== undefined && entrada.nome.trim() === '') {
      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.NOME_OBRIGATORIO,
        'Nome do sabor e obrigatorio.',
      )
    }

    const sabor = repositorio.atualizar({
      saborId: entrada.saborId,
      nome: entrada.nome?.trim(),
      descricao: entrada.descricao,
      ativa: entrada.ativa,
      ordem: entrada.ordem,
    })
    registrarPizzaSaborSync(sabor, OPERACAO_SYNC.UPDATE)
    return sabor
  }
}

export const atualizarPizzaSabor = criarAtualizarPizzaSabor()

export function criarVincularSaborCategoria(
  repositorioSabor: PizzaSaborRepository = criarPizzaSaborRepository(),
  repositorioCategoria: PizzaCategoriaRepository = criarPizzaCategoriaRepository(),
) {
  return function vincularSaborCategoria(entrada: VincularSaborCategoriaEntrada): void {
    const categoria = repositorioCategoria.buscarPorId(entrada.categoriaId)
    if (!categoria) {
      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.PIZZA_CATEGORIA_NAO_ENCONTRADA,
        'Categoria de pizza nao encontrada.',
      )
    }

    const sabor = repositorioSabor.buscarPorId(entrada.saborId)
    if (!sabor) {
      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.PIZZA_SABOR_NAO_ENCONTRADO,
        'Sabor de pizza nao encontrado.',
      )
    }

    repositorioSabor.vincularCategoria({
      categoriaId: entrada.categoriaId,
      saborId: entrada.saborId,
      ativo: entrada.ativo ?? true,
    })
    registrarPizzaVinculoSync(
      entrada.categoriaId,
      entrada.saborId,
      entrada.ativo ?? true,
    )
  }
}

export const vincularSaborCategoria = criarVincularSaborCategoria()

export function criarDefinirPrecoSaborPorTamanho(
  repositorioPreco: PizzaSaborPrecoRepository = criarPizzaSaborPrecoRepository(),
  repositorioSabor: PizzaSaborRepository = criarPizzaSaborRepository(),
  repositorioTamanho: PizzaTamanhoRepository = criarPizzaTamanhoRepository(),
) {
  return function definirPrecoSaborPorTamanho(
    entrada: DefinirPrecoSaborPorTamanhoEntrada,
  ): PizzaSaborPreco {
    if (!Number.isInteger(entrada.valorCentavos) || entrada.valorCentavos < 0) {
      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.PRECO_INVALIDO,
        'Preco deve ser um inteiro em centavos maior ou igual a zero.',
      )
    }

    const sabor = repositorioSabor.buscarPorId(entrada.saborId)
    if (!sabor) {
      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.PIZZA_SABOR_NAO_ENCONTRADO,
        'Sabor de pizza nao encontrado.',
      )
    }

    const tamanho = repositorioTamanho.buscarPorId(entrada.tamanhoId)
    if (!tamanho) {
      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.PIZZA_TAMANHO_NAO_ENCONTRADO,
        'Tamanho de pizza nao encontrado.',
      )
    }

    const precoAntes = repositorioPreco.buscarPorSaborETamanho(
      entrada.saborId,
      entrada.tamanhoId,
    )?.valorCentavos
    const preco = repositorioPreco.definir({
      saborId: entrada.saborId,
      tamanhoId: entrada.tamanhoId,
      valorCentavos: entrada.valorCentavos,
    })
    if (precoAntes !== entrada.valorCentavos) {
      const nome = `${sabor.nome} ${tamanho.nome}`
      registrarAcaoAuditoria({
        acao: ACAO_AUDITORIA.PRECO,
        resumo:
          precoAntes === undefined
            ? `Definiu o preço de ${nome} em ${formatarCentavosParaReais(entrada.valorCentavos)}`
            : `Alterou o preço de ${nome} de ${formatarCentavosParaReais(precoAntes)} para ${formatarCentavosParaReais(entrada.valorCentavos)}`,
        entidade: 'PIZZA_SABOR_PRECO',
        entidadeId: preco.id,
        detalhes: {
          saborId: entrada.saborId,
          tamanhoId: entrada.tamanhoId,
          precoAnteriorCentavos: precoAntes ?? null,
          precoNovoCentavos: entrada.valorCentavos,
        },
      })
    }
    registrarPizzaSaborPrecoSync(preco)
    return preco
  }
}

export const definirPrecoSaborPorTamanho = criarDefinirPrecoSaborPorTamanho()

export function criarListarPrecosSabor(
  repositorioPreco: PizzaSaborPrecoRepository = criarPizzaSaborPrecoRepository(),
  repositorioSabor: PizzaSaborRepository = criarPizzaSaborRepository(),
) {
  return function listarPrecosSabor(entrada: {
    saborId: string
    apenasAtivos?: boolean
  }): PizzaSaborPreco[] {
    const sabor = repositorioSabor.buscarPorId(entrada.saborId)
    if (!sabor) {
      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.PIZZA_SABOR_NAO_ENCONTRADO,
        'Sabor de pizza nao encontrado.',
      )
    }

    return repositorioPreco.listarPorSabor(entrada.saborId, {
      apenasAtivos: entrada.apenasAtivos,
    })
  }
}

export const listarPrecosSabor = criarListarPrecosSabor()

export function criarListarCategoriasDoSabor(
  repositorioSabor: PizzaSaborRepository = criarPizzaSaborRepository(),
  repositorioCategoria: PizzaCategoriaRepository = criarPizzaCategoriaRepository(),
) {
  return function listarCategoriasDoSabor(entrada: { saborId: string }): string[] {
    const sabor = repositorioSabor.buscarPorId(entrada.saborId)
    if (!sabor) {
      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.PIZZA_SABOR_NAO_ENCONTRADO,
        'Sabor de pizza nao encontrado.',
      )
    }

    return repositorioSabor.listarIdsCategoriasDoSabor(entrada.saborId).filter((id) =>
      Boolean(repositorioCategoria.buscarPorId(id)),
    )
  }
}

export const listarCategoriasDoSabor = criarListarCategoriasDoSabor()
