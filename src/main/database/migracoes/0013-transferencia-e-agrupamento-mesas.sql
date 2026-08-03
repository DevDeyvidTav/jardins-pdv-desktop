-- Historico: transferencia e agrupamento de mesas (versao 13).
ALTER TABLE pedido ADD COLUMN mesa_agrupamento_id TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_pedido_mesa_agrupamento
  ON pedido (mesa_agrupamento_id);

CREATE TABLE IF NOT EXISTS mesa_agrupamento (
  id TEXT PRIMARY KEY NOT NULL,
  pedido_id TEXT NOT NULL UNIQUE,
  mesa_principal_id TEXT NOT NULL,
  status TEXT NOT NULL,
  criado_em TEXT NOT NULL,
  encerrado_em TEXT,
  motivo_encerramento TEXT,
  FOREIGN KEY (pedido_id) REFERENCES pedido (id),
  FOREIGN KEY (mesa_principal_id) REFERENCES mesa (id)
);

CREATE TABLE IF NOT EXISTS mesa_agrupada (
  id TEXT PRIMARY KEY NOT NULL,
  mesa_agrupamento_id TEXT NOT NULL,
  mesa_id TEXT NOT NULL,
  eh_principal INTEGER NOT NULL DEFAULT 0,
  adicionada_em TEXT NOT NULL,
  removida_em TEXT,
  FOREIGN KEY (mesa_agrupamento_id) REFERENCES mesa_agrupamento (id),
  FOREIGN KEY (mesa_id) REFERENCES mesa (id),
  UNIQUE (mesa_agrupamento_id, mesa_id)
);

CREATE INDEX IF NOT EXISTS idx_mesa_agrupada_agrupamento
  ON mesa_agrupada (mesa_agrupamento_id);

CREATE INDEX IF NOT EXISTS idx_mesa_agrupada_mesa
  ON mesa_agrupada (mesa_id);

CREATE TABLE IF NOT EXISTS pedido_mesa_movimentacao (
  id TEXT PRIMARY KEY NOT NULL,
  pedido_id TEXT NOT NULL,
  tipo TEXT NOT NULL,
  mesa_origem_id TEXT,
  mesa_destino_id TEXT,
  mesa_agrupamento_id TEXT,
  dados_antes_json TEXT NOT NULL,
  dados_depois_json TEXT NOT NULL,
  motivo TEXT,
  operador_id TEXT,
  criado_em TEXT NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedido (id),
  FOREIGN KEY (mesa_origem_id) REFERENCES mesa (id),
  FOREIGN KEY (mesa_destino_id) REFERENCES mesa (id),
  FOREIGN KEY (mesa_agrupamento_id) REFERENCES mesa_agrupamento (id)
);

CREATE INDEX IF NOT EXISTS idx_pedido_mesa_movimentacao_pedido
  ON pedido_mesa_movimentacao (pedido_id);

CREATE INDEX IF NOT EXISTS idx_pedido_mesa_movimentacao_criado
  ON pedido_mesa_movimentacao (criado_em);
