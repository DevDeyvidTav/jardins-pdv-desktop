ALTER TABLE sessao_caixa ADD COLUMN saldo_final_informado_centavos INTEGER;
ALTER TABLE sessao_caixa ADD COLUMN saldo_final_esperado_centavos INTEGER;
ALTER TABLE sessao_caixa ADD COLUMN diferenca_centavos INTEGER;
ALTER TABLE sessao_caixa ADD COLUMN observacao_fechamento TEXT;
