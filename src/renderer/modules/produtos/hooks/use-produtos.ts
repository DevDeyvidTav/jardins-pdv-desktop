import { useCallback, useEffect, useState } from 'react'
import type { CategoriaProduto } from '@shared/types/categoria-produto'
import type { ProdutoComCategoria } from '@shared/types/produto'

export interface UseProdutosResultado {
  categorias: CategoriaProduto[]
  produtos: ProdutoComCategoria[]
  produtosAdministrativos: ProdutoComCategoria[]
  carregando: boolean
  erro: string | null
  sucesso: string | null
  termoBusca: string
  categoriaFiltroId: string
  criarCategoria: (nome: string, descricao?: string) => Promise<boolean>
  inativarCategoria: (categoriaId: string) => Promise<boolean>
  reativarCategoria: (categoriaId: string) => Promise<boolean>
  criarProduto: (
    categoriaId: string,
    nome: string,
    precoCentavos: number,
    descricao?: string,
  ) => Promise<boolean>
  inativarProduto: (produtoId: string) => Promise<boolean>
  reativarProduto: (produtoId: string) => Promise<boolean>
  definirTermoBusca: (termo: string) => void
  definirCategoriaFiltro: (categoriaId: string) => void
  recarregar: () => Promise<void>
  limparFeedback: () => void
}

function extrairMensagemErro(causa: unknown): string {
  if (causa instanceof Error) {
    return causa.message
  }

  return 'Nao foi possivel concluir a operacao de produtos.'
}

export function useProdutos(): UseProdutosResultado {
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([])
  const [produtos, setProdutos] = useState<ProdutoComCategoria[]>([])
  const [produtosAdministrativos, setProdutosAdministrativos] = useState<
    ProdutoComCategoria[]
  >([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [termoBusca, setTermoBusca] = useState('')
  const [categoriaFiltroId, setCategoriaFiltroId] = useState('')

  const carregarProdutosAtivos = useCallback(
    async (termo: string, categoriaId: string) => {
      const filtros = {
        categoriaId: categoriaId || undefined,
        apenasAtivos: true,
      }

      if (termo.trim() !== '') {
        return window.pdv.produtos.buscarProdutos({
          termo,
          ...filtros,
        })
      }

      return window.pdv.produtos.listarProdutos(filtros)
    },
    [],
  )

  const carregarDados = useCallback(async () => {
    setCarregando(true)
    setErro(null)

    try {
      const [listaCategorias, listaAtivos, listaAdministrativos] = await Promise.all([
        window.pdv.produtos.listarCategorias(),
        carregarProdutosAtivos(termoBusca, categoriaFiltroId),
        window.pdv.produtos.listarProdutos({ apenasAtivos: false }),
      ])

      setCategorias(listaCategorias)
      setProdutos(listaAtivos)
      setProdutosAdministrativos(listaAdministrativos)
    } catch (causa) {
      setErro(extrairMensagemErro(causa))
    } finally {
      setCarregando(false)
    }
  }, [carregarProdutosAtivos, categoriaFiltroId, termoBusca])

  useEffect(() => {
    void carregarDados()
  }, [carregarDados])

  const criarCategoria = useCallback(
    async (nome: string, descricao?: string): Promise<boolean> => {
      setErro(null)
      setSucesso(null)

      try {
        await window.pdv.produtos.criarCategoria({ nome, descricao })
        await carregarDados()
        setSucesso('Categoria criada com sucesso.')
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [carregarDados],
  )

  const inativarCategoriaHandler = useCallback(
    async (categoriaId: string): Promise<boolean> => {
      setErro(null)
      setSucesso(null)

      try {
        await window.pdv.produtos.inativarCategoria({ categoriaId })
        await carregarDados()
        setSucesso('Categoria inativada com sucesso.')
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [carregarDados],
  )

  const reativarCategoriaHandler = useCallback(
    async (categoriaId: string): Promise<boolean> => {
      setErro(null)
      setSucesso(null)

      try {
        await window.pdv.produtos.reativarCategoria({ categoriaId })
        await carregarDados()
        setSucesso('Categoria reativada com sucesso.')
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [carregarDados],
  )

  const criarProdutoHandler = useCallback(
    async (
      categoriaId: string,
      nome: string,
      precoCentavos: number,
      descricao?: string,
    ): Promise<boolean> => {
      setErro(null)
      setSucesso(null)

      try {
        await window.pdv.produtos.criarProduto({
          categoriaId,
          nome,
          precoCentavos,
          descricao,
        })
        await carregarDados()
        setSucesso('Produto criado com sucesso.')
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [carregarDados],
  )

  const inativarProdutoHandler = useCallback(
    async (produtoId: string): Promise<boolean> => {
      setErro(null)
      setSucesso(null)

      try {
        await window.pdv.produtos.inativarProduto({ produtoId })
        await carregarDados()
        setSucesso('Produto inativado com sucesso.')
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [carregarDados],
  )

  const reativarProdutoHandler = useCallback(
    async (produtoId: string): Promise<boolean> => {
      setErro(null)
      setSucesso(null)

      try {
        await window.pdv.produtos.reativarProduto({ produtoId })
        await carregarDados()
        setSucesso('Produto reativado com sucesso.')
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [carregarDados],
  )

  const definirTermoBusca = useCallback((termo: string) => {
    setTermoBusca(termo)
  }, [])

  const definirCategoriaFiltro = useCallback((categoriaId: string) => {
    setCategoriaFiltroId(categoriaId)
  }, [])

  const limparFeedback = useCallback(() => {
    setErro(null)
    setSucesso(null)
  }, [])

  return {
    categorias,
    produtos,
    produtosAdministrativos,
    carregando,
    erro,
    sucesso,
    termoBusca,
    categoriaFiltroId,
    criarCategoria,
    inativarCategoria: inativarCategoriaHandler,
    reativarCategoria: reativarCategoriaHandler,
    criarProduto: criarProdutoHandler,
    inativarProduto: inativarProdutoHandler,
    reativarProduto: reativarProdutoHandler,
    definirTermoBusca,
    definirCategoriaFiltro,
    recarregar: carregarDados,
    limparFeedback,
  }
}
