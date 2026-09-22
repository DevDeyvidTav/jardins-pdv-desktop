import { useCallback, useEffect, useState } from 'react'
import type { EstadoSincronizacao } from '@shared/types/sincronizacao'
import { extrairMensagemErroIpc } from '@shared/utils/erro-ipc'

const INTERVALO_POLL_MS = 10_000

export interface UseSyncEstadoResultado {
  estado: EstadoSincronizacao | null
  carregando: boolean
  erro: string | null
  recarregar: () => Promise<void>
  reenviarCadastros: () => Promise<void>
}

export function useSyncEstado(ativo = true): UseSyncEstadoResultado {
  const [estado, setEstado] = useState<EstadoSincronizacao | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    if (!ativo) {
      return
    }

    try {
      const resultado = await window.pdv.sync.obterEstado()
      setEstado(resultado)
      setErro(null)
    } catch (causa) {
      setErro(extrairMensagemErroIpc(causa))
    } finally {
      setCarregando(false)
    }
  }, [ativo])

  useEffect(() => {
    void recarregar()
    if (!ativo) {
      return undefined
    }

    const intervalo = window.setInterval(() => {
      void recarregar()
    }, INTERVALO_POLL_MS)

    return () => window.clearInterval(intervalo)
  }, [ativo, recarregar])

  const reenviarCadastros = useCallback(async () => {
    if (!ativo) {
      return
    }

    setCarregando(true)
    try {
      const resultado = await window.pdv.sync.reenviarCadastros()
      setEstado(resultado)
      setErro(null)
    } catch (causa) {
      setErro(extrairMensagemErroIpc(causa))
    } finally {
      setCarregando(false)
    }
  }, [ativo])

  return { estado, carregando, erro, recarregar, reenviarCadastros }
}
