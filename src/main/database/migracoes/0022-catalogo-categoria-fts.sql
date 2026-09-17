-- Full-text search (FTS5) para categorias de produto e pizza no PDV.
-- Equivalente ao indice GIN do PostgreSQL usado na API.

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
