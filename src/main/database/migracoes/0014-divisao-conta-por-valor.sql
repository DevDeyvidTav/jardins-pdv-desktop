-- Historico: divisao de conta por valor (versao 14).
CREATE TABLE IF NOT EXISTS pedido_divisao_conta (
  id TEXT PRIMARY KEY NOT NULL,
  pedido_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  valor_total_centavos INTEGER NOT NULL,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL,
  cancelado_em TEXT,
  motivo_cancelamento TEXT,
  FOREIGN KEY (pedido_id) REFERENCES pedido (id)
);

CREATE INDEX IF NOT EXISTS idx_pedido_divisao_conta_pedido
  ON pedido_divisao_conta (pedido_id);

CREATE INDEX IF NOT EXISTS idx_pedido_divisao_conta_status
  ON pedido_divisao_conta (status);

CREATE TABLE IF NOT EXISTS pedido_divisao_parte (
  id TEXT PRIMARY KEY NOT NULL,
  pedido_divisao_conta_id TEXT NOT NULL,
  identificacao TEXT NOT NULL,
  valor_definido_centavos INTEGER NOT NULL,
  status TEXT NOT NULL,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL,
  quitado_em TEXT,
  FOREIGN KEY (pedido_divisao_conta_id) REFERENCES pedido_divisao_conta (id)
);

CREATE INDEX IF NOT EXISTS idx_pedido_divisao_parte_divisao
  ON pedido_divisao_parte (pedido_divisao_conta_id);

CREATE INDEX IF NOT EXISTS idx_pedido_divisao_parte_status
  ON pedido_divisao_parte (status);

ALTER TABLE pagamento_pedido ADD COLUMN pedido_divisao_parte_id TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_pagamento_pedido_divisao_parte
  ON pagamento_pedido (pedido_divisao_parte_id);

CREATE TABLE IF NOT EXISTS pedido_divisao_movimentacao (
  id TEXT PRIMARY KEY NOT NULL,
  pedido_id TEXT NOT NULL,
  pedido_divisao_conta_id TEXT NOT NULL,
  pedido_divisao_parte_id TEXT,
  tipo TEXT NOT NULL,
  dados_antes_json TEXT NOT NULL,
  dados_depois_json TEXT NOT NULL,
  motivo TEXT,
  operador_id TEXT,
  criado_em TEXT NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedido (id),
  FOREIGN KEY (pedido_divisao_conta_id) REFERENCES pedido_divisao_conta (id),
  FOREIGN KEY (pedido_divisao_parte_id) REFERENCES pedido_divisao_parte (id)
);

CREATE INDEX IF NOT EXISTS idx_pedido_divisao_movimentacao_pedido
  ON pedido_divisao_movimentacao (pedido_id);

CREATE INDEX IF NOT EXISTS idx_pedido_divisao_movimentacao_divisao
  ON pedido_divisao_movimentacao (pedido_divisao_conta_id);
