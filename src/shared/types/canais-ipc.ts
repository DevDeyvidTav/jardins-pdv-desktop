export const CANAIS_IPC = {
  SISTEMA_OBTER_INFORMACOES: 'sistema:obter-informacoes',
  CAIXA_ABRIR_SESSAO: 'caixa:abrir-sessao',
  CAIXA_OBTER_SESSAO_ABERTA: 'caixa:obter-sessao-aberta',
  CAIXA_REGISTRAR_MOVIMENTO: 'caixa:registrar-movimento',
  CAIXA_LISTAR_MOVIMENTOS: 'caixa:listar-movimentos',
  CAIXA_OBTER_RESUMO_ATUAL: 'caixa:obter-resumo-atual',
  CAIXA_FECHAR_SESSAO: 'caixa:fechar-sessao',
  CAIXA_OBTER_ULTIMA_SESSAO: 'caixa:obter-ultima-sessao',
  PRODUTOS_CRIAR_CATEGORIA: 'produtos:criar-categoria',
  PRODUTOS_LISTAR_CATEGORIAS: 'produtos:listar-categorias',
  PRODUTOS_ATUALIZAR_CATEGORIA: 'produtos:atualizar-categoria',
  PRODUTOS_INATIVAR_CATEGORIA: 'produtos:inativar-categoria',
  PRODUTOS_REATIVAR_CATEGORIA: 'produtos:reativar-categoria',
  PRODUTOS_CRIAR_PRODUTO: 'produtos:criar-produto',
  PRODUTOS_LISTAR_PRODUTOS: 'produtos:listar-produtos',
  PRODUTOS_BUSCAR_PRODUTOS: 'produtos:buscar-produtos',
  PRODUTOS_ATUALIZAR_PRODUTO: 'produtos:atualizar-produto',
  PRODUTOS_INATIVAR_PRODUTO: 'produtos:inativar-produto',
  PRODUTOS_REATIVAR_PRODUTO: 'produtos:reativar-produto',
  PRODUTOS_OBTER_PRODUTO_POR_ID: 'produtos:obter-produto-por-id',
} as const

export type CanalIpc = (typeof CANAIS_IPC)[keyof typeof CANAIS_IPC]
