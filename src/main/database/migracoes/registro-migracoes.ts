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
  {
    versao: 14,
    nome: '0014-divisao-conta-por-valor',
    sql: `
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
`.trim(),
  },
  {
    versao: 15,
    nome: '0015-pizzas-catalogo-e-pedido-item',
    sql: `
CREATE TABLE IF NOT EXISTS pizza_categoria (
  id TEXT PRIMARY KEY NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  regra_precificacao TEXT NOT NULL,
  ativa INTEGER NOT NULL DEFAULT 1,
  ordem INTEGER NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pizza_tamanho (
  id TEXT PRIMARY KEY NOT NULL,
  nome TEXT NOT NULL,
  sigla TEXT NOT NULL UNIQUE,
  maximo_sabores INTEGER NOT NULL,
  ativa INTEGER NOT NULL DEFAULT 1,
  ordem INTEGER NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pizza_sabor (
  id TEXT PRIMARY KEY NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativa INTEGER NOT NULL DEFAULT 1,
  ordem INTEGER NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pizza_categoria_sabor (
  pizza_categoria_id TEXT NOT NULL,
  pizza_sabor_id TEXT NOT NULL,
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL,
  PRIMARY KEY (pizza_categoria_id, pizza_sabor_id),
  FOREIGN KEY (pizza_categoria_id) REFERENCES pizza_categoria (id),
  FOREIGN KEY (pizza_sabor_id) REFERENCES pizza_sabor (id)
);

CREATE TABLE IF NOT EXISTS pizza_sabor_preco (
  id TEXT PRIMARY KEY NOT NULL,
  pizza_sabor_id TEXT NOT NULL,
  pizza_tamanho_id TEXT NOT NULL,
  valor_centavos INTEGER NOT NULL,
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL,
  UNIQUE (pizza_sabor_id, pizza_tamanho_id),
  FOREIGN KEY (pizza_sabor_id) REFERENCES pizza_sabor (id),
  FOREIGN KEY (pizza_tamanho_id) REFERENCES pizza_tamanho (id)
);

CREATE TABLE IF NOT EXISTS pizza_pedido_item (
  id TEXT PRIMARY KEY NOT NULL,
  pedido_item_id TEXT NOT NULL UNIQUE,
  pizza_categoria_id TEXT NOT NULL,
  pizza_tamanho_id TEXT NOT NULL,
  regra_precificacao_snapshot TEXT NOT NULL,
  valor_calculado_centavos INTEGER NOT NULL,
  observacao TEXT,
  categoria_nome_snapshot TEXT NOT NULL,
  tamanho_nome_snapshot TEXT NOT NULL,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL,
  FOREIGN KEY (pedido_item_id) REFERENCES pedido_item (id)
);

CREATE TABLE IF NOT EXISTS pizza_pedido_item_sabor (
  id TEXT PRIMARY KEY NOT NULL,
  pizza_pedido_item_id TEXT NOT NULL,
  pizza_sabor_id TEXT NOT NULL,
  sabor_nome_snapshot TEXT NOT NULL,
  valor_sabor_snapshot_centavos INTEGER NOT NULL,
  ordem INTEGER NOT NULL,
  criado_em TEXT NOT NULL,
  UNIQUE (pizza_pedido_item_id, pizza_sabor_id),
  FOREIGN KEY (pizza_pedido_item_id) REFERENCES pizza_pedido_item (id)
);

CREATE INDEX IF NOT EXISTS idx_pizza_sabor_preco_sabor
  ON pizza_sabor_preco (pizza_sabor_id);

CREATE INDEX IF NOT EXISTS idx_pizza_pedido_item_pedido_item
  ON pizza_pedido_item (pedido_item_id);

CREATE TABLE pedido_item_v15 (
  id TEXT PRIMARY KEY NOT NULL,
  pedido_id TEXT NOT NULL,
  produto_id TEXT,
  tipo TEXT NOT NULL DEFAULT 'PRODUTO',
  produto_nome TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  preco_unitario_centavos INTEGER NOT NULL,
  subtotal_centavos INTEGER NOT NULL DEFAULT 0,
  desconto_centavos INTEGER NOT NULL DEFAULT 0,
  total_centavos INTEGER NOT NULL,
  observacao TEXT,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL,
  cancelado_em TEXT,
  motivo_cancelamento TEXT,
  FOREIGN KEY (pedido_id) REFERENCES pedido (id),
  FOREIGN KEY (produto_id) REFERENCES produto (id)
);

INSERT INTO pedido_item_v15 (
  id, pedido_id, produto_id, tipo, produto_nome, quantidade,
  preco_unitario_centavos, subtotal_centavos, desconto_centavos, total_centavos,
  observacao, criado_em, atualizado_em, cancelado_em, motivo_cancelamento
)
SELECT
  id, pedido_id, produto_id, 'PRODUTO', produto_nome, quantidade,
  preco_unitario_centavos,
  COALESCE(subtotal_centavos, total_centavos),
  COALESCE(desconto_centavos, 0),
  total_centavos,
  observacao, criado_em, atualizado_em, cancelado_em, motivo_cancelamento
FROM pedido_item;

DROP TABLE pedido_item;
ALTER TABLE pedido_item_v15 RENAME TO pedido_item;

CREATE INDEX IF NOT EXISTS idx_pedido_item_pedido
  ON pedido_item (pedido_id);

INSERT INTO pizza_tamanho (
  id, nome, sigla, maximo_sabores, ativa, ordem, criado_em, atualizado_em
) VALUES
  ('pizza-tamanho-p', 'Pequena', 'P', 2, 1, 1, datetime('now'), datetime('now')),
  ('pizza-tamanho-m', 'Media', 'M', 2, 1, 2, datetime('now'), datetime('now')),
  ('pizza-tamanho-g', 'Grande', 'G', 3, 1, 3, datetime('now'), datetime('now'));
`.trim(),
  },
  {
    versao: 16,
    nome: '0016-pedido-referencia',
    sql: `
ALTER TABLE pedido ADD COLUMN referencia INTEGER;

UPDATE pedido
SET referencia = (
  SELECT COUNT(*)
  FROM pedido AS anterior
  WHERE anterior.criado_em < pedido.criado_em
     OR (anterior.criado_em = pedido.criado_em AND anterior.id <= pedido.id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pedido_referencia
  ON pedido (referencia);

CREATE TRIGGER IF NOT EXISTS trg_pedido_referencia_auto
AFTER INSERT ON pedido
FOR EACH ROW
WHEN NEW.referencia IS NULL
BEGIN
  UPDATE pedido
  SET referencia = (
    SELECT COALESCE(MAX(referencia), 0) + 1
    FROM pedido
    WHERE id != NEW.id
  )
  WHERE id = NEW.id;
END;
`.trim(),
  },
  {
    versao: 17,
    nome: '0017-pagamento-fk-divisao-parte',
    sql: `
CREATE TABLE pagamento_pedido_v17 (
  id TEXT PRIMARY KEY NOT NULL,
  pedido_id TEXT NOT NULL,
  sessao_caixa_id TEXT NOT NULL,
  forma_pagamento TEXT NOT NULL,
  valor_centavos INTEGER NOT NULL,
  status TEXT NOT NULL,
  motivo_cortesia TEXT,
  pedido_divisao_parte_id TEXT,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL,
  cancelado_em TEXT,
  FOREIGN KEY (pedido_id) REFERENCES pedido (id),
  FOREIGN KEY (sessao_caixa_id) REFERENCES sessao_caixa (id),
  FOREIGN KEY (pedido_divisao_parte_id) REFERENCES pedido_divisao_parte (id)
);

INSERT INTO pagamento_pedido_v17 (
  id, pedido_id, sessao_caixa_id, forma_pagamento, valor_centavos, status,
  motivo_cortesia, pedido_divisao_parte_id, criado_em, atualizado_em, cancelado_em
)
SELECT
  id, pedido_id, sessao_caixa_id, forma_pagamento, valor_centavos, status,
  motivo_cortesia, pedido_divisao_parte_id, criado_em, atualizado_em, cancelado_em
FROM pagamento_pedido;

DROP TABLE pagamento_pedido;
ALTER TABLE pagamento_pedido_v17 RENAME TO pagamento_pedido;

CREATE INDEX IF NOT EXISTS idx_pagamento_pedido_pedido
  ON pagamento_pedido (pedido_id);

CREATE INDEX IF NOT EXISTS idx_pagamento_pedido_sessao
  ON pagamento_pedido (sessao_caixa_id);

CREATE INDEX IF NOT EXISTS idx_pagamento_pedido_divisao_parte
  ON pagamento_pedido (pedido_divisao_parte_id);
`.trim(),
  },
  {
    versao: 18,
    nome: '0018-clientes-talao-pagamentos',
    sql: `
CREATE TABLE IF NOT EXISTS cliente (
  id TEXT PRIMARY KEY NOT NULL,
  nome TEXT NOT NULL,
  telefone TEXT,
  documento TEXT,
  endereco TEXT,
  libera_talao INTEGER NOT NULL DEFAULT 0,
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cliente_nome ON cliente (nome);
CREATE INDEX IF NOT EXISTS idx_cliente_ativo ON cliente (ativo);

CREATE TABLE IF NOT EXISTS talao_baixa (
  id TEXT PRIMARY KEY NOT NULL,
  cliente_id TEXT NOT NULL,
  sessao_caixa_id TEXT NOT NULL,
  forma_pagamento TEXT NOT NULL,
  valor_centavos INTEGER NOT NULL,
  competencia TEXT NOT NULL,
  observacao TEXT,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL,
  FOREIGN KEY (cliente_id) REFERENCES cliente (id),
  FOREIGN KEY (sessao_caixa_id) REFERENCES sessao_caixa (id)
);

CREATE INDEX IF NOT EXISTS idx_talao_baixa_cliente_competencia
  ON talao_baixa (cliente_id, competencia);
CREATE INDEX IF NOT EXISTS idx_talao_baixa_sessao
  ON talao_baixa (sessao_caixa_id, criado_em);

ALTER TABLE pedido ADD COLUMN cliente_id TEXT REFERENCES cliente (id);
CREATE INDEX IF NOT EXISTS idx_pedido_cliente ON pedido (cliente_id);

ALTER TABLE pedido_entrega ADD COLUMN endereco TEXT;

UPDATE pagamento_pedido
SET forma_pagamento = 'PIX_MAQUINETA'
WHERE forma_pagamento = 'PIX';
`.trim(),
  },
  {
    versao: 19,
    nome: '0019-sync-outbox',
    sql: `
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
`.trim(),
  },
  {
    versao: 20,
    nome: '0020-troco-dinheiro',
    sql: `
ALTER TABLE pagamento_pedido ADD COLUMN valor_recebido_centavos INTEGER;
ALTER TABLE pagamento_pedido ADD COLUMN troco_centavos INTEGER NOT NULL DEFAULT 0;

ALTER TABLE talao_baixa ADD COLUMN valor_recebido_centavos INTEGER;
ALTER TABLE talao_baixa ADD COLUMN troco_centavos INTEGER NOT NULL DEFAULT 0;
`.trim(),
  },
  {
    versao: 21,
    nome: '0021-produto-fiscal-simples-nacional',
    sql: `
ALTER TABLE produto ADD COLUMN fiscal_ncm TEXT;
ALTER TABLE produto ADD COLUMN fiscal_cest TEXT;
ALTER TABLE produto ADD COLUMN fiscal_cfop TEXT NOT NULL DEFAULT '5102';
ALTER TABLE produto ADD COLUMN fiscal_icms_origem INTEGER NOT NULL DEFAULT 0;
ALTER TABLE produto ADD COLUMN fiscal_icms_csosn TEXT NOT NULL DEFAULT '102';
ALTER TABLE produto ADD COLUMN fiscal_pis_cst TEXT NOT NULL DEFAULT '07';
ALTER TABLE produto ADD COLUMN fiscal_cofins_cst TEXT NOT NULL DEFAULT '07';
ALTER TABLE produto ADD COLUMN fiscal_aliquota_nacional REAL;
`.trim(),
  },
  {
    versao: 22,
    nome: '0022-catalogo-categoria-fts',
    sql: `
CREATE VIRTUAL TABLE IF NOT EXISTS catalogo_categoria_fts USING fts5(
  nome,
  id UNINDEXED,
  tipo UNINDEXED,
  ativo UNINDEXED,
  tokenize = 'unicode61 remove_diacritics 2'
);

INSERT INTO catalogo_categoria_fts (id, tipo, ativo, nome)
SELECT id, 'produto', ativo, nome FROM categoria_produto;

INSERT INTO catalogo_categoria_fts (id, tipo, ativo, nome)
SELECT id, 'pizza', ativa, nome FROM pizza_categoria;

CREATE TRIGGER IF NOT EXISTS trg_categoria_produto_fts_ai
AFTER INSERT ON categoria_produto BEGIN
  INSERT INTO catalogo_categoria_fts (id, tipo, ativo, nome)
  VALUES (NEW.id, 'produto', NEW.ativo, NEW.nome);
END;

CREATE TRIGGER IF NOT EXISTS trg_categoria_produto_fts_ad
AFTER DELETE ON categoria_produto BEGIN
  DELETE FROM catalogo_categoria_fts WHERE id = OLD.id AND tipo = 'produto';
END;

CREATE TRIGGER IF NOT EXISTS trg_categoria_produto_fts_au
AFTER UPDATE ON categoria_produto BEGIN
  DELETE FROM catalogo_categoria_fts WHERE id = OLD.id AND tipo = 'produto';
  INSERT INTO catalogo_categoria_fts (id, tipo, ativo, nome)
  VALUES (NEW.id, 'produto', NEW.ativo, NEW.nome);
END;

CREATE TRIGGER IF NOT EXISTS trg_pizza_categoria_fts_ai
AFTER INSERT ON pizza_categoria BEGIN
  INSERT INTO catalogo_categoria_fts (id, tipo, ativo, nome)
  VALUES (NEW.id, 'pizza', NEW.ativa, NEW.nome);
END;

CREATE TRIGGER IF NOT EXISTS trg_pizza_categoria_fts_ad
AFTER DELETE ON pizza_categoria BEGIN
  DELETE FROM catalogo_categoria_fts WHERE id = OLD.id AND tipo = 'pizza';
END;

CREATE TRIGGER IF NOT EXISTS trg_pizza_categoria_fts_au
AFTER UPDATE ON pizza_categoria BEGIN
  DELETE FROM catalogo_categoria_fts WHERE id = OLD.id AND tipo = 'pizza';
  INSERT INTO catalogo_categoria_fts (id, tipo, ativo, nome)
  VALUES (NEW.id, 'pizza', NEW.ativa, NEW.nome);
END;
`.trim(),
  },
  {
    versao: 23,
    nome: '0023-pedido-fiscal-nfce',
    sql: `
ALTER TABLE pedido ADD COLUMN fiscal_solicitado INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pedido ADD COLUMN fiscal_cpf_destinatario TEXT;

ALTER TABLE pedido_item ADD COLUMN fiscal_ncm TEXT;
ALTER TABLE pedido_item ADD COLUMN fiscal_cfop TEXT;
ALTER TABLE pedido_item ADD COLUMN fiscal_icms_origem INTEGER;
ALTER TABLE pedido_item ADD COLUMN fiscal_icms_csosn TEXT;
ALTER TABLE pedido_item ADD COLUMN fiscal_pis_cst TEXT;
ALTER TABLE pedido_item ADD COLUMN fiscal_cofins_cst TEXT;

CREATE TABLE IF NOT EXISTS documento_fiscal (
  id TEXT PRIMARY KEY NOT NULL,
  pedido_id TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL,
  status TEXT NOT NULL,
  numero INTEGER,
  serie INTEGER,
  chave_acesso TEXT,
  protocolo_autorizacao TEXT,
  qr_code TEXT,
  xml_url TEXT,
  danfe_url TEXT,
  valor_total TEXT NOT NULL,
  codigo_rejeicao TEXT,
  mensagem_rejeicao TEXT,
  impresso_em TEXT,
  autorizado_em TEXT,
  cancelado_em TEXT,
  atualizado_em TEXT NOT NULL,
  criado_em TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_documento_fiscal_status
  ON documento_fiscal (status);
`.trim(),
  },
  {
    versao: 24,
    nome: '0024-config-impressora-setor-categoria',
    sql: `
ALTER TABLE categoria_produto ADD COLUMN setor_impressao TEXT;

CREATE TABLE IF NOT EXISTS config_impressora (
  id TEXT PRIMARY KEY NOT NULL,
  setor TEXT NOT NULL UNIQUE,
  nome_impressora TEXT NOT NULL,
  porta_com TEXT
);
`.trim(),
  },
  {
    versao: 25,
    nome: '0025-operador-usuario-perfis',
    sql: `
CREATE TABLE IF NOT EXISTS operador_usuario (
  id TEXT PRIMARY KEY NOT NULL,
  nome TEXT NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL,
  perfil TEXT NOT NULL CHECK (perfil IN ('ADMIN', 'OPERADOR')),
      ativo INTEGER NOT NULL DEFAULT 1,
      criado_em TEXT NOT NULL,
      atualizado_em TEXT NOT NULL
    );
`.trim(),
  },
  {
    versao: 26,
    nome: '0026-auditoria-evento',
    sql: `
CREATE TABLE IF NOT EXISTS auditoria_evento (
  id TEXT PRIMARY KEY NOT NULL,
  origem TEXT NOT NULL,
  acao TEXT NOT NULL,
  ator_tipo TEXT NOT NULL,
  ator_id TEXT,
  ator_nome TEXT NOT NULL,
  perfil TEXT,
  entidade TEXT,
  entidade_id TEXT,
  resumo TEXT NOT NULL,
  detalhes_json TEXT,
  criado_em TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auditoria_evento_criado
  ON auditoria_evento (criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_auditoria_evento_acao
  ON auditoria_evento (acao, criado_em DESC);
`.trim(),
  },
]
