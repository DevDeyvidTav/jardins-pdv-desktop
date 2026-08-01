# Layout de produtos e caixa

Padrao visual e operacional das telas de **Produtos** e **Caixa**, alinhado ao master-detail da tela de Pedidos (`layout-pedidos-mesas.md`).

## Principios

- Uma composicao operacional por tela (nao “dashboard de cards”).
- Toolbar e filtros fixos; **so a lista rola**.
- Densidade alta: linhas compactas, pensadas para muitos registros.
- Formularios de cadastro ficam **colapsados** por padrao e abrem sob demanda.
- Feedback curto e local; sem cards decorativos desnecessarios.

## Produtos — master-detail

```text
+---------------------------+----------------------------------+
| Categorias (~30%)         | Produtos (~70%)                  |
| - Cabecalho + Nova        | - Cabecalho + Novo produto       |
| - Chip "Todas"            | - Busca + filtro categoria       |
| - Lista densa (scroll)    | - Chips Ativos / Todos           |
| - Selecao filtra produtos | - Tabela densa (scroll)          |
+---------------------------+----------------------------------+
```

### Interacao

1. Clicar em uma categoria filtra a lista de produtos a direita.
2. Chip **Todas** limpa o filtro de categoria.
3. **Nova** / **Novo produto** abrem o formulario no proprio painel.
4. Visao **Ativos** (padrao) vs **Todos** (inclui inativos e reativacao).

### Componentes

| Arquivo | Responsabilidade |
|---------|------------------|
| `pages/produtos.page.tsx` | Layout master-detail |
| `components/lista-categorias.tsx` | Lista selecionavel + inativar/reativar |
| `components/lista-produtos.tsx` | Tabela densa de produtos |
| `components/busca-produtos.tsx` | Busca textual + select de categoria |
| `components/formulario-*.tsx` | Cadastro sob demanda |

### Test IDs

| testid | Elemento |
|--------|----------|
| `pagina-produtos` | Tela |
| `painel-categorias` | Coluna esquerda |
| `lista-categorias` / `item-categoria` | Categorias |
| `lista-produtos` / `item-produto` | Produtos |
| `botao-toggle-categoria` / `botao-toggle-produto` | Abrir formularios |
| `filtro-produtos-ativos` / `filtro-produtos-todos` | Visao da lista |

## Caixa — master-detail

```text
+---------------------------+----------------------------------+
| Resumo (~34%)             | Movimentos (~66%)                |
| - Cabecalho + Fechar      | - Cabecalho                      |
| - Cupom financeiro        | - Chips Todos/Supr./Sangria/...  |
| - Novo movimento          | - Tabela densa (scroll)          |
| - Formulario sob demanda  |                                  |
+---------------------------+----------------------------------+
```

### Resumo (estilo cupom)

Exibe em coluna:

- operador, saldo inicial
- suprimentos, sangrias, retiradas
- vendas por forma (dinheiro, credito, debito, Pix)
- total de vendas
- **saldo esperado** em destaque

### Interacao

1. Operador ve o saldo e vendas sem scroll da tela inteira.
2. **Novo movimento** abre o formulario no painel esquerdo.
3. Filtros por tipo reduzem a lista a direita.
4. **Fechar caixa** permanece no cabecalho do painel.

### Componentes

| Arquivo | Responsabilidade |
|---------|------------------|
| `pages/caixa-atual.page.tsx` | Layout master-detail |
| `components/resumo-caixa.tsx` | Cupom financeiro |
| `components/lista-movimentos-caixa.tsx` | Tabela densa |
| `components/formulario-movimento-caixa.tsx` | Lancamento manual |

### Test IDs

| testid | Elemento |
|--------|----------|
| `pagina-caixa-atual` | Tela |
| `painel-resumo-caixa` | Coluna esquerda |
| `resumo-caixa` | Cupom |
| `lista-movimentos-caixa` / `item-movimento-caixa` | Movimentos |
| `botao-toggle-movimento` | Abrir formulario |
| `botao-ir-fechamento` | Ir para fechamento |
| `filtros-tipo-movimento` | Barra de chips |

## Manutencao

Ao crescer o catalogo ou o volume de movimentos:

1. Manter scroll **apenas** nas listas.
2. Evitar voltar ao layout de “card unico central”.
3. Preferir filtros e selecao lateral a paginacao prematura.
4. Atualizar este documento se novos status/filtros forem adicionados.
