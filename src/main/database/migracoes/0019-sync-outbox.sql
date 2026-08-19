CREATE TABLE IF NOT EXISTS sync_outbox (
  id TEXT PRIMARY KEY NOT NULL,
  entidade TEXT NOT NULL,
  entidade_id TEXT NOT NULL,
  operacao TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDENTE',
  tentativas INTEGER NOT NULL DEFAULT 0,
  proxima_tentativa_em TEXT,
  ultimo_erro TEXT,
  criado_em TEXT NOT NULL,
  sincronizado_em TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_outbox_status_criado
  ON sync_outbox (status, criado_em);

CREATE INDEX IF NOT EXISTS idx_sync_outbox_entidade
  ON sync_outbox (entidade, entidade_id);
