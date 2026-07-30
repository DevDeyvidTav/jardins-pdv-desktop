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
