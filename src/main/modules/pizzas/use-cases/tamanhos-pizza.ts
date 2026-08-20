import type {
  AtualizarPizzaTamanhoEntrada,
  CriarPizzaTamanhoEntrada,
  PizzaTamanho,
} from '@shared/types/pizza'
import { CODIGOS_ERRO_PIZZAS, ErroPizzas } from '../errors/erros-pizzas'
import type { PizzaTamanhoRepository } from '../repositories/pizza-tamanho.repository'
import { criarPizzaTamanhoRepository } from '../repositories/pizza-tamanho.repository'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { registrarPizzaTamanhoSync } from '../../sincronizacao/services/registrar-cadastro-sync'

export function criarCriarPizzaTamanho(
  repositorio: PizzaTamanhoRepository = criarPizzaTamanhoRepository(),
) {
  return function criarPizzaTamanho(entrada: CriarPizzaTamanhoEntrada): PizzaTamanho {
    const nome = entrada.nome.trim()
    const sigla = entrada.sigla.trim()

    if (nome === '') {
      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.NOME_OBRIGATORIO,
        'Nome do tamanho e obrigatorio.',
      )
    }

    if (sigla === '') {
      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.ENTRADA_INVALIDA,
        'Sigla do tamanho e obrigatoria.',
      )
    }

    if (!Number.isInteger(entrada.maximoSabores) || entrada.maximoSabores < 1) {
      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.MAXIMO_SABORES_INVALIDO,
        'Maximo de sabores deve ser um inteiro maior ou igual a 1.',
      )
    }

    const tamanho = repositorio.inserir({
      nome,
      sigla,
      maximoSabores: entrada.maximoSabores,
      ordem: entrada.ordem ?? 0,
    })
    registrarPizzaTamanhoSync(tamanho, OPERACAO_SYNC.CREATE)
    return tamanho
  }
}

export const criarPizzaTamanho = criarCriarPizzaTamanho()

export function criarListarPizzaTamanhos(
  repositorio: PizzaTamanhoRepository = criarPizzaTamanhoRepository(),
) {
  return function listarPizzaTamanhos(entrada?: {
    apenasAtivas?: boolean
  }): PizzaTamanho[] {
    return repositorio.listar({ apenasAtivas: entrada?.apenasAtivas })
  }
}

export const listarPizzaTamanhos = criarListarPizzaTamanhos()

export function criarAtualizarPizzaTamanho(
  repositorio: PizzaTamanhoRepository = criarPizzaTamanhoRepository(),
) {
  return function atualizarPizzaTamanho(
    entrada: AtualizarPizzaTamanhoEntrada,
  ): PizzaTamanho {
    const existente = repositorio.buscarPorId(entrada.tamanhoId)
    if (!existente) {
      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.PIZZA_TAMANHO_NAO_ENCONTRADO,
        'Tamanho de pizza nao encontrado.',
      )
    }

    if (entrada.nome !== undefined && entrada.nome.trim() === '') {
      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.NOME_OBRIGATORIO,
        'Nome do tamanho e obrigatorio.',
      )
    }

    if (entrada.sigla !== undefined && entrada.sigla.trim() === '') {
      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.ENTRADA_INVALIDA,
        'Sigla do tamanho e obrigatoria.',
      )
    }

    if (
      entrada.maximoSabores !== undefined &&
      (!Number.isInteger(entrada.maximoSabores) || entrada.maximoSabores < 1)
    ) {
      throw new ErroPizzas(
        CODIGOS_ERRO_PIZZAS.MAXIMO_SABORES_INVALIDO,
        'Maximo de sabores deve ser um inteiro maior ou igual a 1.',
      )
    }

    const tamanho = repositorio.atualizar({
      tamanhoId: entrada.tamanhoId,
      nome: entrada.nome?.trim(),
      sigla: entrada.sigla?.trim(),
      maximoSabores: entrada.maximoSabores,
      ativa: entrada.ativa,
      ordem: entrada.ordem,
    })
    registrarPizzaTamanhoSync(tamanho, OPERACAO_SYNC.UPDATE)
    return tamanho
  }
}

export const atualizarPizzaTamanho = criarAtualizarPizzaTamanho()
