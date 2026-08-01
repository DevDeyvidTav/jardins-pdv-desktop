import { useCallback, useEffect, useState } from 'react'
import type { Mesa } from '@shared/types/mesa'
import type {
  FiltroStatusHistoricoPedido,
  ItemHistoricoPedido,
  Pedido,
  ResumoPedido,
} from '@shared/types/pedido'
import { FILTRO_STATUS_HISTORICO_PEDIDO } from '@shared/types/pedido'
import type { ProdutoComCategoria } from '@shared/types/produto'
import type { CategoriaProduto } from '@shared/types/categoria-produto'
import type { FormaPagamento, PagamentoInformado } from '@shared/types/pagamento-pedido'
import type { SessaoCaixa } from '@shared/types/sessao-caixa'
import { STATUS_MESA } from '@shared/types/mesa'
import {
  FILTROS_STATUS_MESA,
  type FiltroStatusMesa,
} from '../constants/mesa-status-cores'

export type AbaPedidos = 'mesas' | 'historico'

export interface UsePedidosResultado {
  mesas: Mesa[]
  mesaSelecionada: Mesa | null
  filtroStatusMesas: FiltroStatusMesa
  pedidosAbertos: Pedido[]
  resumoPedido: ResumoPedido | null
  produtosAtivos: ProdutoComCategoria[]
  categoriasAtivas: CategoriaProduto[]
  sessaoCaixa: SessaoCaixa | null
  carregando: boolean
  carregandoPedido: boolean
  exibirFormularioItem: boolean
  exibirCadastroMesas: boolean
  abaAtiva: AbaPedidos
  historicoPedidos: ItemHistoricoPedido[]
  historicoPedidoSelecionadoId: string | null
  filtroHistoricoStatus: FiltroStatusHistoricoPedido
  filtroHistoricoFormaPagamento: FormaPagamento | ''
  erro: string | null
  sucesso: string | null
  criarMesasPorIntervalo: (numeroInicial: number, numeroFinal: number) => Promise<boolean>
  abrirPedidoMesa: (mesaId: string) => Promise<boolean>
  abrirPedidoBalcao: () => Promise<boolean>
  selecionarMesaNoGrid: (mesa: Mesa) => Promise<void>
  abrirPedidoDaMesaSelecionada: () => Promise<boolean>
  adicionarItem: (
    produtoId: string,
    quantidade: number,
    observacao?: string,
  ) => Promise<boolean>
  alterarQuantidadeItem: (itemId: string, quantidade: number) => Promise<boolean>
  removerItem: (itemId: string, motivoCancelamento: string) => Promise<boolean>
  aplicarDescontoPedido: (descontoCentavos: number, motivoDesconto?: string) => Promise<boolean>
  cancelarPedido: (motivoCancelamento: string) => Promise<boolean>
  registrarPagamento: (pagamento: PagamentoInformado) => Promise<boolean>
  definirFiltroStatusMesas: (filtro: FiltroStatusMesa) => void
  definirAbaAtiva: (aba: AbaPedidos) => void
  definirFiltroHistoricoStatus: (status: FiltroStatusHistoricoPedido) => void
  definirFiltroHistoricoFormaPagamento: (forma: FormaPagamento | '') => void
  selecionarHistoricoPedido: (item: ItemHistoricoPedido) => Promise<void>
  abrirFormularioItem: () => void
  fecharFormularioItem: () => void
  alternarCadastroMesas: () => void
  limparSelecaoMesa: () => void
  recarregar: () => Promise<void>
  limparFeedback: () => void
}

function extrairMensagemErro(causa: unknown): string {
  if (causa instanceof Error) {
    return causa.message
  }

  return 'Nao foi possivel concluir a operacao de pedidos.'
}

