export type EstadoAtualizacao = {
  ativo: boolean
  verificando: boolean
  baixando: boolean
  baixada: boolean
  versaoAtual: string
  versaoDisponivel: string | null
  progressoPercentual: number | null
  mensagem: string
  erro: string | null
}
