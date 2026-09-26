import {
  PERFIL_OPERADOR,
  PERMISSAO_PDV,
  type PerfilOperador,
  type PermissaoPdv,
} from '../types/operador'

const PERMISSOES_POR_PERFIL: Record<PerfilOperador, readonly PermissaoPdv[]> = {
  [PERFIL_OPERADOR.ADMIN]: Object.values(PERMISSAO_PDV),
  [PERFIL_OPERADOR.OPERADOR]: [PERMISSAO_PDV.CATALOGO_PIZZA],
}

export function operadorTemPermissao(
  perfil: PerfilOperador,
  permissao: PermissaoPdv,
): boolean {
  return PERMISSOES_POR_PERFIL[perfil].includes(permissao)
}

export function operadorEhAdmin(perfil: PerfilOperador): boolean {
  return perfil === PERFIL_OPERADOR.ADMIN
}
