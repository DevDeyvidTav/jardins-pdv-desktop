import { useCallback, useEffect, useState } from 'react'
import type { EstadoAtualizacao } from '@shared/types/atualizacao'
import { extrairMensagemErroIpc } from '@shared/utils/erro-ipc'

export function useAtualizacao() {
  const [estado, setEstado] = useState<EstadoAtualizacao | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)

  const recarregar = useCallback(async () => {
    setErro(null)
    try {
      const dados = await window.pdv.sistema.obterEstadoAtualizacao()
      setEstado(dados)
    } catch (causa) {
      setErro(extrairMensagemErroIpc(causa))
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void recarregar()
    return window.pdv.sistema.onAtualizacaoEvento((dados) => {
      setEstado(dados)
      setCarregando(false)
    })
  }, [recarregar])

  async function verificar() {
    setCarregando(true)
    setErro(null)
    try {
      const dados = await window.pdv.sistema.verificarAtualizacao()
      setEstado(dados)
    } catch (causa) {
      setErro(extrairMensagemErroIpc(causa))
    } finally {
      setCarregando(false)
    }
  }

  async function instalar() {
    setErro(null)
    try {
      await window.pdv.sistema.instalarAtualizacao()
    } catch (causa) {
      setErro(extrairMensagemErroIpc(causa))
    }
  }

  return {
    estado,
    erro,
    carregando,
    verificar,
    instalar,
    recarregar,
  }
}
