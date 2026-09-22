import { app } from 'electron'
import {
  NOME_APLICACAO,
  VERSAO_APLICACAO,
  type InformacoesSistema,
} from '@shared/types/informacoes-sistema'
import { bancoLocalEstaPronto } from '../database/inicializar-banco'

export function obterInformacoesSistema(): InformacoesSistema {
  return {
    nomeAplicacao: NOME_APLICACAO,
    versao: typeof app?.getVersion === 'function' ? app.getVersion() : VERSAO_APLICACAO,
    bancoLocalInicializado: bancoLocalEstaPronto(),
    electronAtivo: true,
  }
}
