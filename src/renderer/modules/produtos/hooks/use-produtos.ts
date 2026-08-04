import { useCallback, useEffect, useState } from 'react'
import type { CategoriaProduto } from '@shared/types/categoria-produto'
import type { ProdutoComCategoria } from '@shared/types/produto'
import { extrairMensagemErroIpc } from '@shared/utils/erro-ipc'

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
  atualizarCategoria: (
    categoriaId: string,
    nome: string,
    descricao?: string,
  ) => Promise<boolean>
  inativarCategoria: (categoriaId: string) => Promise<boolean>
  reativarCategoria: (categoriaId: string) => Promise<boolean>
  excluirCategoria: (categoriaId: string) => Promise<boolean>
  criarProduto: (
    categoriaId: string,
    nome: string,
    precoCentavos: number,
    descricao?: string,
  ) => Promise<boolean>
  atualizarProduto: (
    produtoId: string,
    categoriaId: string,
    nome: string,
    precoCentavos: number,
    descricao?: string,
  ) => Promise<boolean>
  inativarProduto: (produtoId: string) => Promise<boolean>
  reativarProduto: (produtoId: string) => Promise<boolean>
  excluirProduto: (produtoId: string) => Promise<boolean>
  definirTermoBusca: (termo: string) => void
  definirCategoriaFiltro: (categoriaId: string) => void
  recarregar: () => Promise<void>
  limparFeedback: () => void
}

function extrairMensagemErro(causa: unknown): string {
  return extrairMensagemErroIpc(causa)
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
        window.pdv.produtos.listarCategorias({ apenasAtivas: true }),
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

  const atualizarCategoria = useCallback(
    async (categoriaId: string, nome: string, descricao?: string): Promise<boolean> => {
      setErro(null)
      setSucesso(null)

      try {
        await window.pdv.produtos.atualizarCategoria({
          categoriaId,
          nome,
          descricao: descricao ?? null,
        })
        await carregarDados()
        setSucesso('Categoria atualizada com sucesso.')
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

  const excluirCategoriaHandler = useCallback(
    async (categoriaId: string): Promise<boolean> => {
      setErro(null)
      setSucesso(null)

      try {
        const resultado = await window.pdv.produtos.excluirCategoria({ categoriaId })
        if (categoriaFiltroId === categoriaId) {
          setCategoriaFiltroId('')
        }
        await carregarDados()
        setSucesso(
          resultado.modo === 'INATIVADO'
            ? 'Categoria e produtos vinculados foram removidos do cardapio (soft delete).'
            : 'Categoria excluida com sucesso.',
        )
        return true
      } catch (causa) {
        setErro(extrairMensagemErro(causa))
        return false
      }
    },
    [carregarDados, categoriaFiltroId],
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

  const atualizarProdutoHandler = useCallback(
    async (
      produtoId: string,
      categoriaId: string,
      nome: string,
      precoCentavos: number,
      descricao?: string,
    ): Promise<boolean> => {
      setErro(null)
      setSucesso(null)

      try {
        await window.pdv.produtos.atualizarProduto({
          produtoId,
          categoriaId,
          nome,
          precoCentavos,
          descricao: descricao ?? null,
        })
        await carregarDados()
        setSucesso('Produto atualizado com sucesso.')
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

  const excluirProdutoHandler = useCallback(
    async (produtoId: string): Promise<boolean> => {
      setErro(null)
      setSucesso(null)

      try {
        const resultado = await window.pdv.produtos.excluirProduto({ produtoId })
        await carregarDados()
        setSucesso(
          resultado.modo === 'INATIVADO'
            ? 'Produto ja foi usado em pedidos e foi inativado.'
            : 'Produto excluido com sucesso.',
        )
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
    atualizarCategoria,
    inativarCategoria: inativarCategoriaHandler,
    reativarCategoria: reativarCategoriaHandler,
    excluirCategoria: excluirCategoriaHandler,
    criarProduto: criarProdutoHandler,
    atualizarProduto: atualizarProdutoHandler,
    inativarProduto: inativarProdutoHandler,
    reativarProduto: reativarProdutoHandler,
    excluirProduto: excluirProdutoHandler,
    definirTermoBusca,
    definirCategoriaFiltro,
    recarregar: carregarDados,
    limparFeedback,
  }
}
