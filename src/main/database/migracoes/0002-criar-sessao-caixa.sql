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
