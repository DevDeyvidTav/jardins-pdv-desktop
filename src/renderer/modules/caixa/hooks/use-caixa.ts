import { useCallback, useEffect, useState } from 'react'
import type { SessaoCaixa } from '@shared/types/sessao-caixa'

const OPERADOR_PADRAO = {
  operadorId: 'local',
  operadorNome: 'Operador Local',
} as const

interface UseCaixaResultado {
  sessaoAberta: SessaoCaixa | null
  carregando: boolean
  erro: string | null
  abrirSessao: (saldoInicialCentavos: number) => Promise<boolean>
}

function extrairMensagemErro(causa: unknown): string {
  if (causa instanceof Error) {
    return causa.message
  }

  return 'Nao foi possivel concluir a operacao de caixa.'
}

export function useCaixa(): UseCaixaResultado {
  const [sessaoAberta, setSessaoAberta] = useState<SessaoCaixa | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregarSessaoAberta = useCallback(async () => {
    setCarregando(true)
    setErro(null)

    try {
      const sessao = await window.pdv.caixa.obterSessaoCaixaAberta()
      setSessaoAberta(sessao)
    } catch (causa) {
      setErro(extrairMensagemErro(causa))
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void carregarSessaoAberta()
  }, [carregarSessaoAberta])

  const abrirSessao = useCallback(
    async (saldoInicialCentavos: number): Promise<boolean> => {
      setErro(null)

      try {
        const sessao = await window.pdv.caixa.abrirSessaoCaixa({
          ...OPERADOR_PADRAO,
          saldoInicialCentavos,
        })
        setSessaoAberta(sessao)
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [],
  )

  return {
    sessaoAberta,
    carregando,
    erro,
    abrirSessao,
  }
}
