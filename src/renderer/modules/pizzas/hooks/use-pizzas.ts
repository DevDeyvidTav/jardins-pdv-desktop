import { useCallback, useEffect, useState } from 'react'
import type {
  CriarPizzaCategoriaEntrada,
  CriarPizzaSaborEntrada,
  CriarPizzaTamanhoEntrada,
  PizzaCategoria,
  PizzaSabor,
  PizzaSaborPreco,
  PizzaTamanho,
  RegraPrecificacaoPizza,
} from '@shared/types/pizza'
import { extrairMensagemErroIpc } from '@shared/utils/erro-ipc'

export interface UsePizzasResultado {
  categorias: PizzaCategoria[]
  tamanhos: PizzaTamanho[]
  sabores: PizzaSabor[]
  carregando: boolean
  erro: string | null
  sucesso: string | null
  criarCategoria: (entrada: CriarPizzaCategoriaEntrada) => Promise<boolean>
  atualizarCategoria: (
    categoriaId: string,
    dados: {
      nome?: string
      descricao?: string | null
      regraPrecificacao?: RegraPrecificacaoPizza
      ativa?: boolean
      ordem?: number
    },
  ) => Promise<boolean>
  criarTamanho: (entrada: CriarPizzaTamanhoEntrada) => Promise<boolean>
  atualizarTamanho: (
    tamanhoId: string,
    dados: {
      nome?: string
      sigla?: string
      maximoSabores?: number
      ativa?: boolean
      ordem?: number
    },
  ) => Promise<boolean>
  criarSabor: (entrada: CriarPizzaSaborEntrada) => Promise<boolean>
  atualizarSabor: (
    saborId: string,
    dados: {
      nome?: string
      descricao?: string | null
      ativa?: boolean
      ordem?: number
    },
  ) => Promise<boolean>
  vincularSaborCategoria: (
    saborId: string,
    categoriaId: string,
    ativo: boolean,
  ) => Promise<boolean>
  listarCategoriasDoSabor: (saborId: string) => Promise<string[]>
  listarPrecosSabor: (saborId: string) => Promise<PizzaSaborPreco[]>
  definirPrecosSabor: (
    saborId: string,
    precos: Array<{ tamanhoId: string; valorCentavos: number }>,
  ) => Promise<boolean>
  recarregar: () => Promise<void>
  limparFeedback: () => void
}

function extrairMensagemErro(causa: unknown): string {
  return extrairMensagemErroIpc(causa)
}