export function usePedidos(): UsePedidosResultado {
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [mesaSelecionada, setMesaSelecionada] = useState<Mesa | null>(null)
  const [filtroStatusMesas, setFiltroStatusMesas] = useState<FiltroStatusMesa>(
    FILTROS_STATUS_MESA.TODAS,
  )
  const [pedidosAbertos, setPedidosAbertos] = useState<Pedido[]>([])
  const [resumoPedido, setResumoPedido] = useState<ResumoPedido | null>(null)
  const [produtosAtivos, setProdutosAtivos] = useState<ProdutoComCategoria[]>([])
  const [categoriasAtivas, setCategoriasAtivas] = useState<CategoriaProduto[]>([])
  const [sessaoCaixa, setSessaoCaixa] = useState<SessaoCaixa | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [carregandoPedido, setCarregandoPedido] = useState(false)
  const [exibirFormularioItem, setExibirFormularioItem] = useState(false)
  const [exibirCadastroMesas, setExibirCadastroMesas] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState<AbaPedidos>('mesas')
  const [historicoPedidos, setHistoricoPedidos] = useState<ItemHistoricoPedido[]>([])
  const [historicoPedidoSelecionadoId, setHistoricoPedidoSelecionadoId] = useState<
    string | null
  >(null)
  const [filtroHistoricoStatus, setFiltroHistoricoStatus] =
    useState<FiltroStatusHistoricoPedido>(FILTRO_STATUS_HISTORICO_PEDIDO.TODOS)
  const [filtroHistoricoFormaPagamento, setFiltroHistoricoFormaPagamento] = useState<
    FormaPagamento | ''
  >('')
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  const carregarHistorico = useCallback(async () => {
    const historico = await window.pdv.pedidos.listarHistoricoPedidos({
      status: filtroHistoricoStatus,
      formaPagamento: filtroHistoricoFormaPagamento,
    })
    setHistoricoPedidos(historico)
  }, [filtroHistoricoFormaPagamento, filtroHistoricoStatus])

  const carregarDados = useCallback(async () => {
    setCarregando(true)
    setErro(null)

    try {
      const [sessao, listaMesas, abertos, produtos, categorias] = await Promise.all([
        window.pdv.caixa.obterSessaoCaixaAberta(),
        window.pdv.mesas.listarMesas(),
        window.pdv.pedidos.listarPedidosAbertos(),
        window.pdv.produtos.listarProdutos({ apenasAtivos: true }),
        window.pdv.produtos.listarCategorias({ apenasAtivas: true }),
      ])

      setSessaoCaixa(sessao)
      setMesas(listaMesas)
      setPedidosAbertos(abertos)
      setProdutosAtivos(produtos)
      setCategoriasAtivas(categorias)

      setMesaSelecionada((atual) => {
        if (!atual) {
          return null
        }

        return listaMesas.find((mesa) => mesa.id === atual.id) ?? null
      })
    } catch (causa) {
      setErro(extrairMensagemErro(causa))
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void carregarDados()
  }, [carregarDados])

  useEffect(() => {
    if (abaAtiva !== 'historico') return
    void carregarHistorico().catch((causa) => {
      setErro(extrairMensagemErro(causa))
    })
  }, [abaAtiva, carregarHistorico])

  const atualizarResumo = useCallback(
    async (pedidoId: string, incluirItensCancelados = false) => {
      const resumo = await window.pdv.pedidos.obterResumoPedido({
        pedidoId,
        incluirItensCancelados,
      })
      setResumoPedido(resumo)
      return resumo
    },
    [],
  )

  const carregarPedidoAbertoDaMesa = useCallback(async (mesa: Mesa) => {
    setCarregandoPedido(true)
    setErro(null)

    try {
      const resumo = await window.pdv.pedidos.obterPedidoAbertoPorMesa({ mesaId: mesa.id })

      if (!resumo) {
        setResumoPedido(null)
        setErro('Pedido aberto nao encontrado para esta mesa.')
        return false
      }

      setResumoPedido(resumo)
      setExibirFormularioItem(false)
      return true
    } catch (causa) {
      setErro(extrairMensagemErro(causa))
      return false
    } finally {
      setCarregandoPedido(false)
    }
  }, [])

  const criarMesasPorIntervalo = useCallback(
    async (numeroInicial: number, numeroFinal: number): Promise<boolean> => {
      setErro(null)
      setSucesso(null)

      try {
        const mesasCriadas = await window.pdv.mesas.criarMesasPorIntervalo({
          numeroInicial,
          numeroFinal,
        })
        await carregarDados()
        setSucesso(
          mesasCriadas.length > 0
            ? `${mesasCriadas.length} mesa(s) criada(s) com sucesso.`
            : 'Nenhuma mesa nova foi criada. Os numeros informados ja existem.',
        )
        setExibirCadastroMesas(false)
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [carregarDados],
  )

  const abrirPedidoMesa = useCallback(
    async (mesaId: string): Promise<boolean> => {
      setErro(null)
      setSucesso(null)

      if (!sessaoCaixa) {
        setErro('Abra o caixa antes de criar pedidos.')
        return false
      }

      setCarregandoPedido(true)

      try {
        const pedido = await window.pdv.pedidos.criarPedidoMesa({ mesaId })
        await carregarDados()
        await atualizarResumo(pedido.id)
        setExibirFormularioItem(false)
        setSucesso('Pedido de mesa aberto.')
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      } finally {
        setCarregandoPedido(false)
      }
    },
    [atualizarResumo, carregarDados, sessaoCaixa],
  )

  const abrirPedidoBalcao = useCallback(async (): Promise<boolean> => {
    setErro(null)
    setSucesso(null)

    if (!sessaoCaixa) {
      setErro('Abra o caixa antes de criar pedidos.')
      return false
    }

    setCarregandoPedido(true)

    try {
      const pedido = await window.pdv.pedidos.criarPedidoBalcao()
      await carregarDados()
      await atualizarResumo(pedido.id)
      setMesaSelecionada(null)
      setExibirFormularioItem(false)
      setAbaAtiva('mesas')
      setHistoricoPedidoSelecionadoId(null)
      setSucesso(
        pedido.subtotalCentavos > 0 || pedido.totalCentavos > 0
          ? 'Pedido balcao reaberto.'
          : 'Pedido balcao aberto.',
      )
      return true
    } catch (causa) {
      setErro(extrairMensagemErro(causa))
      return false
    } finally {
      setCarregandoPedido(false)
    }
  }, [atualizarResumo, carregarDados, sessaoCaixa])

  const selecionarMesaNoGrid = useCallback(
    async (mesa: Mesa) => {
      setErro(null)
      setSucesso(null)
      setMesaSelecionada(mesa)
      setExibirFormularioItem(false)
      setAbaAtiva('mesas')
      setHistoricoPedidoSelecionadoId(null)

      if (mesa.status === STATUS_MESA.OCUPADA && mesa.ativo) {
        await carregarPedidoAbertoDaMesa(mesa)
        return
      }

      setResumoPedido(null)
    },
    [carregarPedidoAbertoDaMesa],
  )

  const abrirPedidoDaMesaSelecionada = useCallback(async (): Promise<boolean> => {
    if (!mesaSelecionada) {
      return false
    }

    if (!mesaSelecionada.ativo || mesaSelecionada.status === STATUS_MESA.INATIVA) {
      setErro('Mesa inativa.')
      return false
    }

    if (mesaSelecionada.status === STATUS_MESA.OCUPADA) {
      return carregarPedidoAbertoDaMesa(mesaSelecionada)
    }

    return abrirPedidoMesa(mesaSelecionada.id)
  }, [abrirPedidoMesa, carregarPedidoAbertoDaMesa, mesaSelecionada])

  const adicionarItem = useCallback(
    async (
      produtoId: string,
      quantidade: number,
      observacao?: string,
    ): Promise<boolean> => {
      if (!resumoPedido) {
        return false
      }

      setErro(null)
      setSucesso(null)

      try {
        const resumo = await window.pdv.pedidos.adicionarItemPedido({
          pedidoId: resumoPedido.pedido.id,
          produtoId,
          quantidade,
          observacao,
        })
        setResumoPedido(resumo)
        await carregarDados()
        setExibirFormularioItem(false)
        setSucesso('Item adicionado ao pedido.')
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [carregarDados, resumoPedido],
  )

  const alterarQuantidadeItem = useCallback(
    async (itemId: string, quantidade: number): Promise<boolean> => {
      if (!resumoPedido) {
        return false
      }

      setErro(null)
      setSucesso(null)

      try {
        const resumo = await window.pdv.pedidos.alterarQuantidadeItemPedido({
          pedidoId: resumoPedido.pedido.id,
          itemId,
          quantidade,
        })
        setResumoPedido(resumo)
        setSucesso('Quantidade atualizada.')
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [resumoPedido],
  )

  const removerItem = useCallback(
    async (itemId: string, motivoCancelamento: string): Promise<boolean> => {
      if (!resumoPedido) {
        return false
      }

      setErro(null)
      setSucesso(null)

      try {
        const resumo = await window.pdv.pedidos.removerItemPedido({
          pedidoId: resumoPedido.pedido.id,
          itemId,
          motivoCancelamento,
        })
        setResumoPedido(resumo)
        setSucesso('Item cancelado do pedido.')
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [resumoPedido],
  )

  const aplicarDescontoPedido = useCallback(
    async (descontoCentavos: number, motivoDesconto?: string): Promise<boolean> => {
      if (!resumoPedido) return false
      setErro(null)
      setSucesso(null)
      try {
        const resumo = await window.pdv.pedidos.aplicarDescontoPedido({
          pedidoId: resumoPedido.pedido.id,
          descontoCentavos,
          motivoDesconto,
        })
        setResumoPedido(resumo)
        await carregarDados()
        setSucesso('Desconto do pedido aplicado.')
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [carregarDados, resumoPedido],
  )

  const cancelarPedido = useCallback(
    async (motivoCancelamento: string): Promise<boolean> => {
      if (!resumoPedido) return false
      setErro(null)
      setSucesso(null)
      try {
        await window.pdv.pedidos.cancelarPedido({
          pedidoId: resumoPedido.pedido.id,
          motivoCancelamento,
        })
        setResumoPedido(null)
        setExibirFormularioItem(false)
        setMesaSelecionada(null)
        await carregarDados()
        setAbaAtiva('historico')
        setFiltroHistoricoStatus(FILTRO_STATUS_HISTORICO_PEDIDO.CANCELADO)
        setHistoricoPedidoSelecionadoId(null)
        setSucesso('Pedido cancelado.')
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [carregarDados, resumoPedido],
  )

  const registrarPagamento = useCallback(
    async (pagamento: PagamentoInformado): Promise<boolean> => {
      if (!resumoPedido) return false
      setErro(null)
      setSucesso(null)
      try {
        const resultado = await window.pdv.pagamentos.registrarPagamentoPedido({
          pedidoId: resumoPedido.pedido.id,
          formaPagamento: pagamento.formaPagamento,
          valorCentavos: pagamento.valorCentavos,
          motivoCortesia: pagamento.motivoCortesia,
        })
        await carregarDados()

        if (resultado.valorRestanteCentavos === 0) {
          setResumoPedido(null)
          setExibirFormularioItem(false)
          setMesaSelecionada(null)
          setAbaAtiva('historico')
          setFiltroHistoricoStatus(FILTRO_STATUS_HISTORICO_PEDIDO.FINALIZADO)
          setHistoricoPedidoSelecionadoId(null)
          setSucesso('Pagamento confirmado e pedido finalizado.')
        } else {
          await atualizarResumo(resumoPedido.pedido.id)
          setSucesso('Pagamento parcial registrado.')
        }
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [atualizarResumo, carregarDados, resumoPedido],
  )

  const definirFiltroStatusMesas = useCallback((filtro: FiltroStatusMesa) => {
    setFiltroStatusMesas(filtro)
  }, [])

  const definirAbaAtiva = useCallback((aba: AbaPedidos) => {
    setAbaAtiva(aba)
    if (aba === 'mesas') {
      setHistoricoPedidoSelecionadoId(null)
      setExibirCadastroMesas(false)
    } else {
      setExibirCadastroMesas(false)
      setExibirFormularioItem(false)
    }
  }, [])

  const definirFiltroHistoricoStatus = useCallback(
    (status: FiltroStatusHistoricoPedido) => {
      setFiltroHistoricoStatus(status)
    },
    [],
  )

  const definirFiltroHistoricoFormaPagamento = useCallback(
    (forma: FormaPagamento | '') => {
      setFiltroHistoricoFormaPagamento(forma)
    },
    [],
  )

  const selecionarHistoricoPedido = useCallback(
    async (item: ItemHistoricoPedido) => {
      setErro(null)
      setSucesso(null)
      setMesaSelecionada(null)
      setExibirFormularioItem(false)
      setHistoricoPedidoSelecionadoId(item.pedido.id)
      setCarregandoPedido(true)
      try {
        await atualizarResumo(item.pedido.id, item.pedido.status === 'CANCELADO')
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
      } finally {
        setCarregandoPedido(false)
      }
    },
    [atualizarResumo],
  )

  const abrirFormularioItem = useCallback(() => {
    setExibirFormularioItem(true)
  }, [])

  const fecharFormularioItem = useCallback(() => {
    setExibirFormularioItem(false)
  }, [])

  const alternarCadastroMesas = useCallback(() => {
    setExibirCadastroMesas((atual) => !atual)
  }, [])

  const limparSelecaoMesa = useCallback(() => {
    setMesaSelecionada(null)
    setResumoPedido(null)
    setExibirFormularioItem(false)
  }, [])

  const limparFeedback = useCallback(() => {
    setErro(null)
    setSucesso(null)
  }, [])

  return {
    mesas,
    mesaSelecionada,
    filtroStatusMesas,
    pedidosAbertos,
    resumoPedido,
    produtosAtivos,
    categoriasAtivas,
    sessaoCaixa,
    carregando,
    carregandoPedido,
    exibirFormularioItem,
    exibirCadastroMesas,
    abaAtiva,
    historicoPedidos,
    historicoPedidoSelecionadoId,
    filtroHistoricoStatus,
    filtroHistoricoFormaPagamento,
    erro,
    sucesso,
    criarMesasPorIntervalo,
    abrirPedidoMesa,
    abrirPedidoBalcao,
    selecionarMesaNoGrid,
    abrirPedidoDaMesaSelecionada,
    adicionarItem,
    alterarQuantidadeItem,
    removerItem,
    aplicarDescontoPedido,
    cancelarPedido,
    registrarPagamento,
    definirFiltroStatusMesas,
    definirAbaAtiva,
    definirFiltroHistoricoStatus,
    definirFiltroHistoricoFormaPagamento,
    selecionarHistoricoPedido,
    abrirFormularioItem,
    fecharFormularioItem,
    alternarCadastroMesas,
    limparSelecaoMesa,
    recarregar: carregarDados,
    limparFeedback,
  }
}
