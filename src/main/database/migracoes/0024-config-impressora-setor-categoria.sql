ALTER TABLE categoria_produto ADD COLUMN setor_impressao TEXT;

CREATE TABLE IF NOT EXISTS config_impressora (
  id TEXT PRIMARY KEY NOT NULL,
  setor TEXT NOT NULL UNIQUE,
  nome_impressora TEXT NOT NULL,
  porta_com TEXT
);
