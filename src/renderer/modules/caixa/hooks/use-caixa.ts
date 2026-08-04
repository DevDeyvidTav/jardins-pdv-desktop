import { useCallback, useEffect, useState } from 'react'
import type {
  MovimentoCaixa,
  RegistrarMovimentoCaixaEntrada,
  ResumoCaixaAtual,
} from '@shared/types/movimento-caixa'
import type {
  FecharSessaoCaixaEntrada,
  SessaoCaixa,
} from '@shared/types/sessao-caixa'
import { STATUS_SESSAO_CAIXA } from '@shared/types/sessao-caixa'
import { extrairMensagemErroIpc } from '@shared/utils/erro-ipc'

const OPERADOR_PADRAO = {
  operadorId: 'local',
  operadorNome: 'Operador Local',
} as const

export type PaginaCaixa = 'movimentos' | 'fechamento' | 'pos-fechamento'

export interface UseCaixaResultado {
  sessaoAberta: SessaoCaixa | null
  ultimaSessao: SessaoCaixa | null
  resumo: ResumoCaixaAtual | null
  movimentos: MovimentoCaixa[]
  paginaAtiva: PaginaCaixa
  carregando: boolean
  erro: string | null
  sucesso: string | null
  abrirSessao: (saldoInicialCentavos: number) => Promise<boolean>
  registrarMovimento: (
    entrada: RegistrarMovimentoCaixaEntrada,
  ) => Promise<boolean>
  fecharSessao: (entrada: FecharSessaoCaixaEntrada) => Promise<boolean>
  irParaFechamento: () => void
  irParaMovimentos: () => void
  iniciarNovaAbertura: () => void
  recarregar: () => Promise<void>
  limparFeedback: () => void
}

function extrairMensagemErro(causa: unknown): string {
  return extrairMensagemErroIpc(causa)
}

export function useCaixa(): UseCaixaResultado {
  const [sessaoAberta, setSessaoAberta] = useState<SessaoCaixa | null>(null)
  const [ultimaSessao, setUltimaSessao] = useState<SessaoCaixa | null>(null)
  const [resumo, setResumo] = useState<ResumoCaixaAtual | null>(null)
  const [movimentos, setMovimentos] = useState<MovimentoCaixa[]>([])
  const [paginaAtiva, setPaginaAtiva] = useState<PaginaCaixa>('movimentos')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  const carregarDados = useCallback(async () => {
    setCarregando(true)
    setErro(null)

    try {
      const [sessao, resumoAtual, listaMovimentos, ultima] = await Promise.all([
        window.pdv.caixa.obterSessaoCaixaAberta(),
        window.pdv.caixa.obterResumoCaixaAtual(),
        window.pdv.caixa.listarMovimentosCaixa(),
        window.pdv.caixa.obterUltimaSessaoCaixa(),
      ])

      setSessaoAberta(sessao)
      setResumo(resumoAtual)
      setMovimentos(listaMovimentos)
      setUltimaSessao(ultima)

      if (sessao) {
        setPaginaAtiva((atual) =>
          atual === 'pos-fechamento' ? 'movimentos' : atual,
        )
      } else if (ultima?.status === STATUS_SESSAO_CAIXA.FECHADO) {
        setPaginaAtiva('pos-fechamento')
      }
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
        setPaginaAtiva('movimentos')
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

  const fecharSessao = useCallback(
    async (entrada: FecharSessaoCaixaEntrada): Promise<boolean> => {
      setErro(null)
      setSucesso(null)

      try {
        const sessaoFechada = await window.pdv.caixa.fecharSessaoCaixa(entrada)
        setUltimaSessao(sessaoFechada)
        setSessaoAberta(null)
        setResumo(null)
        setMovimentos([])
        setPaginaAtiva('pos-fechamento')
        setSucesso('Caixa fechado com sucesso.')
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [],
  )

  const irParaFechamento = useCallback(() => {
    setErro(null)
    setSucesso(null)
    setPaginaAtiva('fechamento')
  }, [])

  const irParaMovimentos = useCallback(() => {
    setErro(null)
    setSucesso(null)
    setPaginaAtiva('movimentos')
  }, [])

  const iniciarNovaAbertura = useCallback(() => {
    setErro(null)
    setSucesso(null)
    setPaginaAtiva('movimentos')
  }, [])

  const limparFeedback = useCallback(() => {
    setErro(null)
    setSucesso(null)
  }, [])

  return {
    sessaoAberta,
    ultimaSessao,
    resumo,
    movimentos,
    paginaAtiva,
    carregando,
    erro,
    sucesso,
    abrirSessao,
    registrarMovimento,
    fecharSessao,
    irParaFechamento,
    irParaMovimentos,
    iniciarNovaAbertura,
    recarregar: carregarDados,
    limparFeedback,
  }
}
