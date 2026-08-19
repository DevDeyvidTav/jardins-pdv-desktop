import { afterEach, describe, expect, it } from 'vitest'
import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { prepararBancoTeste } from '../helpers/banco-teste'
import { prepararAmbientePedidos } from '../helpers/pedido-teste'
import {
  abrirConexaoSqlite,
  consultarValorMetadata,
  executarMigracoes,
  fecharConexaoSqlite,
  obterVersaoSchema,
} from '../../src/main/database/conexao-sqlite'
import {
  encerrarBancoLocal,
  obterConexaoBancoLocal,
} from '../../src/main/database/inicializar-banco'
import { REGISTRO_MIGRACOES } from '../../src/main/database/migracoes/registro-migracoes'
import { FORMA_PAGAMENTO } from '../../src/shared/types/pagamento-pedido'
import { criarRegistrarPagamentoPedido } from '../../src/main/modules/pagamentos/use-cases/registrar-pagamento-pedido'
import { criarPagamentoPedidoRepository } from '../../src/main/modules/pagamentos/repositories/pagamento-pedido.repository'
import { ErroPedidos } from '../../src/main/modules/pedidos/errors/erros-pedidos'
import {
  criarBackupBanco,
  listarBackups,
  restaurarBackup,
  definirDiretorioBackupParaTestes,
} from '../../src/main/database/backup-banco'
import { definirDiretorioLogsParaTestes } from '../../src/main/logging/logger'

/**
 * E2E mínimo via processo main (arquivo SQLite real), sem janela Electron.
 * Playwright `hardening-persistencia.spec.ts` cobre a UI quando
 * better-sqlite3 estiver rebuildado para o ABI do Electron (`npm run rebuild:native`).
 */
describe('hardening persistencia (integracao)', () => {
  let limpar: (() => void) | undefined

  afterEach(() => {
    limpar?.()
    limpar = undefined
  })

  it('cria pedido com pagamento e confirma persistencia no sqlite', async () => {
    const ambiente = await prepararAmbientePedidos()
    limpar = ambiente.encerrar

    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 1,
    })
    const resumo = ambiente.registrarPagamentoPedido({
      pedidoId: pedido.id,
      formaPagamento: FORMA_PAGAMENTO.DINHEIRO,
      valorCentavos: 600,
    })

    expect(resumo.pagamentos).toHaveLength(1)
    expect(ambiente.repositorioPedido.buscarPorId(pedido.id)!.status).toBe('FINALIZADO')

    const conexao = obterConexaoBancoLocal()
    expect(obterVersaoSchema(conexao)).toBe(REGISTRO_MIGRACOES.at(-1)!.versao)

    const pedidos = conexao.instancia.exec(
      `SELECT status, valor_pago_centavos FROM pedido WHERE id = '${pedido.id}'`,
    )
    expect(pedidos[0]?.values[0]?.[0]).toBe('FINALIZADO')
    expect(Number(pedidos[0]?.values[0]?.[1])).toBe(600)

    const pagamentos = conexao.instancia.exec(
      `SELECT COUNT(*) FROM pagamento_pedido WHERE pedido_id = '${pedido.id}'`,
    )
    expect(Number(pagamentos[0]?.values[0]?.[0])).toBe(1)
  })

  it('fecha e reabre o arquivo, migrations idempotentes, backup e restore', async () => {
    const banco = await prepararBancoTeste()
    const { caminhoBanco, diretorio } = banco

    limpar = () => {
      try {
        encerrarBancoLocal()
      } catch {
        /* ja fechado */
      }
      definirDiretorioBackupParaTestes(null)
      definirDiretorioLogsParaTestes(null)
      rmSync(diretorio, { recursive: true, force: true })
    }

    const conexao = obterConexaoBancoLocal()
    conexao.instancia.run(
      `INSERT INTO app_metadata (chave, valor, criado_em, atualizado_em)
       VALUES ('e2e_persistencia', 'ok', datetime('now'), datetime('now'))`,
    )
    const versao = obterVersaoSchema(conexao)
    const backupDir = join(diretorio, 'backups')
    criarBackupBanco(caminhoBanco, versao, 'integracao', {
      diretorioOverride: backupDir,
      nativo: conexao.nativo,
    })

    encerrarBancoLocal()

    expect(existsSync(caminhoBanco)).toBe(true)

    const reaberta = await abrirConexaoSqlite(caminhoBanco)
    executarMigracoes(reaberta)

    expect(consultarValorMetadata(reaberta, 'schema_version')).toBe(
      String(REGISTRO_MIGRACOES.at(-1)!.versao),
    )
    expect(consultarValorMetadata(reaberta, 'e2e_persistencia')).toBe('ok')
    expect(reaberta.nativo.pragma('foreign_keys', { simple: true })).toBe(1)

    const check = reaberta.nativo.pragma('integrity_check') as Array<{
      integrity_check: string
    }>
    expect(check[0]?.integrity_check).toBe('ok')

    const destino = join(diretorio, 'restaurado.sqlite')
    const backups = listarBackups(backupDir)
    expect(backups.length).toBeGreaterThan(0)
    restaurarBackup(backups[0]!, destino)
    expect(existsSync(destino)).toBe(true)
    expect(existsSync(caminhoBanco)).toBe(true)

    fecharConexaoSqlite(reaberta)
  })

  it('falha financeira simulada nao deixa pagamento parcial', async () => {
    const ambiente = await prepararAmbientePedidos()
    limpar = ambiente.encerrar

    const pedido = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    ambiente.adicionarItemPedido({
      pedidoId: pedido.id,
      produtoId: ambiente.produto.id,
      quantidade: 1,
    })

    const repositorioPagamento = criarPagamentoPedidoRepository()
    const registrar = criarRegistrarPagamentoPedido(
      ambiente.repositorioPedido,
      ambiente.repositorioItem,
      ambiente.repositorioSessao,
      ambiente.repositorioMesa,
      repositorioPagamento,
    )

    expect(() =>
      registrar({
        pedidoId: pedido.id,
        formaPagamento: FORMA_PAGAMENTO.DINHEIRO,
        valorCentavos: 999_999,
      }),
    ).toThrow(ErroPedidos)

    expect(repositorioPagamento.listarPorPedido(pedido.id)).toHaveLength(0)
    expect(ambiente.repositorioPedido.buscarPorId(pedido.id)!.valorPagoCentavos).toBe(0)
  })
})
