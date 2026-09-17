import { useCallback, useEffect, useState } from 'react'

import type {
  OperadorConfig,
  OperadorEntradaResumo,
  PermissaoPdv,
} from '@shared/types/operador'

import { operadorTemPermissao } from '@shared/utils/permissoes-operador'

import { extrairMensagemErroIpc } from '@shared/utils/erro-ipc'

export interface UseOperadorResultado {
  operador: OperadorConfig | null
  operadores: OperadorEntradaResumo[]
  autenticado: boolean
  carregando: boolean
  erro: string | null
  autenticar: (operadorId: string, pin: string) => Promise<boolean>
  salvarPin: (operadorId: string, pin: string) => Promise<boolean>
  temPermissao: (permissao: PermissaoPdv) => boolean
  recarregar: () => Promise<void>
  limparErro: () => void
}

export function useOperador(): UseOperadorResultado {
  const [operador, setOperador] = useState<OperadorConfig | null>(null)
  const [operadores, setOperadores] = useState<OperadorEntradaResumo[]>([])
  const [autenticado, setAutenticado] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    setCarregando(true)
    try {
      setErro(null)
      const lista = await window.pdv.config.listarOperadoresEntrada()
      setOperadores(lista)
    } catch (causa) {
      setErro(extrairMensagemErroIpc(causa))
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void recarregar()
  }, [recarregar])

  const autenticar = useCallback(async (operadorId: string, pin: string): Promise<boolean> => {
    setErro(null)
    try {
      const resultado = await window.pdv.config.autenticarOperador({ operadorId, pin })
      setOperador(resultado)
      setAutenticado(true)
      return true
    } catch (causa) {
      setErro(extrairMensagemErroIpc(causa))
      return false
    }
  }, [])

  const salvarPin = useCallback(async (operadorId: string, pin: string): Promise<boolean> => {
    setErro(null)
    try {
      const resultado = await window.pdv.config.salvarOperador({ operadorId, pin })
      setOperador(resultado)
      setAutenticado(true)
      return true
    } catch (causa) {
      setErro(extrairMensagemErroIpc(causa))
      return false
    }
  }, [])

  const temPermissao = useCallback(
    (permissao: PermissaoPdv): boolean => {
      if (!operador) {
        return false
      }
      return operadorTemPermissao(operador.perfil, permissao)
    },
    [operador],
  )

  const limparErro = useCallback(() => setErro(null), [])

  return {
    operador,
    operadores,
    autenticado,
    carregando,
    erro,
    autenticar,
    salvarPin,
    temPermissao,
    recarregar,
    limparErro,
  }
}
