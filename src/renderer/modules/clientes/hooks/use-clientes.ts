import { useCallback, useEffect, useRef, useState } from 'react'
import type { Cliente, CriarClienteEntrada } from '@shared/types/cliente'
import type { ContaTalaoCliente } from '@shared/types/talao'
import type { FormaPagamento } from '@shared/types/pagamento-pedido'
import { competenciaAtualUtc } from '@shared/utils/data-hora'
import { extrairMensagemErroIpc } from '@shared/utils/erro-ipc'

export interface UseClientesResultado {
  clientes: Cliente[]
  clienteSelecionado: Cliente | null
  conta: ContaTalaoCliente | null
  competencia: string
  termoBusca: string
  carregando: boolean
  carregandoConta: boolean
  erro: string | null
  sucesso: string | null
  criarCliente: (entrada: CriarClienteEntrada) => Promise<boolean>
  atualizarCliente: (entrada: {
    nome: string
    telefone?: string | null
    documento?: string | null
    endereco?: string | null
    liberaTalao: boolean
  }) => Promise<boolean>
  inativarCliente: () => Promise<boolean>
  reativarCliente: () => Promise<boolean>
  selecionarCliente: (cliente: Cliente | null) => Promise<void>
  registrarBaixa: (entrada: {
    formaPagamento: FormaPagamento
    valorCentavos: number
    valorRecebidoCentavos?: number
    observacao?: string
  }) => Promise<boolean>
  definirTermoBusca: (termo: string) => void
  definirCompetencia: (competencia: string) => void
  recarregar: () => Promise<void>
  limparFeedback: () => void
}

function extrairMensagemErro(causa: unknown): string {
  return extrairMensagemErroIpc(causa)
}

export function useClientes(): UseClientesResultado {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [conta, setConta] = useState<ContaTalaoCliente | null>(null)
  const [competencia, setCompetencia] = useState(competenciaAtualUtc())
  const [termoBusca, setTermoBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [carregandoConta, setCarregandoConta] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const clienteSelecionadoIdRef = useRef<string | null>(null)
  clienteSelecionadoIdRef.current = clienteSelecionado?.id ?? null
  const competenciaRef = useRef(competencia)
  competenciaRef.current = competencia

  const carregarConta = useCallback(
    async (clienteId: string, competenciaConta: string) => {
      setCarregandoConta(true)
      try {
        const contaAtual = await window.pdv.talao.obterConta({
          clienteId,
          competencia: competenciaConta,
        })
        setConta(contaAtual)
        setClienteSelecionado(contaAtual.cliente)
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        setConta(null)
      } finally {
        setCarregandoConta(false)
      }
    },
    [],
  )

  const carregarDados = useCallback(async () => {
    setCarregando(true)
    setErro(null)

    try {
      const lista = await window.pdv.clientes.listar({
        apenasAtivos: false,
        termo: termoBusca.trim() || undefined,
      })
      setClientes(lista)

      setClienteSelecionado((atual) => {
        if (!atual) return null
        return lista.find((cliente) => cliente.id === atual.id) ?? null
      })

      const clienteId = clienteSelecionadoIdRef.current
      if (clienteId) {
        await carregarConta(clienteId, competenciaRef.current)
      }
    } catch (causa) {
      setErro(extrairMensagemErro(causa))
    } finally {
      setCarregando(false)
    }
  }, [carregarConta, termoBusca])

  useEffect(() => {
    void carregarDados()
  }, [carregarDados])

  useEffect(() => {
    if (!clienteSelecionado) {
      setConta(null)
      return
    }
    void carregarConta(clienteSelecionado.id, competencia)
  }, [carregarConta, clienteSelecionado?.id, competencia])

  const criarCliente = useCallback(
    async (entrada: CriarClienteEntrada): Promise<boolean> => {
      setErro(null)
      setSucesso(null)
      try {
        const criado = await window.pdv.clientes.criar(entrada)
        await carregarDados()
        setClienteSelecionado(criado)
        setSucesso('Cliente cadastrado.')
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [carregarDados],
  )

  const atualizarCliente = useCallback(
    async (entrada: {
      nome: string
      telefone?: string | null
      documento?: string | null
      endereco?: string | null
      liberaTalao: boolean
    }): Promise<boolean> => {
      if (!clienteSelecionado) return false
      setErro(null)
      setSucesso(null)
      try {
        const atualizado = await window.pdv.clientes.atualizar({
          clienteId: clienteSelecionado.id,
          ...entrada,
        })
        await carregarDados()
        setClienteSelecionado(atualizado)
        setSucesso('Cliente atualizado.')
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [carregarDados, clienteSelecionado],
  )

  const inativarCliente = useCallback(async (): Promise<boolean> => {
    if (!clienteSelecionado) return false
    setErro(null)
    setSucesso(null)
    try {
      const atualizado = await window.pdv.clientes.inativar({
        clienteId: clienteSelecionado.id,
      })
      await carregarDados()
      setClienteSelecionado(atualizado)
      setSucesso('Cliente inativado.')
      return true
    } catch (causa) {
      setErro(extrairMensagemErro(causa))
      return false
    }
  }, [carregarDados, clienteSelecionado])

  const reativarCliente = useCallback(async (): Promise<boolean> => {
    if (!clienteSelecionado) return false
    setErro(null)
    setSucesso(null)
    try {
      const atualizado = await window.pdv.clientes.reativar({
        clienteId: clienteSelecionado.id,
      })
      await carregarDados()
      setClienteSelecionado(atualizado)
      setSucesso('Cliente reativado.')
      return true
    } catch (causa) {
      setErro(extrairMensagemErro(causa))
      return false
    }
  }, [carregarDados, clienteSelecionado])

  const selecionarCliente = useCallback(async (cliente: Cliente | null) => {
    setErro(null)
    setSucesso(null)
    setClienteSelecionado(cliente)
    if (!cliente) {
      setConta(null)
    }
  }, [])

  const registrarBaixa = useCallback(
    async (entrada: {
      formaPagamento: FormaPagamento
      valorCentavos: number
      valorRecebidoCentavos?: number
      observacao?: string
    }): Promise<boolean> => {
      if (!clienteSelecionado) return false
      setErro(null)
      setSucesso(null)
      try {
        await window.pdv.talao.registrarBaixa({
          clienteId: clienteSelecionado.id,
          competencia,
          formaPagamento: entrada.formaPagamento,
          valorCentavos: entrada.valorCentavos,
          valorRecebidoCentavos: entrada.valorRecebidoCentavos,
          observacao: entrada.observacao,
        })
        await carregarConta(clienteSelecionado.id, competencia)
        setSucesso('Baixa do talão registrada.')
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [carregarConta, clienteSelecionado, competencia],
  )

  const limparFeedback = useCallback(() => {
    setErro(null)
    setSucesso(null)
  }, [])

  return {
    clientes,
    clienteSelecionado,
    conta,
    competencia,
    termoBusca,
    carregando,
    carregandoConta,
    erro,
    sucesso,
    criarCliente,
    atualizarCliente,
    inativarCliente,
    reativarCliente,
    selecionarCliente,
    registrarBaixa,
    definirTermoBusca: setTermoBusca,
    definirCompetencia: setCompetencia,
    recarregar: carregarDados,
    limparFeedback,
  }
}
