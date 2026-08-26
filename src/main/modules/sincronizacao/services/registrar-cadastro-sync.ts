import type { ConexaoSqlite } from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import type { CategoriaProduto } from '@shared/types/categoria-produto'
import type { Produto } from '@shared/types/produto'
import type { Mesa } from '@shared/types/mesa'
import type { Cliente } from '@shared/types/cliente'
import type { TalaoBaixa } from '@shared/types/talao'
import type {
  PizzaCategoria,
  PizzaSabor,
  PizzaSaborPreco,
  PizzaTamanho,
} from '@shared/types/pizza'
import {
  ENTIDADE_SYNC,
  OPERACAO_SYNC,
  type EntidadeSync,
  type OperacaoSync,
} from '@shared/types/sincronizacao'
import { registrarEventoSync } from './registrar-evento-sync'

export function serializarCategoriaProduto(
  categoria: CategoriaProduto,
): Record<string, unknown> {
  return {
    id: categoria.id,
    nome: categoria.nome,
    descricao: categoria.descricao,
    ativo: categoria.ativo,
    criadoEm: categoria.criadoEm,
    atualizadoEm: categoria.atualizadoEm,
  }
}

export function serializarProduto(produto: Produto): Record<string, unknown> {
  return {
    id: produto.id,
    categoriaId: produto.categoriaId,
    nome: produto.nome,
    descricao: produto.descricao,
    precoCentavos: produto.precoCentavos,
    ativo: produto.ativo,
    criadoEm: produto.criadoEm,
    atualizadoEm: produto.atualizadoEm,
  }
}

export function serializarMesa(mesa: Mesa): Record<string, unknown> {
  return {
    id: mesa.id,
    numero: mesa.numero,
    nome: mesa.nome,
    status: mesa.status,
    ativo: mesa.ativo,
    criadoEm: mesa.criadoEm,
    atualizadoEm: mesa.atualizadoEm,
  }
}

export function serializarCliente(cliente: Cliente): Record<string, unknown> {
  return {
    id: cliente.id,
    nome: cliente.nome,
    telefone: cliente.telefone,
    documento: cliente.documento,
    endereco: cliente.endereco,
    liberaTalao: cliente.liberaTalao,
    ativo: cliente.ativo,
    criadoEm: cliente.criadoEm,
    atualizadoEm: cliente.atualizadoEm,
  }
}

export function serializarTalaoBaixa(baixa: TalaoBaixa): Record<string, unknown> {
  return {
    id: baixa.id,
    clienteId: baixa.clienteId,
    sessaoCaixaId: baixa.sessaoCaixaId,
    formaPagamento: baixa.formaPagamento,
    valorCentavos: baixa.valorCentavos,
    valorRecebidoCentavos: baixa.valorRecebidoCentavos,
    trocoCentavos: baixa.trocoCentavos,
    competencia: baixa.competencia,
    observacao: baixa.observacao,
    criadoEm: baixa.criadoEm,
    atualizadoEm: baixa.atualizadoEm,
  }
}

export function serializarPizzaCategoria(
  categoria: PizzaCategoria,
): Record<string, unknown> {
  return {
    id: categoria.id,
    nome: categoria.nome,
    descricao: categoria.descricao,
    regraPrecificacao: categoria.regraPrecificacao,
    ativa: categoria.ativa,
    ordem: categoria.ordem,
    criadoEm: categoria.criadoEm,
    atualizadoEm: categoria.atualizadoEm,
  }
}

export function serializarPizzaTamanho(tamanho: PizzaTamanho): Record<string, unknown> {
  return {
    id: tamanho.id,
    nome: tamanho.nome,
    sigla: tamanho.sigla,
    maximoSabores: tamanho.maximoSabores,
    ativa: tamanho.ativa,
    ordem: tamanho.ordem,
    criadoEm: tamanho.criadoEm,
    atualizadoEm: tamanho.atualizadoEm,
  }
}

export function serializarPizzaSabor(sabor: PizzaSabor): Record<string, unknown> {
  return {
    id: sabor.id,
    nome: sabor.nome,
    descricao: sabor.descricao,
    ativa: sabor.ativa,
    ordem: sabor.ordem,
    criadoEm: sabor.criadoEm,
    atualizadoEm: sabor.atualizadoEm,
  }
}

export function serializarPizzaSaborPreco(
  preco: PizzaSaborPreco,
): Record<string, unknown> {
  return {
    id: preco.id,
    pizzaSaborId: preco.pizzaSaborId,
    pizzaTamanhoId: preco.pizzaTamanhoId,
    valorCentavos: preco.valorCentavos,
    ativo: preco.ativo,
    criadoEm: preco.criadoEm,
    atualizadoEm: preco.atualizadoEm,
  }
}

