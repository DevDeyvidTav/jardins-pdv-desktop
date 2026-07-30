import { useCallback, useEffect, useState } from 'react'
import type {
  MovimentoCaixa,
  RegistrarMovimentoCaixaEntrada,
  ResumoCaixaAtual,
} from '@shared/types/movimento-caixa'
import type { SessaoCaixa } from '@shared/types/sessao-caixa'

const OPERADOR_PADRAO = {
  operadorId: 'local',
  operadorNome: 'Operador Local',
} as const

export interface UseCaixaResultado {
  sessaoAberta: SessaoCaixa | null
  resumo: ResumoCaixaAtual | null
  movimentos: MovimentoCaixa[]
  carregando: boolean
  erro: string | null
  sucesso: string | null
  abrirSessao: (saldoInicialCentavos: number) => Promise<boolean>
  registrarMovimento: (
    entrada: RegistrarMovimentoCaixaEntrada,
  ) => Promise<boolean>
  recarregar: () => Promise<void>
  limparFeedback: () => void
}

function extrairMensagemErro(causa: unknown): string {
  if (causa instanceof Error) {
    return causa.message
  }

  return 'Nao foi possivel concluir a operacao de caixa.'
}

export function useCaixa(): UseCaixaResultado {
  const [sessaoAberta, setSessaoAberta] = useState<SessaoCaixa | null>(null)
  const [resumo, setResumo] = useState<ResumoCaixaAtual | null>(null)
  const [movimentos, setMovimentos] = useState<MovimentoCaixa[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  const carregarDados = useCallback(async () => {
    setCarregando(true)
    setErro(null)

    try {
      const [sessao, resumoAtual, listaMovimentos] = await Promise.all([
        window.pdv.caixa.obterSessaoCaixaAberta(),
        window.pdv.caixa.obterResumoCaixaAtual(),
        window.pdv.caixa.listarMovimentosCaixa(),
      ])

      setSessaoAberta(sessao)
      setResumo(resumoAtual)
      setMovimentos(listaMovimentos)
    } catch (causa) {
      setErro(extrairMensagemErro(causa))
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void carregarDados()
  }, [carregarDados])

  const abrirSessao = useCallback(
    async (saldoInicialCentavos: number): Promise<boolean> => {
      setErro(null)
      setSucesso(null)

      try {
        await window.pdv.caixa.abrirSessaoCaixa({
          ...OPERADOR_PADRAO,
          saldoInicialCentavos,
        })
        await carregarDados()
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [carregarDados],
  )

  const registrarMovimento = useCallback(
    async (entrada: RegistrarMovimentoCaixaEntrada): Promise<boolean> => {
      setErro(null)
      setSucesso(null)

      try {
        await window.pdv.caixa.registrarMovimentoCaixa(entrada)
        await carregarDados()
        setSucesso('Movimento registrado com sucesso.')
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [carregarDados],
  )

  const limparFeedback = useCallback(() => {
    setErro(null)
    setSucesso(null)
  }, [])

  return {
    sessaoAberta,
    resumo,
    movimentos,
    carregando,
    erro,
    sucesso,
    abrirSessao,
    registrarMovimento,
    recarregar: carregarDados,
    limparFeedback,
  }
}
