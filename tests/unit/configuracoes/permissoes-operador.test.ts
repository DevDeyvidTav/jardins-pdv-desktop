import { describe, expect, it } from 'vitest'
import { PERFIL_OPERADOR, PERMISSAO_PDV } from '../../../src/shared/types/operador'
import { operadorEhAdmin, operadorTemPermissao } from '../../../src/shared/utils/permissoes-operador'

describe('permissoes-operador', () => {
  it('admin tem todas as permissoes', () => {
    expect(operadorEhAdmin(PERFIL_OPERADOR.ADMIN)).toBe(true)
    expect(operadorTemPermissao(PERFIL_OPERADOR.ADMIN, PERMISSAO_PDV.CONFIGURACOES)).toBe(true)
    expect(operadorTemPermissao(PERFIL_OPERADOR.ADMIN, PERMISSAO_PDV.FISCAL_PRODUTO)).toBe(true)
    expect(operadorTemPermissao(PERFIL_OPERADOR.ADMIN, PERMISSAO_PDV.CATALOGO_PIZZA)).toBe(true)
  })

  it('operadora edita pizzas e nao acessa areas administrativas', () => {
    expect(operadorTemPermissao(PERFIL_OPERADOR.OPERADOR, PERMISSAO_PDV.CATALOGO_PIZZA)).toBe(true)
    expect(operadorTemPermissao(PERFIL_OPERADOR.OPERADOR, PERMISSAO_PDV.CONFIGURACOES)).toBe(false)
    expect(operadorTemPermissao(PERFIL_OPERADOR.OPERADOR, PERMISSAO_PDV.TAXA_ENTREGA_PADRAO)).toBe(
      false,
    )
    expect(operadorTemPermissao(PERFIL_OPERADOR.OPERADOR, PERMISSAO_PDV.FISCAL_PRODUTO)).toBe(false)
  })
})
