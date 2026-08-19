import { describe, expect, it } from 'vitest'
import { MOTIVO_ENCERRAMENTO_AGRUPAMENTO } from '@shared/types/mesa'
import {
  agruparMesasPedidoSchema,
  encerrarAgrupamentoMesaSchema,
  listarHistoricoMesaSchema,
  listarHistoricoPedidoMesaSchema,
  obterAgrupamentoPedidoSchema,
  transferirPedidoMesaSchema,
} from '../../../src/main/modules/mesas/schemas/mesa-agrupamento.schema'

const PEDIDO_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const MESA_1 = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'
const MESA_2 = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'

describe('mesa-agrupamento.schema', () => {
  describe('transferirPedidoMesaSchema', () => {
    it('aceita transferencia valida', () => {
      expect(
        transferirPedidoMesaSchema.parse({
          pedidoId: PEDIDO_ID,
          mesaDestinoId: MESA_1,
          motivo: 'Troca de sala',
        }),
      ).toEqual({
        pedidoId: PEDIDO_ID,
        mesaDestinoId: MESA_1,
        motivo: 'Troca de sala',
      })
    })

    it('rejeita transferencia sem motivo', () => {
      expect(() =>
        transferirPedidoMesaSchema.parse({
          pedidoId: PEDIDO_ID,
          mesaDestinoId: MESA_1,
        }),
      ).toThrow(/motivo/i)
    })

    it('rejeita pedidoId invalido', () => {
      expect(() =>
        transferirPedidoMesaSchema.parse({
          pedidoId: 'nao-uuid',
          mesaDestinoId: MESA_1,
        }),
      ).toThrow()
    })

    it('rejeita mesaDestinoId invalido', () => {
      expect(() =>
        transferirPedidoMesaSchema.parse({
          pedidoId: PEDIDO_ID,
          mesaDestinoId: 'mesa-1',
        }),
      ).toThrow()
    })
  })

  describe('agruparMesasPedidoSchema', () => {
    it('aceita agrupamento com ao menos duas mesas', () => {
      expect(
        agruparMesasPedidoSchema.parse({
          pedidoId: PEDIDO_ID,
          mesaIds: [MESA_1, MESA_2],
        }),
      ).toEqual({
        pedidoId: PEDIDO_ID,
        mesaIds: [MESA_1, MESA_2],
      })
    })

    it('rejeita menos de duas mesas', () => {
      expect(() =>
        agruparMesasPedidoSchema.parse({
          pedidoId: PEDIDO_ID,
          mesaIds: [MESA_1],
        }),
      ).toThrow(/ao menos duas mesas/)
    })

    it('rejeita mesaId invalido na lista', () => {
      expect(() =>
        agruparMesasPedidoSchema.parse({
          pedidoId: PEDIDO_ID,
          mesaIds: [MESA_1, 'invalido'],
        }),
      ).toThrow()
    })
  })

  describe('encerrarAgrupamentoMesaSchema', () => {
    it('aceita motivos validos', () => {
      for (const motivo of Object.values(MOTIVO_ENCERRAMENTO_AGRUPAMENTO)) {
        expect(
          encerrarAgrupamentoMesaSchema.parse({
            pedidoId: PEDIDO_ID,
            motivo,
          }),
        ).toMatchObject({ pedidoId: PEDIDO_ID, motivo })
      }
    })

    it('aceita observacao opcional', () => {
      expect(
        encerrarAgrupamentoMesaSchema.parse({
          pedidoId: PEDIDO_ID,
          motivo: MOTIVO_ENCERRAMENTO_AGRUPAMENTO.ENCERRAMENTO_MANUAL,
          observacao: 'Cliente pediu separacao',
        }).observacao,
      ).toBe('Cliente pediu separacao')
    })

    it('rejeita motivo invalido', () => {
      expect(() =>
        encerrarAgrupamentoMesaSchema.parse({
          pedidoId: PEDIDO_ID,
          motivo: 'OUTRO',
        }),
      ).toThrow()
    })
  })

  describe('consultas de historico e agrupamento', () => {
    it('valida obterAgrupamentoPedidoSchema', () => {
      expect(obterAgrupamentoPedidoSchema.parse({ pedidoId: PEDIDO_ID })).toEqual({
        pedidoId: PEDIDO_ID,
      })
    })

    it('valida listarHistoricoMesaSchema', () => {
      expect(listarHistoricoMesaSchema.parse({ mesaId: MESA_1 })).toEqual({
        mesaId: MESA_1,
      })
    })

    it('valida listarHistoricoPedidoMesaSchema', () => {
      expect(listarHistoricoPedidoMesaSchema.parse({ pedidoId: PEDIDO_ID })).toEqual({
        pedidoId: PEDIDO_ID,
      })
    })
  })
})
