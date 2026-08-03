-- Schema final de pedido_entrega apos migracao 12.
-- Taxa padrao: app_metadata.chave = 'taxa_entrega_padrao_centavos'
-- Taxa do pedido: pedido.taxa_entrega_centavos

CREATE TABLE IF NOT EXISTS pedido_entrega (
  id TEXT PRIMARY KEY NOT NULL,
  pedido_id TEXT NOT NULL UNIQUE,
  cliente_nome TEXT NOT NULL,
  telefone TEXT,
  observacao TEXT,
  status TEXT NOT NULL DEFAULT 'AGUARDANDO_PREPARO',
  saiu_para_entrega_em TEXT,
  entregue_em TEXT,
  cancelado_em TEXT,
  motivo_cancelamento TEXT,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedido (id)
);