export function registrarCadastroSync(
  entidade: EntidadeSync,
  entidadeId: string,
  operacao: OperacaoSync,
  payload: Record<string, unknown>,
  conexao: ConexaoSqlite = obterConexaoBancoLocal(),
): void {
  registrarEventoSync(conexao ?? obterConexaoBancoLocal(), {
    entidade,
    entidadeId,
    operacao,
    payload,
  })
}

export function registrarCategoriaProdutoSync(
  categoria: CategoriaProduto,
  operacao: OperacaoSync = OPERACAO_SYNC.UPDATE,
  conexao?: ConexaoSqlite,
): void {
  registrarCadastroSync(
    ENTIDADE_SYNC.CATEGORIA_PRODUTO,
    categoria.id,
    operacao,
    serializarCategoriaProduto(categoria),
    conexao,
  )
}

export function registrarProdutoSync(
  produto: Produto,
  operacao: OperacaoSync = OPERACAO_SYNC.UPDATE,
  conexao?: ConexaoSqlite,
): void {
  registrarCadastroSync(
    ENTIDADE_SYNC.PRODUTO,
    produto.id,
    operacao,
    serializarProduto(produto),
    conexao,
  )
}

export function registrarMesaSync(
  mesa: Mesa,
  operacao: OperacaoSync = OPERACAO_SYNC.UPDATE,
  conexao?: ConexaoSqlite,
): void {
  registrarCadastroSync(
    ENTIDADE_SYNC.MESA,
    mesa.id,
    operacao,
    serializarMesa(mesa),
    conexao,
  )
}

export function registrarClienteSync(
  cliente: Cliente,
  operacao: OperacaoSync = OPERACAO_SYNC.UPDATE,
  conexao?: ConexaoSqlite,
): void {
  registrarCadastroSync(
    ENTIDADE_SYNC.CLIENTE,
    cliente.id,
    operacao,
    serializarCliente(cliente),
    conexao,
  )
}

export function registrarTalaoBaixaSync(
  baixa: TalaoBaixa,
  conexao?: ConexaoSqlite,
): void {
  registrarCadastroSync(
    ENTIDADE_SYNC.TALAO_BAIXA,
    baixa.id,
    OPERACAO_SYNC.CREATE,
    serializarTalaoBaixa(baixa),
    conexao,
  )
}

export function registrarPizzaCategoriaSync(
  categoria: PizzaCategoria,
  operacao: OperacaoSync = OPERACAO_SYNC.UPDATE,
  conexao?: ConexaoSqlite,
): void {
  registrarCadastroSync(
    ENTIDADE_SYNC.PIZZA_CATEGORIA,
    categoria.id,
    operacao,
    serializarPizzaCategoria(categoria),
    conexao,
  )
}

export function registrarPizzaTamanhoSync(
  tamanho: PizzaTamanho,
  operacao: OperacaoSync = OPERACAO_SYNC.UPDATE,
  conexao?: ConexaoSqlite,
): void {
  registrarCadastroSync(
    ENTIDADE_SYNC.PIZZA_TAMANHO,
    tamanho.id,
    operacao,
    serializarPizzaTamanho(tamanho),
    conexao,
  )
}

export function registrarPizzaSaborSync(
  sabor: PizzaSabor,
  operacao: OperacaoSync = OPERACAO_SYNC.UPDATE,
  conexao?: ConexaoSqlite,
): void {
  registrarCadastroSync(
    ENTIDADE_SYNC.PIZZA_SABOR,
    sabor.id,
    operacao,
    serializarPizzaSabor(sabor),
    conexao,
  )
}

export function registrarPizzaVinculoSync(
  categoriaId: string,
  saborId: string,
  ativo: boolean,
  conexao?: ConexaoSqlite,
): void {
  registrarCadastroSync(
    ENTIDADE_SYNC.PIZZA_CATEGORIA_SABOR,
    `${categoriaId}:${saborId}`,
    OPERACAO_SYNC.UPDATE,
    {
      pizzaCategoriaId: categoriaId,
      pizzaSaborId: saborId,
      ativo,
      criadoEm: new Date().toISOString(),
    },
    conexao,
  )
}

export function registrarPizzaSaborPrecoSync(
  preco: PizzaSaborPreco,
  conexao?: ConexaoSqlite,
): void {
  registrarCadastroSync(
    ENTIDADE_SYNC.PIZZA_SABOR_PRECO,
    preco.id,
    OPERACAO_SYNC.UPDATE,
    serializarPizzaSaborPreco(preco),
    conexao,
  )
}