export function usePizzas(): UsePizzasResultado {
  const [categorias, setCategorias] = useState<PizzaCategoria[]>([])
  const [tamanhos, setTamanhos] = useState<PizzaTamanho[]>([])
  const [sabores, setSabores] = useState<PizzaSabor[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  const carregarDados = useCallback(async () => {
    setCarregando(true)
    setErro(null)

    try {
      const [listaCategorias, listaTamanhos, listaSabores] = await Promise.all([
        window.pdv.pizzas.listarCategorias(),
        window.pdv.pizzas.listarTamanhos(),
        window.pdv.pizzas.listarSabores(),
      ])

      setCategorias(listaCategorias)
      setTamanhos(listaTamanhos)
      setSabores(listaSabores)
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
    return window.pdv.sync.onCatalogoAtualizado(() => {
      void carregarDados()
    })
  }, [carregarDados])

  const criarCategoria = useCallback(
    async (entrada: CriarPizzaCategoriaEntrada): Promise<boolean> => {
      setErro(null)
      setSucesso(null)

      try {
        await window.pdv.pizzas.criarCategoria(entrada)
        await carregarDados()
        setSucesso('Categoria de pizza criada com sucesso.')
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [carregarDados],
  )

  const atualizarCategoria = useCallback(
    async (
      categoriaId: string,
      dados: {
        nome?: string
        descricao?: string | null
        regraPrecificacao?: RegraPrecificacaoPizza
        ativa?: boolean
        ordem?: number
      },
    ): Promise<boolean> => {
      setErro(null)
      setSucesso(null)

      try {
        await window.pdv.pizzas.atualizarCategoria({ categoriaId, ...dados })
        await carregarDados()
        setSucesso('Categoria de pizza atualizada com sucesso.')
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [carregarDados],
  )

  const criarTamanho = useCallback(
    async (entrada: CriarPizzaTamanhoEntrada): Promise<boolean> => {
      setErro(null)
      setSucesso(null)

      try {
        await window.pdv.pizzas.criarTamanho(entrada)
        await carregarDados()
        setSucesso('Tamanho de pizza criado com sucesso.')
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [carregarDados],
  )

  const atualizarTamanho = useCallback(
    async (
      tamanhoId: string,
      dados: {
        nome?: string
        sigla?: string
        maximoSabores?: number
        ativa?: boolean
        ordem?: number
      },
    ): Promise<boolean> => {
      setErro(null)
      setSucesso(null)

      try {
        await window.pdv.pizzas.atualizarTamanho({ tamanhoId, ...dados })
        await carregarDados()
        setSucesso('Tamanho de pizza atualizado com sucesso.')
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [carregarDados],
  )

  const criarSabor = useCallback(
    async (entrada: CriarPizzaSaborEntrada): Promise<boolean> => {
      setErro(null)
      setSucesso(null)

      try {
        await window.pdv.pizzas.criarSabor(entrada)
        await carregarDados()
        setSucesso('Sabor de pizza criado com sucesso.')
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [carregarDados],
  )

  const atualizarSabor = useCallback(
    async (
      saborId: string,
      dados: {
        nome?: string
        descricao?: string | null
        ativa?: boolean
        ordem?: number
      },
    ): Promise<boolean> => {
      setErro(null)
      setSucesso(null)

      try {
        await window.pdv.pizzas.atualizarSabor({ saborId, ...dados })
        await carregarDados()
        setSucesso('Sabor de pizza atualizado com sucesso.')
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [carregarDados],
  )

  const vincularSaborCategoria = useCallback(
    async (saborId: string, categoriaId: string, ativo: boolean): Promise<boolean> => {
      setErro(null)
      setSucesso(null)

      try {
        await window.pdv.pizzas.vincularSaborCategoria({ saborId, categoriaId, ativo })
        setSucesso(
          ativo
            ? 'Sabor vinculado a categoria.'
            : 'Vinculo do sabor com a categoria removido.',
        )
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [],
  )

  const listarCategoriasDoSabor = useCallback(async (saborId: string): Promise<string[]> => {
    return window.pdv.pizzas.listarCategoriasDoSabor({ saborId })
  }, [])

  const listarPrecosSabor = useCallback(async (saborId: string): Promise<PizzaSaborPreco[]> => {
    return window.pdv.pizzas.listarPrecosSabor({ saborId })
  }, [])

  const definirPrecosSabor = useCallback(
    async (
      saborId: string,
      precos: Array<{ tamanhoId: string; valorCentavos: number }>,
    ): Promise<boolean> => {
      setErro(null)
      setSucesso(null)

      try {
        for (const preco of precos) {
          await window.pdv.pizzas.definirPreco({
            saborId,
            tamanhoId: preco.tamanhoId,
            valorCentavos: preco.valorCentavos,
          })
        }
        setSucesso('Precos do sabor salvos com sucesso.')
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [],
  )

  const limparFeedback = useCallback(() => {
    setErro(null)
    setSucesso(null)
  }, [])

  return {
    categorias,
    tamanhos,
    sabores,
    carregando,
    erro,
    sucesso,
    criarCategoria,
    atualizarCategoria,
    criarTamanho,
    atualizarTamanho,
    criarSabor,
    atualizarSabor,
    vincularSaborCategoria,
    listarCategoriasDoSabor,
    listarPrecosSabor,
    definirPrecosSabor,
    recarregar: carregarDados,
    limparFeedback,
  }
}
