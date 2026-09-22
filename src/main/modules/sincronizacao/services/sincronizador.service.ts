import { agoraEmIsoUtc } from '@shared/utils/data-hora'
import {
  STATUS_SYNC_OUTBOX,
  type EstadoSincronizacao,
} from '@shared/types/sincronizacao'
import {
  obterConfiguracaoSincronizacao,
  sincronizacaoEstaConfigurada,
} from '../../../config/sincronizacao'
import { persistirConexaoBanco } from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { registrarErro, registrarInfo } from '../../../logging/logger'
import { criarSyncOutboxRepository } from '../repositories/sync-outbox.repository'
import { enviarEventosSyncApi } from './cliente-sync-api'
import {
  destinoApiMudou,
  enfileirarCadastrosIniciais,
  marcarDestinoApi,
} from './enfileirar-cadastros-sync'
import { enfileirarHistoricoInicial } from './enfileirar-historico-sync'
import { notificarCatalogoAtualizado } from './notificar-catalogo-atualizado'
import { puxarMudancasCatalogo } from './puxar-mudancas-catalogo'
import { sincronizarInboxFiscal } from '../../fiscal/services/sincronizar-inbox-fiscal'

const BACKOFF_BASE_MS = 5_000
const BACKOFF_MAX_MS = 5 * 60_000

interface EstadoInternoSincronizador {
  ultimaTentativaEm: string | null
  ultimoSucessoEm: string | null
  ultimoErro: string | null
  emExecucao: boolean
}

const estadoInterno: EstadoInternoSincronizador = {
  ultimaTentativaEm: null,
  ultimoSucessoEm: null,
  ultimoErro: null,
  emExecucao: false,
}

let intervaloId: ReturnType<typeof setInterval> | null = null

function calcularProximaTentativa(tentativas: number): string {
  const atraso = Math.min(BACKOFF_BASE_MS * 2 ** tentativas, BACKOFF_MAX_MS)
  return new Date(Date.now() + atraso).toISOString()
}

export function obterEstadoSincronizacao(): EstadoSincronizacao {
  const repositorio = criarSyncOutboxRepository()
  const config = obterConfiguracaoSincronizacao()

  return {
    pendente: repositorio.contarPorStatus(STATUS_SYNC_OUTBOX.PENDENTE),
    sincronizado: repositorio.contarPorStatus(STATUS_SYNC_OUTBOX.SINCRONIZADO),
    apiConfigurada: sincronizacaoEstaConfigurada(config),
    ultimaTentativaEm: estadoInterno.ultimaTentativaEm,
    ultimoSucessoEm: estadoInterno.ultimoSucessoEm,
    ultimoErro: estadoInterno.ultimoErro,
  }
}

export async function executarCicloSincronizacao(): Promise<void> {
  if (estadoInterno.emExecucao) {
    return
  }

  const config = obterConfiguracaoSincronizacao()
  if (!sincronizacaoEstaConfigurada(config)) {
    return
  }

  const repositorio = criarSyncOutboxRepository()
  const pendentes = repositorio.listarPendentes(config.loteMaximo)

  estadoInterno.emExecucao = true
  estadoInterno.ultimaTentativaEm = agoraEmIsoUtc()

  try {
    if (pendentes.length > 0) {
      try {
        const resposta = await enviarEventosSyncApi(config, pendentes)

        if (resposta.confirmados.length > 0) {
          repositorio.marcarSincronizados(resposta.confirmados)
          estadoInterno.ultimoErro = null
          registrarInfo('Eventos sincronizados', {
            operacao: 'sync.enviar',
            quantidade: resposta.confirmados.length,
          })
        }

        for (const falha of resposta.comErro) {
          const evento = pendentes.find((item) => item.id === falha.eventoId)
          const tentativas = evento?.tentativas ?? 0
          repositorio.registrarFalha(
            falha.eventoId,
            falha.motivo,
            calcularProximaTentativa(tentativas),
          )
          registrarErro('Evento sync rejeitado pela API', {
            operacao: 'sync.evento',
            eventoId: falha.eventoId,
            motivo: falha.motivo,
          })
        }

        persistirConexaoBanco(obterConexaoBancoLocal())
      } catch (erro) {
        const mensagem = erro instanceof Error ? erro.message : String(erro)
        estadoInterno.ultimoErro = mensagem
        for (const evento of pendentes) {
          repositorio.registrarFalha(
            evento.id,
            mensagem,
            calcularProximaTentativa(evento.tentativas),
          )
        }
        persistirConexaoBanco(obterConexaoBancoLocal())
        registrarErro('Falha ao sincronizar eventos', { operacao: 'sync.enviar' }, erro)
      }
    }

    const catalogo = await puxarMudancasCatalogo(config)
    if (catalogo.aplicados > 0) {
      notificarCatalogoAtualizado()
    }
    await sincronizarInboxFiscal()
    estadoInterno.ultimoSucessoEm = agoraEmIsoUtc()
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro)
    estadoInterno.ultimoErro = mensagem
    registrarErro('Falha ao puxar sync da nuvem', { operacao: 'sync.puxar' }, erro)
  } finally {
    estadoInterno.emExecucao = false
  }
}

export function iniciarSincronizador(): void {
  if (intervaloId) {
    return
  }

  const config = obterConfiguracaoSincronizacao()
  if (!sincronizacaoEstaConfigurada(config)) {
    registrarInfo('Sincronizador inativo — configure PDV_SYNC_API_URL e credenciais', {
      operacao: 'sync.iniciar',
    })
    return
  }

  registrarInfo('Sincronizador iniciado', {
    operacao: 'sync.iniciar',
    intervaloMs: config.intervaloMs,
    apiUrl: config.apiUrl,
  })

  const conexao = obterConexaoBancoLocal()
  const reenviarParaNovoDestino = destinoApiMudou(conexao, config.apiUrl)
  enfileirarCadastrosIniciais(conexao, {
    forcar: reenviarParaNovoDestino,
    atualizarTimestamps: reenviarParaNovoDestino,
  })
  enfileirarHistoricoInicial(conexao, { forcar: reenviarParaNovoDestino })
  if (config.apiUrl) {
    marcarDestinoApi(conexao, config.apiUrl)
  }
  persistirConexaoBanco(conexao)

  void executarCicloSincronizacao()
  intervaloId = setInterval(() => {
    void executarCicloSincronizacao()
  }, config.intervaloMs)
}

export function reenviarCadastrosParaNuvem(): EstadoSincronizacao {
  const conexao = obterConexaoBancoLocal()
  enfileirarCadastrosIniciais(conexao, { forcar: true, atualizarTimestamps: true })
  persistirConexaoBanco(conexao)
  void executarCicloSincronizacao()
  return obterEstadoSincronizacao()
}

export function pararSincronizador(): void {
  if (intervaloId) {
    clearInterval(intervaloId)
    intervaloId = null
  }
}
