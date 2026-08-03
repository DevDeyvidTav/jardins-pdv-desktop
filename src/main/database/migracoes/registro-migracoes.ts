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
  {
    versao: 3,
    nome: '0003-criar-movimento-caixa',
    sql: `
CREATE TABLE IF NOT EXISTS movimento_caixa (
  id TEXT PRIMARY KEY NOT NULL,
  sessao_caixa_id TEXT NOT NULL,
  tipo TEXT NOT NULL,
  valor_centavos INTEGER NOT NULL,
  descricao TEXT,
  origem TEXT NOT NULL,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL,
  FOREIGN KEY (sessao_caixa_id) REFERENCES sessao_caixa (id)
);

CREATE INDEX IF NOT EXISTS idx_movimento_caixa_sessao
  ON movimento_caixa (sessao_caixa_id, criado_em);
`.trim(),
  },
  {
    versao: 4,
    nome: '0004-adicionar-fechamento-sessao-caixa',
    sql: `
ALTER TABLE sessao_caixa ADD COLUMN saldo_final_informado_centavos INTEGER;
ALTER TABLE sessao_caixa ADD COLUMN saldo_final_esperado_centavos INTEGER;
ALTER TABLE sessao_caixa ADD COLUMN diferenca_centavos INTEGER;
ALTER TABLE sessao_caixa ADD COLUMN observacao_fechamento TEXT;
`.trim(),
  },
  {
    versao: 5,
    nome: '0005-criar-categoria-produto-e-produto',
    sql: `
CREATE TABLE IF NOT EXISTS categoria_produto (
  id TEXT PRIMARY KEY NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS produto (
  id TEXT PRIMARY KEY NOT NULL,
  categoria_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco_centavos INTEGER NOT NULL,
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL,
  FOREIGN KEY (categoria_id) REFERENCES categoria_produto (id)
);

CREATE INDEX IF NOT EXISTS idx_produto_categoria
  ON produto (categoria_id);

CREATE INDEX IF NOT EXISTS idx_produto_ativo
  ON produto (ativo);
`.trim(),
  },
  {
    versao: 6,
    nome: '0006-criar-mesa-pedido-e-pedido-item',
    sql: `
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
`.trim(),
  },
  {
    versao: 7,
    nome: '0007-criar-pagamento-pedido',
    sql: `
CREATE TABLE IF NOT EXISTS pagamento_pedido (
  id TEXT PRIMARY KEY NOT NULL,
  pedido_id TEXT NOT NULL,
  sessao_caixa_id TEXT NOT NULL,
  forma_pagamento TEXT NOT NULL,
  valor_centavos INTEGER NOT NULL,
  status TEXT NOT NULL,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL,
  cancelado_em TEXT,
  FOREIGN KEY (pedido_id) REFERENCES pedido (id),
  FOREIGN KEY (sessao_caixa_id) REFERENCES sessao_caixa (id)
);

CREATE INDEX IF NOT EXISTS idx_pagamento_pedido_pedido ON pagamento_pedido (pedido_id);
CREATE INDEX IF NOT EXISTS idx_pagamento_pedido_sessao ON pagamento_pedido (sessao_caixa_id);
`.trim(),
  },
  {
    versao: 8,
    nome: '0008-ajustar-descontos-e-valores-pedido',
    sql: `
ALTER TABLE pedido_item ADD COLUMN subtotal_centavos INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pedido_item ADD COLUMN desconto_centavos INTEGER NOT NULL DEFAULT 0;

UPDATE pedido_item
SET subtotal_centavos = total_centavos,
    desconto_centavos = 0
WHERE subtotal_centavos = 0;

ALTER TABLE pedido ADD COLUMN desconto_itens_centavos INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pedido ADD COLUMN desconto_pedido_centavos INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pedido ADD COLUMN valor_pago_centavos INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pedido ADD COLUMN valor_cortesia_centavos INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pedido ADD COLUMN valor_restante_centavos INTEGER NOT NULL DEFAULT 0;

UPDATE pedido
SET desconto_pedido_centavos = desconto_centavos,
    valor_restante_centavos = total_centavos
WHERE valor_restante_centavos = 0;
`.trim(),
  },
  {
    versao: 9,
    nome: '0009-adicionar-motivo-cortesia-pagamento',
    sql: `
ALTER TABLE pagamento_pedido ADD COLUMN motivo_cortesia TEXT;
`.trim(),
  },
  {
    versao: 10,
    nome: '0010-adicionar-motivo-cancelamento',
    sql: `
ALTER TABLE pedido ADD COLUMN motivo_cancelamento TEXT;
ALTER TABLE pedido_item ADD COLUMN motivo_cancelamento TEXT;
`.trim(),
  },
  {
    versao: 11,
    nome: '0011-delivery-taxa-entrega',
    sql: `
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
`.trim(),
  },
  {
    versao: 12,
    nome: '0012-simplificar-pedido-entrega-e-taxa-padrao',
    sql: `
CREATE TABLE pedido_entrega_v12 (
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

INSERT INTO pedido_entrega_v12 (
  id, pedido_id, cliente_nome, telefone, observacao, status,
  saiu_para_entrega_em, entregue_em, cancelado_em, motivo_cancelamento,
  criado_em, atualizado_em
)
SELECT
  id, pedido_id, cliente_nome, telefone, NULL, status,
  saiu_para_entrega_em, entregue_em, cancelado_em, motivo_cancelamento,
  criado_em, atualizado_em
FROM pedido_entrega;

DROP TABLE pedido_entrega;

ALTER TABLE pedido_entrega_v12 RENAME TO pedido_entrega;

CREATE INDEX IF NOT EXISTS idx_pedido_entrega_status
  ON pedido_entrega (status);

CREATE INDEX IF NOT EXISTS idx_pedido_entrega_pedido
  ON pedido_entrega (pedido_id);

INSERT INTO app_metadata (chave, valor, criado_em, atualizado_em)
VALUES (
  'taxa_entrega_padrao_centavos',
  '0',
  datetime('now'),
  datetime('now')
)
ON CONFLICT(chave) DO NOTHING;
`.trim(),
  },
  {
    versao: 13,
    nome: '0013-transferencia-e-agrupamento-mesas',
    sql: `
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
`.trim(),
  },
]
