import { resolverDadosFiscaisProduto } from '@shared/utils/fiscal-produto'
import { ENTIDADE_SYNC, OPERACAO_SYNC } from '@shared/types/sincronizacao'
import type { ConexaoSqlite } from '../../../database/conexao-sqlite'
import { persistirConexaoBanco } from '../../../database/conexao-sqlite'
import type { MudancaCatalogoApi } from './cliente-sync-api'

const ORDEM_APPLY = [
  ENTIDADE_SYNC.CATEGORIA_PRODUTO,
  ENTIDADE_SYNC.PRODUTO,
  ENTIDADE_SYNC.PIZZA_CATEGORIA,
  ENTIDADE_SYNC.PIZZA_TAMANHO,
  ENTIDADE_SYNC.PIZZA_SABOR,
  ENTIDADE_SYNC.PIZZA_CATEGORIA_SABOR,
  ENTIDADE_SYNC.PIZZA_SABOR_PRECO,
] as const

export type ResultadoAplicacaoMudanca = 'aplicado' | 'ignorado' | 'noop'

function texto(valor: unknown, fallback = ''): string {
  return valor === null || valor === undefined ? fallback : String(valor)
}

function inteiro(valor: unknown, fallback = 0): number {
  const n = Number(valor)
  return Number.isFinite(n) ? n : fallback
}

function flag(valor: unknown, fallback = true): number {
  if (valor === undefined || valor === null) {
    return fallback ? 1 : 0
  }
  return valor === true || valor === 1 || valor === '1' ? 1 : 0
}

function iso(valor: unknown, fallback: string): string {
  if (!valor) {
    return fallback
  }
  const data = new Date(String(valor))
  return Number.isNaN(data.getTime()) ? fallback : data.toISOString()
}

function consultarTexto(
  conexao: ConexaoSqlite,
  sql: string,
  parametros: Array<string | number>,
): string | null {
  const consulta = conexao.instancia.prepare(sql)
  consulta.bind(parametros)
  if (!consulta.step()) {
    consulta.free()
    return null
  }
  const linha = consulta.getAsObject() as { valor?: string }
  consulta.free()
  return linha.valor ?? null
}

function existe(conexao: ConexaoSqlite, sql: string, parametros: Array<string | number>): boolean {
  const consulta = conexao.instancia.prepare(sql)
  consulta.bind(parametros)
  const achou = consulta.step()
  consulta.free()
  return achou
}

function nuvemMaisNova(localIso: string | null, nuvemIso: unknown): boolean {
  if (!localIso) {
    return true
  }
  if (!nuvemIso) {
    return true
  }
  const local = Date.parse(localIso)
  const nuvem = Date.parse(String(nuvemIso))
  if (!Number.isFinite(local) || !Number.isFinite(nuvem)) {
    return true
  }
  return nuvem >= local
}

function prioridade(mudanca: MudancaCatalogoApi): number {
  const indice = ORDEM_APPLY.indexOf(mudanca.entidade as (typeof ORDEM_APPLY)[number])
  const base = indice >= 0 ? indice : 50
  return mudanca.operacao === OPERACAO_SYNC.CANCEL ? 100 - base : base
}

export function aplicarMudancasCatalogo(
  conexao: ConexaoSqlite,
  mudancas: MudancaCatalogoApi[],
): { aplicados: number; ignorados: number } {
  const ordenadas = [...mudancas].sort((a, b) => prioridade(a) - prioridade(b) || a.id - b.id)
  let aplicados = 0
  let ignorados = 0

  for (const mudanca of ordenadas) {
    try {
      const resultado = aplicarUmaMudanca(conexao, mudanca)
      if (resultado === 'aplicado') {
        aplicados += 1
      } else if (resultado === 'ignorado') {
        ignorados += 1
      }
    } catch {
      ignorados += 1
    }
  }

  persistirConexaoBanco(conexao)
  return { aplicados, ignorados }
}

