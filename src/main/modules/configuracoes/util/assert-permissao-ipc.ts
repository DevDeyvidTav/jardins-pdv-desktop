import type { PermissaoPdv } from '@shared/types/operador'
import { assertPermissaoOperador } from '../services/contexto-sessao-operador'

export function executarComPermissao<T>(permissao: PermissaoPdv, acao: () => T): T {
  assertPermissaoOperador(permissao)
  return acao()
}
