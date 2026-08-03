-- Historico: schema original da versao 11.
-- A versao 12 simplifica pedido_entrega (sem endereco) e grava taxa padrao em app_metadata.
ALTER TABLE pedido ADD COLUMN taxa_entrega_centavos INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS pedido_entrega (
  id TEXT PRIMARY KEY NOT NULL,
  pedido_id TEXT NOT NULL UNIQUE,

  cliente_nome TEXT NOT NULL,
  telefone TEXT NOT NULL,

  cep TEXT,
  logradouro TEXT NOT NULL,
  numero TEXT NOT NULL,
  complemento TEXT,
  bairro TEXT NOT NULL,
  cidade TEXT NOT NULL,
  uf TEXT NOT NULL,
  referencia TEXT,

  status TEXT NOT NULL DEFAULT 'AGUARDANDO_PREPARO',
  saiu_para_entrega_em TEXT,
  entregue_em TEXT,
  cancelado_em TEXT,
  motivo_cancelamento TEXT,

  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL,

  FOREIGN KEY (pedido_id) REFERENCES pedido (id)
);

CREATE INDEX IF NOT EXISTS idx_pedido_entrega_status
  ON pedido_entrega (status);

CREATE INDEX IF NOT EXISTS idx_pedido_entrega_pedido
  ON pedido_entrega (pedido_id);
