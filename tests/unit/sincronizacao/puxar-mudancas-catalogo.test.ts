import { afterEach, describe, expect, it, vi } from 'vitest'
import { ENTIDADE_SYNC, OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { consultarValorMetadata } from '../../../src/main/database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../src/main/database/inicializar-banco'
import { criarCategoriaProdutoRepository } from '../../../src/main/modules/produtos/repositories/categoria-produto.repository'
import { criarSyncOutboxRepository } from '../../../src/main/modules/sincronizacao/repositories/sync-outbox.repository'
import {
  CHAVE_SYNC_CATALOGO_CURSOR,
  puxarMudancasCatalogo,
} from '../../../src/main/modules/sincronizacao/services/puxar-mudancas-catalogo'
import { prepararBancoTeste } from '../../helpers/banco-teste'

vi.mock('../../../src/main/modules/sincronizacao/services/cliente-sync-api', () => ({
  buscarMudancasCatalogoApi: vi.fn(),
}))

import { buscarMudancasCatalogoApi } from '../../../src/main/modules/sincronizacao/services/cliente-sync-api'

describe('puxar mudancas de catalogo', () => {
  let encerrarBanco: (() => void) | undefined

  afterEach(() => {
    encerrarBanco?.()
    encerrarBanco = undefined
    vi.mocked(buscarMudancasCatalogoApi).mockReset()
  })

  it('aplica lote da nuvem, grava cursor e nao enfileira outbox', async () => {
    const banco = await prepararBancoTeste()
    encerrarBanco = banco.encerrar
    const outboxAntes = criarSyncOutboxRepository().listarPendentes(50).length
    const categoriaId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

    vi.mocked(buscarMudancasCatalogoApi).mockResolvedValue({
      cursor: 42,
      mudancas: [
        {
          id: 42,
          entidade: ENTIDADE_SYNC.CATEGORIA_PRODUTO,
          entidadeId: categoriaId,
          operacao: OPERACAO_SYNC.CREATE,
          atualizadoEm: '2026-09-21T23:00:00.000Z',
          origem: 'DASHBOARD',
          payload: {
            id: categoriaId,
            nome: 'Porcoes',
            descricao: null,
            ativo: true,
            criadoEm: '2026-09-21T23:00:00.000Z',
            atualizadoEm: '2026-09-21T23:00:00.000Z',
          },
        },
      ],
    })

    const resultado = await puxarMudancasCatalogo({
      apiUrl: 'http://localhost:3000',
      dispositivoId: '11111111-1111-4111-8111-111111111111',
      dispositivoSegredo: 'segredo',
      intervaloMs: 10_000,
      loteMaximo: 20,
    })

    expect(resultado.aplicados).toBe(1)
    expect(resultado.cursor).toBe(42)
    expect(criarCategoriaProdutoRepository().buscarPorId(categoriaId)?.nome).toBe('Porcoes')
    expect(consultarValorMetadata(obterConexaoBancoLocal(), CHAVE_SYNC_CATALOGO_CURSOR)).toBe('42')
    expect(criarSyncOutboxRepository().listarPendentes(50)).toHaveLength(outboxAntes)
  })
})
