import { afterEach, describe, expect, it } from 'vitest'
import { prepararAmbientePedidos } from '../../helpers/pedido-teste'
import { obterConexaoBancoLocal } from '../../../src/main/database/inicializar-banco'
import { STATUS_PEDIDO, TIPO_PEDIDO } from '../../../src/shared/types/pedido'

describe('pedido.referencia', () => {
  let encerrarBanco: (() => void) | undefined

  afterEach(() => {
    encerrarBanco?.()
    encerrarBanco = undefined
  })

  it('atribui referencias sequenciais aos novos pedidos', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const [mesa2] = ambiente.criarMesasPorIntervalo({
      numeroInicial: 2,
      numeroFinal: 2,
    })

    const pedido1 = ambiente.criarPedidoMesa({ mesaId: ambiente.mesa.id })
    const pedido2 = ambiente.criarPedidoBalcao()
    const pedido3 = ambiente.criarPedidoMesa({ mesaId: mesa2!.id })

    expect(pedido1.referencia).toBe(1)
    expect(pedido2.referencia).toBe(2)
    expect(pedido3.referencia).toBe(3)
  })

  it('preenche referencias existentes ordenadas por criado_em na migracao', async () => {
    const ambiente = await prepararAmbientePedidos()
    encerrarBanco = ambiente.encerrar

    const conexao = obterConexaoBancoLocal()
    const sessaoId = ambiente.sessao.id

    // Simula pedidos legados (sem referencia) com datas conhecidas
    conexao.instancia.run(
      `INSERT INTO pedido (
         id, sessao_caixa_id, mesa_id, tipo, status,
         subtotal_centavos, desconto_centavos, total_centavos,
         desconto_itens_centavos, desconto_pedido_centavos,
         valor_pago_centavos, valor_cortesia_centavos, valor_restante_centavos,
         criado_em, atualizado_em, finalizado_em, cancelado_em, referencia
       ) VALUES
         ('ped-antigo-b', ?, NULL, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0, '2024-01-02T10:00:00.000Z', '2024-01-02T10:00:00.000Z', NULL, NULL, NULL),
         ('ped-antigo-a', ?, NULL, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0, '2024-01-01T10:00:00.000Z', '2024-01-01T10:00:00.000Z', NULL, NULL, NULL)`,
      [
        sessaoId,
        TIPO_PEDIDO.BALCAO,
        STATUS_PEDIDO.FINALIZADO,
        sessaoId,
        TIPO_PEDIDO.BALCAO,
        STATUS_PEDIDO.FINALIZADO,
      ],
    )

    // Trigger da migracao 16 atribui ao inserir com NULL; zera para testar o backfill
    conexao.instancia.run(
      `UPDATE pedido SET referencia = NULL WHERE id IN ('ped-antigo-a', 'ped-antigo-b')`,
    )

    conexao.instancia.run(`
      UPDATE pedido
      SET referencia = (
        SELECT COUNT(*)
        FROM pedido AS anterior
        WHERE anterior.criado_em < pedido.criado_em
           OR (anterior.criado_em = pedido.criado_em AND anterior.id <= pedido.id)
      )
      WHERE id IN ('ped-antigo-a', 'ped-antigo-b')
    `)

    const a = ambiente.repositorioPedido.buscarPorId('ped-antigo-a')!
    const b = ambiente.repositorioPedido.buscarPorId('ped-antigo-b')!

    expect(a.referencia).toBe(1)
    expect(b.referencia).toBe(2)
  })
})
