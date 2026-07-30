CREATE TABLE IF NOT EXISTS mesa (
  id TEXT PRIMARY KEY NOT NULL,
  numero INTEGER NOT NULL,
  nome TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'LIVRE',
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pedido (
  id TEXT PRIMARY KEY NOT NULL,
  sessao_caixa_id TEXT NOT NULL,
  mesa_id TEXT,
  tipo TEXT NOT NULL,
  status TEXT NOT NULL,
  subtotal_centavos INTEGER NOT NULL DEFAULT 0,
  desconto_centavos INTEGER NOT NULL DEFAULT 0,
  total_centavos INTEGER NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL,
  finalizado_em TEXT,
  cancelado_em TEXT,
  FOREIGN KEY (sessao_caixa_id) REFERENCES sessao_caixa (id),
  FOREIGN KEY (mesa_id) REFERENCES mesa (id)
);

CREATE INDEX IF NOT EXISTS idx_pedido_status ON pedido (status);
CREATE INDEX IF NOT EXISTS idx_pedido_mesa ON pedido (mesa_id);

CREATE TABLE IF NOT EXISTS pedido_item (
  id TEXT PRIMARY KEY NOT NULL,
  pedido_id TEXT NOT NULL,
  produto_id TEXT NOT NULL,
  produto_nome TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  preco_unitario_centavos INTEGER NOT NULL,
  total_centavos INTEGER NOT NULL,
  observacao TEXT,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL,
  cancelado_em TEXT,
  FOREIGN KEY (pedido_id) REFERENCES pedido (id),
  FOREIGN KEY (produto_id) REFERENCES produto (id)
);

CREATE INDEX IF NOT EXISTS idx_pedido_item_pedido ON pedido_item (pedido_id);
