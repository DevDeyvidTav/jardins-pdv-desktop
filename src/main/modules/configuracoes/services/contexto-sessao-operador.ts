import type { OperadorConfig, PermissaoPdv } from '@shared/types/operador'
import { operadorTemPermissao } from '@shared/utils/permissoes-operador'
import {
  CODIGOS_ERRO_CONFIGURACOES,
  ErroConfiguracoes,
} from '../errors/erros-configuracoes'

let sessaoAtual: OperadorConfig | null = null

export function definirSessaoOperador(operador: OperadorConfig): void {
  sessaoAtual = operador
}

export function obterSessaoOperador(): OperadorConfig | null {
  return sessaoAtual
}

export function limparSessaoOperador(): void {
  sessaoAtual = null
}

export function assertPermissaoOperador(permissao: PermissaoPdv): OperadorConfig {
  const operador = obterSessaoOperador()

  if (!operador) {
    throw new ErroConfiguracoes(
      CODIGOS_ERRO_CONFIGURACOES.SESSAO_NAO_AUTENTICADA,
      'Operador nao autenticado.',
    )
  }

  if (!operadorTemPermissao(operador.perfil, permissao)) {
    throw new ErroConfiguracoes(
      CODIGOS_ERRO_CONFIGURACOES.SEM_PERMISSAO,
      'Voce nao tem permissao para esta acao.',
    )
  }

  return operador
}
