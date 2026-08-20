import type { ConexaoSqlite } from '../../../database/conexao-sqlite'
import {
  consultarValorMetadata,
  definirValorMetadata,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import { ENTIDADE_SYNC, OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { criarCategoriaProdutoRepository } from '../../produtos/repositories/categoria-produto.repository'
import { criarProdutoRepository } from '../../produtos/repositories/produto.repository'
import { criarMesaRepository } from '../../mesas/repositories/mesa.repository'
import { criarClienteRepository } from '../../clientes/repositories/cliente.repository'
import { criarPizzaCategoriaRepository } from '../../pizzas/repositories/pizza-categoria.repository'
import { criarPizzaTamanhoRepository } from '../../pizzas/repositories/pizza-tamanho.repository'
import { criarPizzaSaborRepository } from '../../pizzas/repositories/pizza-sabor.repository'
import { criarPizzaSaborPrecoRepository } from '../../pizzas/repositories/pizza-sabor-preco.repository'
import {
  registrarCadastroSync,
  serializarCategoriaProduto,
  serializarCliente,
  serializarMesa,
  serializarPizzaCategoria,
  serializarPizzaSabor,
  serializarPizzaSaborPreco,
  serializarPizzaTamanho,
  serializarProduto,
} from './registrar-cadastro-sync'

const CHAVE_BOOTSTRAP = 'sync_cadastros_enfileirados'

function listarLinhas(
  conexao: ConexaoSqlite,
  sql: string,
): Record<string, unknown>[] {
  const consulta = conexao.instancia.prepare(sql)
  const linhas: Record<string, unknown>[] = []
  while (consulta.step()) {
    linhas.push(consulta.getAsObject() as Record<string, unknown>)
  }
  consulta.free()
  return linhas
}

export function enfileirarCadastrosIniciais(
  conexao: ConexaoSqlite = obterConexaoBancoLocal(),
): void {
  if (consultarValorMetadata(conexao, CHAVE_BOOTSTRAP)) {
    return
  }

  for (const categoria of criarCategoriaProdutoRepository(conexao).listar()) {
    registrarCadastroSync(
      ENTIDADE_SYNC.CATEGORIA_PRODUTO,
      categoria.id,
      OPERACAO_SYNC.UPDATE,
      serializarCategoriaProduto(categoria),
      conexao,
    )
  }

  for (const produto of criarProdutoRepository(conexao).listarComCategoria()) {
    registrarCadastroSync(
      ENTIDADE_SYNC.PRODUTO,
      produto.id,
      OPERACAO_SYNC.UPDATE,
      serializarProduto(produto),
      conexao,
    )
  }

  for (const mesa of criarMesaRepository(conexao).listar()) {
    registrarCadastroSync(
      ENTIDADE_SYNC.MESA,
      mesa.id,
      OPERACAO_SYNC.UPDATE,
      serializarMesa(mesa),
      conexao,
    )
  }

  for (const cliente of criarClienteRepository(conexao).listar()) {
    registrarCadastroSync(
      ENTIDADE_SYNC.CLIENTE,
      cliente.id,
      OPERACAO_SYNC.UPDATE,
      serializarCliente(cliente),
      conexao,
    )
  }

  for (const categoria of criarPizzaCategoriaRepository(conexao).listar()) {
    registrarCadastroSync(
      ENTIDADE_SYNC.PIZZA_CATEGORIA,
      categoria.id,
      OPERACAO_SYNC.UPDATE,
      serializarPizzaCategoria(categoria),
      conexao,
    )
  }

  for (const tamanho of criarPizzaTamanhoRepository(conexao).listar()) {
    registrarCadastroSync(
      ENTIDADE_SYNC.PIZZA_TAMANHO,
      tamanho.id,
      OPERACAO_SYNC.UPDATE,
      serializarPizzaTamanho(tamanho),
      conexao,
    )
  }

  const repositorioSabor = criarPizzaSaborRepository(conexao)
  const repositorioPreco = criarPizzaSaborPrecoRepository(conexao)
  for (const sabor of repositorioSabor.listar()) {
    registrarCadastroSync(
      ENTIDADE_SYNC.PIZZA_SABOR,
      sabor.id,
      OPERACAO_SYNC.UPDATE,
      serializarPizzaSabor(sabor),
      conexao,
    )
    for (const preco of repositorioPreco.listarPorSabor(sabor.id)) {
      registrarCadastroSync(
        ENTIDADE_SYNC.PIZZA_SABOR_PRECO,
        preco.id,
        OPERACAO_SYNC.UPDATE,
        serializarPizzaSaborPreco(preco),
        conexao,
      )
    }
  }

  for (const vinculo of listarLinhas(
    conexao,
    `SELECT pizza_categoria_id, pizza_sabor_id, ativo, criado_em
     FROM pizza_categoria_sabor`,
  )) {
    const categoriaId = String(vinculo.pizza_categoria_id)
    const saborId = String(vinculo.pizza_sabor_id)
    registrarCadastroSync(
      ENTIDADE_SYNC.PIZZA_CATEGORIA_SABOR,
      `${categoriaId}:${saborId}`,
      OPERACAO_SYNC.UPDATE,
      {
        pizzaCategoriaId: categoriaId,
        pizzaSaborId: saborId,
        ativo: Number(vinculo.ativo) === 1,
        criadoEm: vinculo.criado_em,
      },
      conexao,
    )
  }

  definirValorMetadata(conexao, CHAVE_BOOTSTRAP, agoraEmIsoUtc())
}