export function aplicarUmaMudanca(
  conexao: ConexaoSqlite,
  mudanca: MudancaCatalogoApi,
): ResultadoAplicacaoMudanca {
  if (mudanca.operacao === OPERACAO_SYNC.CANCEL) {
    return aplicarCancelamento(conexao, mudanca)
  }
  return aplicarUpsert(conexao, mudanca)
}

function aplicarCancelamento(
  conexao: ConexaoSqlite,
  mudanca: MudancaCatalogoApi,
): ResultadoAplicacaoMudanca {
  const payload = mudanca.payload ?? {}

  if (mudanca.entidade === ENTIDADE_SYNC.CATEGORIA_PRODUTO) {
    const id = texto(payload.id ?? mudanca.entidadeId)
    if (existe(conexao, 'SELECT 1 FROM produto WHERE categoria_id = ? LIMIT 1', [id])) {
      conexao.instancia.run(
        'UPDATE categoria_produto SET ativo = 0, atualizado_em = ? WHERE id = ?',
        [iso(mudanca.atualizadoEm, new Date().toISOString()), id],
      )
      return 'aplicado'
    }
    conexao.instancia.run('DELETE FROM categoria_produto WHERE id = ?', [id])
    return 'aplicado'
  }

  if (mudanca.entidade === ENTIDADE_SYNC.PRODUTO) {
    const id = texto(payload.id ?? mudanca.entidadeId)
    if (existe(conexao, 'SELECT 1 FROM pedido_item WHERE produto_id = ? LIMIT 1', [id])) {
      conexao.instancia.run(
        'UPDATE produto SET ativo = 0, atualizado_em = ? WHERE id = ?',
        [iso(mudanca.atualizadoEm, new Date().toISOString()), id],
      )
      return 'aplicado'
    }
    conexao.instancia.run('DELETE FROM produto WHERE id = ?', [id])
    return 'aplicado'
  }

  if (mudanca.entidade === ENTIDADE_SYNC.PIZZA_CATEGORIA_SABOR) {
    conexao.instancia.run(
      'DELETE FROM pizza_categoria_sabor WHERE pizza_categoria_id = ? AND pizza_sabor_id = ?',
      [texto(payload.pizzaCategoriaId), texto(payload.pizzaSaborId)],
    )
    return 'aplicado'
  }

  if (mudanca.entidade === ENTIDADE_SYNC.PIZZA_SABOR_PRECO) {
    conexao.instancia.run('DELETE FROM pizza_sabor_preco WHERE id = ?', [
      texto(payload.id ?? mudanca.entidadeId),
    ])
    return 'aplicado'
  }

  if (mudanca.entidade === ENTIDADE_SYNC.PIZZA_SABOR) {
    const id = texto(payload.id ?? mudanca.entidadeId)
    if (
      existe(
        conexao,
        'SELECT 1 FROM pizza_pedido_item_sabor WHERE pizza_sabor_id = ? LIMIT 1',
        [id],
      )
    ) {
      conexao.instancia.run(
        'UPDATE pizza_sabor SET ativa = 0, atualizado_em = ? WHERE id = ?',
        [iso(mudanca.atualizadoEm, new Date().toISOString()), id],
      )
      return 'aplicado'
    }
    conexao.instancia.run('DELETE FROM pizza_sabor_preco WHERE pizza_sabor_id = ?', [id])
    conexao.instancia.run('DELETE FROM pizza_categoria_sabor WHERE pizza_sabor_id = ?', [id])
    conexao.instancia.run('DELETE FROM pizza_sabor WHERE id = ?', [id])
    return 'aplicado'
  }

  if (mudanca.entidade === ENTIDADE_SYNC.PIZZA_CATEGORIA) {
    const id = texto(payload.id ?? mudanca.entidadeId)
    if (
      existe(conexao, 'SELECT 1 FROM pizza_pedido_item WHERE pizza_categoria_id = ? LIMIT 1', [id])
    ) {
      conexao.instancia.run(
        'UPDATE pizza_categoria SET ativa = 0, atualizado_em = ? WHERE id = ?',
        [iso(mudanca.atualizadoEm, new Date().toISOString()), id],
      )
      return 'aplicado'
    }
    conexao.instancia.run('DELETE FROM pizza_categoria_sabor WHERE pizza_categoria_id = ?', [id])
    conexao.instancia.run('DELETE FROM pizza_categoria WHERE id = ?', [id])
    return 'aplicado'
  }

  if (mudanca.entidade === ENTIDADE_SYNC.PIZZA_TAMANHO) {
    const id = texto(payload.id ?? mudanca.entidadeId)
    if (existe(conexao, 'SELECT 1 FROM pizza_pedido_item WHERE pizza_tamanho_id = ? LIMIT 1', [id])) {
      conexao.instancia.run(
        'UPDATE pizza_tamanho SET ativa = 0, atualizado_em = ? WHERE id = ?',
        [iso(mudanca.atualizadoEm, new Date().toISOString()), id],
      )
      return 'aplicado'
    }
    conexao.instancia.run('DELETE FROM pizza_sabor_preco WHERE pizza_tamanho_id = ?', [id])
    conexao.instancia.run('DELETE FROM pizza_tamanho WHERE id = ?', [id])
    return 'aplicado'
  }

  return 'noop'
}

