export interface MigracaoSql {
  versao: number
  nome: string
  sql: string
}

export const REGISTRO_MIGRACOES: MigracaoSql[] = [
  {
    versao: 1,
    nome: '0001-criar-app-metadata',
    sql: `
CREATE TABLE IF NOT EXISTS app_metadata (
  chave TEXT PRIMARY KEY NOT NULL,
  valor TEXT NOT NULL,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL
);
`.trim(),
  },
  {
    versao: 2,
    nome: '0002-criar-sessao-caixa',
    sql: `
CREATE TABLE IF NOT EXISTS sessao_caixa (
  id TEXT PRIMARY KEY NOT NULL,
  operador_id TEXT NOT NULL,
  operador_nome TEXT NOT NULL,
  saldo_inicial_centavos INTEGER NOT NULL,
  status TEXT NOT NULL,
  aberto_em TEXT NOT NULL,
  fechado_em TEXT,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sessao_caixa_unica_aberta
  ON sessao_caixa (status)
  WHERE status = 'ABERTO';
`.trim(),
  },
]
