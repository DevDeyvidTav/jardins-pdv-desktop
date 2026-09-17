import { app } from 'electron'
import {
  NOME_APLICACAO,
  type InformacoesSistema,
} from '@shared/types/informacoes-sistema'
import { bancoLocalEstaPronto } from '../database/inicializar-banco'

export function obterInformacoesSistema(): InformacoesSistema {
  return {
    nomeAplicacao: NOME_APLICACAO,
    versao: app.getVersion(),
    bancoLocalInicializado: bancoLocalEstaPronto(),
    electronAtivo: true,
  }
}