function aplicarUpsert(
  conexao: ConexaoSqlite,
  mudanca: MudancaCatalogoApi,
): ResultadoAplicacaoMudanca {
  const payload = mudanca.payload ?? {}
  const atualizadoEm = iso(payload.atualizadoEm ?? mudanca.atualizadoEm, new Date().toISOString())
  const criadoEm = iso(payload.criadoEm, atualizadoEm)

  if (mudanca.entidade === ENTIDADE_SYNC.CATEGORIA_PRODUTO) {
    const id = texto(payload.id ?? mudanca.entidadeId)
    const local = consultarTexto(
      conexao,
      'SELECT atualizado_em AS valor FROM categoria_produto WHERE id = ?',
      [id],
    )
    if (!nuvemMaisNova(local, atualizadoEm)) {
      return 'ignorado'
    }
    conexao.instancia.run(
      `INSERT INTO categoria_produto (id, nome, descricao, setor_impressao, ativo, criado_em, atualizado_em)
       VALUES (?, ?, ?, NULL, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         nome = excluded.nome,
         descricao = excluded.descricao,
         ativo = excluded.ativo,
         atualizado_em = excluded.atualizado_em`,
      [id, texto(payload.nome), payload.descricao ? texto(payload.descricao) : null, flag(payload.ativo), criadoEm, atualizadoEm],
    )
    return 'aplicado'
  }

  if (mudanca.entidade === ENTIDADE_SYNC.PRODUTO) {
    const id = texto(payload.id ?? mudanca.entidadeId)
    const local = consultarTexto(
      conexao,
      'SELECT atualizado_em AS valor FROM produto WHERE id = ?',
      [id],
    )
    if (!nuvemMaisNova(local, atualizadoEm)) {
      return 'ignorado'
    }
    const categoriaInformada = texto(payload.categoriaId)
    const categoriaId =
      (categoriaInformada &&
      existe(conexao, 'SELECT 1 FROM categoria_produto WHERE id = ? LIMIT 1', [categoriaInformada])
        ? categoriaInformada
        : null) ??
      consultarTexto(conexao, 'SELECT categoria_id AS valor FROM produto WHERE id = ?', [id]) ??
      consultarTexto(
        conexao,
        'SELECT id AS valor FROM categoria_produto ORDER BY ativo DESC, nome ASC LIMIT 1',
        [],
      )
    if (!categoriaId) {
      return 'ignorado'
    }
    const fiscal = resolverDadosFiscaisProduto({
      fiscalNcm: payload.fiscalNcm as string | null | undefined,
      fiscalCest: payload.fiscalCest as string | null | undefined,
      fiscalCfop: payload.fiscalCfop as string | undefined,
      fiscalIcmsOrigem: inteiro(payload.fiscalIcmsOrigem, 0),
      fiscalIcmsCsosn: texto(payload.fiscalIcmsCsosn, '102'),
      fiscalPisCst: texto(payload.fiscalPisCst, '07'),
      fiscalCofinsCst: texto(payload.fiscalCofinsCst, '07'),
      fiscalAliquotaNacional:
        payload.fiscalAliquotaNacional === null || payload.fiscalAliquotaNacional === undefined
          ? null
          : Number(payload.fiscalAliquotaNacional),
    })
    conexao.instancia.run(
      `INSERT INTO produto (
         id, categoria_id, nome, descricao, preco_centavos,
         fiscal_ncm, fiscal_cest, fiscal_cfop, fiscal_icms_origem, fiscal_icms_csosn,
         fiscal_pis_cst, fiscal_cofins_cst, fiscal_aliquota_nacional,
         ativo, criado_em, atualizado_em
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         categoria_id = excluded.categoria_id,
         nome = excluded.nome,
         descricao = excluded.descricao,
         preco_centavos = excluded.preco_centavos,
         fiscal_ncm = excluded.fiscal_ncm,
         fiscal_cest = excluded.fiscal_cest,
         fiscal_cfop = excluded.fiscal_cfop,
         fiscal_icms_origem = excluded.fiscal_icms_origem,
         fiscal_icms_csosn = excluded.fiscal_icms_csosn,
         fiscal_pis_cst = excluded.fiscal_pis_cst,
         fiscal_cofins_cst = excluded.fiscal_cofins_cst,
         fiscal_aliquota_nacional = excluded.fiscal_aliquota_nacional,
         ativo = excluded.ativo,
         atualizado_em = excluded.atualizado_em`,
      [
        id,
        categoriaId,
        texto(payload.nome),
        payload.descricao ? texto(payload.descricao) : null,
        inteiro(payload.precoCentavos),
        fiscal.fiscalNcm,
        fiscal.fiscalCest,
        fiscal.fiscalCfop,
        fiscal.fiscalIcmsOrigem,
        fiscal.fiscalIcmsCsosn,
        fiscal.fiscalPisCst,
        fiscal.fiscalCofinsCst,
        fiscal.fiscalAliquotaNacional,
        flag(payload.ativo),
        criadoEm,
        atualizadoEm,
      ],
    )
    return 'aplicado'
  }

  if (mudanca.entidade === ENTIDADE_SYNC.PIZZA_CATEGORIA) {
    const id = texto(payload.id ?? mudanca.entidadeId)
    const local = consultarTexto(
      conexao,
      'SELECT atualizado_em AS valor FROM pizza_categoria WHERE id = ?',
      [id],
    )
    if (!nuvemMaisNova(local, atualizadoEm)) {
      return 'ignorado'
    }
    conexao.instancia.run(
      `INSERT INTO pizza_categoria (
         id, nome, descricao, regra_precificacao, ativa, ordem, criado_em, atualizado_em
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         nome = excluded.nome,
         descricao = excluded.descricao,
         regra_precificacao = excluded.regra_precificacao,
         ativa = excluded.ativa,
         ordem = excluded.ordem,
         atualizado_em = excluded.atualizado_em`,
      [
        id,
        texto(payload.nome),
        payload.descricao ? texto(payload.descricao) : null,
        texto(payload.regraPrecificacao, 'MAIOR_SABOR'),
        flag(payload.ativa),
        inteiro(payload.ordem),
        criadoEm,
        atualizadoEm,
      ],
    )
    return 'aplicado'
  }

  if (mudanca.entidade === ENTIDADE_SYNC.PIZZA_TAMANHO) {
    const id = texto(payload.id ?? mudanca.entidadeId)
    const local = consultarTexto(
      conexao,
      'SELECT atualizado_em AS valor FROM pizza_tamanho WHERE id = ?',
      [id],
    )
    if (!nuvemMaisNova(local, atualizadoEm)) {
      return 'ignorado'
    }
    conexao.instancia.run(
      `INSERT INTO pizza_tamanho (
         id, nome, sigla, maximo_sabores, ativa, ordem, criado_em, atualizado_em
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         nome = excluded.nome,
         sigla = excluded.sigla,
         maximo_sabores = excluded.maximo_sabores,
         ativa = excluded.ativa,
         ordem = excluded.ordem,
         atualizado_em = excluded.atualizado_em`,
      [
        id,
        texto(payload.nome),
        texto(payload.sigla),
        inteiro(payload.maximoSabores, 1),
        flag(payload.ativa),
        inteiro(payload.ordem),
        criadoEm,
        atualizadoEm,
      ],
    )
    return 'aplicado'
  }

  if (mudanca.entidade === ENTIDADE_SYNC.PIZZA_SABOR) {
    const id = texto(payload.id ?? mudanca.entidadeId)
    const local = consultarTexto(
      conexao,
      'SELECT atualizado_em AS valor FROM pizza_sabor WHERE id = ?',
      [id],
    )
    if (!nuvemMaisNova(local, atualizadoEm)) {
      return 'ignorado'
    }
    conexao.instancia.run(
      `INSERT INTO pizza_sabor (id, nome, descricao, ativa, ordem, criado_em, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         nome = excluded.nome,
         descricao = excluded.descricao,
         ativa = excluded.ativa,
         ordem = excluded.ordem,
         atualizado_em = excluded.atualizado_em`,
      [
        id,
        texto(payload.nome),
        payload.descricao ? texto(payload.descricao) : null,
        flag(payload.ativa),
        inteiro(payload.ordem),
        criadoEm,
        atualizadoEm,
      ],
    )
    return 'aplicado'
  }

  if (mudanca.entidade === ENTIDADE_SYNC.PIZZA_CATEGORIA_SABOR) {
    const pizzaCategoriaId = texto(payload.pizzaCategoriaId)
    const pizzaSaborId = texto(payload.pizzaSaborId)
    if (
      !existe(conexao, 'SELECT 1 FROM pizza_categoria WHERE id = ? LIMIT 1', [pizzaCategoriaId]) ||
      !existe(conexao, 'SELECT 1 FROM pizza_sabor WHERE id = ? LIMIT 1', [pizzaSaborId])
    ) {
      return 'ignorado'
    }
    conexao.instancia.run(
      `INSERT INTO pizza_categoria_sabor (pizza_categoria_id, pizza_sabor_id, ativo, criado_em)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(pizza_categoria_id, pizza_sabor_id) DO UPDATE SET
         ativo = excluded.ativo`,
      [pizzaCategoriaId, pizzaSaborId, flag(payload.ativo), criadoEm],
    )
    return 'aplicado'
  }

  if (mudanca.entidade === ENTIDADE_SYNC.PIZZA_SABOR_PRECO) {
    const id = texto(payload.id ?? mudanca.entidadeId)
    const local = consultarTexto(
      conexao,
      'SELECT atualizado_em AS valor FROM pizza_sabor_preco WHERE id = ?',
      [id],
    )
    if (!nuvemMaisNova(local, atualizadoEm)) {
      return 'ignorado'
    }
    const pizzaSaborId = texto(payload.pizzaSaborId)
    const pizzaTamanhoId = texto(payload.pizzaTamanhoId)
    if (
      !existe(conexao, 'SELECT 1 FROM pizza_sabor WHERE id = ? LIMIT 1', [pizzaSaborId]) ||
      !existe(conexao, 'SELECT 1 FROM pizza_tamanho WHERE id = ? LIMIT 1', [pizzaTamanhoId])
    ) {
      return 'ignorado'
    }
    conexao.instancia.run(
      `INSERT INTO pizza_sabor_preco (
         id, pizza_sabor_id, pizza_tamanho_id, valor_centavos, ativo, criado_em, atualizado_em
       ) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         pizza_sabor_id = excluded.pizza_sabor_id,
         pizza_tamanho_id = excluded.pizza_tamanho_id,
         valor_centavos = excluded.valor_centavos,
         ativo = excluded.ativo,
         atualizado_em = excluded.atualizado_em`,
      [
        id,
        pizzaSaborId,
        pizzaTamanhoId,
        inteiro(payload.valorCentavos),
        flag(payload.ativo),
        criadoEm,
        atualizadoEm,
      ],
    )
    return 'aplicado'
  }

  return 'noop'
}
