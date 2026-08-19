# PDV Desktop - Especificação Técnica

## Visão Geral

Este documento descreve a arquitetura, estrutura de dados, interfaces e padrões de implementação do sistema PDV Desktop.

---

## Arquitetura

### Layering

```
┌─────────────────────────────────────────────────────────┐
│                   RENDERER (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Pages      │  │   Hooks      │  │ Components   │  │
│  │ (Telas)      │  │ (useCaixa,   │  │ (Reutiliz.)  │  │
│  │              │  │  usePedidos, │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                    ↓ (IPC invoke)                       │
└─────────────────────────────────────────────────────────┘
                    ║
                    ║ Electron IPC
                    ║
└─────────────────────────────────────────────────────────┘
│                    MAIN (Electron)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  IPC         │  │  Use-Cases   │  │ Repositories │  │
│  │ Handlers     │  │ (Lógica)    │  │ (SQLite)     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                    ↓                                    │
│              ┌──────────────┐                           │
│              │   SQLite     │                           │
│              │(better-sqlite3)                          │
│              └──────────────┘                           │
└─────────────────────────────────────────────────────────┘
```

> Persistência, backup, logs e migrations: ver `HARDENING-BANCO-BACKUP-LOGS.md`.
> Banco em `{userData}/pdv-local.sqlite`. Fonte de verdade de módulos: `src/main/modules/`.

### Estrutura de Diretórios

```
apps/desktop/src/
├── main/                      # Processo principal
│   ├── app/                   # Inicialização e ciclo de vida
│   │   ├── criar-janela.ts
│   │   ├── inicializar-aplicacao.ts
│   │   └── servico-informacoes-sistema.ts
│   ├── database/              # Banco de dados
│   │   ├── conexao-sqlite.ts
│   │   ├── inicializar-banco.ts
│   │   └── migracoes/
│   │       ├── 0001-*.sql
│   │       ├── 0002-*.sql
│   │       └── ...
│   ├── compartilhado/         # Utilitários compartilhados
│   │   ├── erros/
│   │   ├── log/
│   │   └── resultado/
│   ├── ipc/                   # Handlers IPC
│   │   ├── registrar-handlers.ts
│   │   └── sistema.ipc.ts
│   └── modules/               # Domínios
│       ├── caixa/
│       ├── mesas/
│       ├── pagamentos/
│       ├── pedidos/
│       └── produtos/
└── renderer/                  # Processo renderer (UI)
    ├── app/                   # App.tsx e navegação
    ├── components/            # Componentes globais
    ├── modules/               # Módulos React
    │   ├── caixa/
    │   ├── pagamentos/
    │   ├── pedidos/
    │   └── produtos/
    └── shared/                # Types compartilhados
```

---

## Banco de Dados

### Migrations

| ID | Tabela(s) | Descrição |
|----|-----------|-----------|
| 0001 | app_metadata | Tabela de metadados do app |
| 0002 | sessao_caixa | Sessão de caixa (abertura) |
| 0003 | movimento_caixa | Movimentos de caixa |
| 0004 | sessao_caixa | Adiciona campos de fechamento |
| 0005 | categoria_produto, produto | Catálogo de produtos |
| 0006 | mesa, pedido, pedido_item, pagamento_pedido | Pedidos e pagamentos |
| 0011 | pedido.taxa_entrega, pedido_entrega | Delivery e taxa de entrega |
| 0012 | pedido_entrega (simplificado), taxa padrao | Campos reduzidos + metadata |
| 0013 | mesa_agrupamento, mesa_agrupada, pedido_mesa_movimentacao, pedido.mesa_agrupamento_id | Transferência e agrupamento de mesas com auditoria imutável |
| 0014 | pedido_divisao_conta, pedido_divisao_parte, pedido_divisao_movimentacao, pagamento_pedido.pedido_divisao_parte_id | Divisão de conta por valor com pagamentos vinculados às partes |
| 0015 | pizza_categoria, pizza_tamanho, pizza_sabor, pizza_categoria_sabor, pizza_sabor_preco, pizza_pedido_item, pizza_pedido_item_sabor; pedido_item.tipo + produto_id nullable | Catálogo de pizzas, composição no pedido e snapshots |

### Transferência e agrupamento (v13)

- Transferência **mantém o mesmo `pedido_id`**; só altera `pedido.mesa_id` e status das mesas.
- Agrupamento usa cabeçalho `mesa_agrupamento` + pivô `mesa_agrupada`; mesa principal fica `OCUPADA`, secundárias `AGRUPADA`.
- Auditoria em `pedido_mesa_movimentacao` (append-only): abertura, transferência, agrupamento, encerramento, finalização e cancelamento.
- Finalizar/cancelar pedido agrupado encerra o agrupamento e libera todas as mesas na mesma transação.
- Operações usam `BEGIN IMMEDIATE` via helpers em `conexao-sqlite` (persistência adiada enquanto a transação está aberta).

### Divisão de conta por valor (v14)

- Camada de organização do pagamento sobre o **mesmo** `pedido_id`; não cria pedidos novos nem move itens.
- `pedido_divisao_conta` (ATIVA | QUITADA | CANCELADA) + `pedido_divisao_parte` (PENDENTE | PARCIALMENTE_PAGA | QUITADA).
- Pagamentos continuam em `pagamento_pedido`, com vínculo opcional `pedido_divisao_parte_id`.
- Enquanto a divisão estiver ATIVA: bloqueia alterações financeiras do pedido e pagamentos “normais” sem parte.
- Cancelamento da divisão só antes do primeiro pagamento vinculado; cancelar o pedido com divisão ativa marca a divisão como CANCELADA preservando histórico.
- Auditoria append-only em `pedido_divisao_movimentacao`.

### Pizzas (v15)

- Catálogo: `pizza_categoria` (regra `MAIOR_SABOR` | `MEDIA_SABORES`), `pizza_tamanho` (máximo de sabores persistido e editável), `pizza_sabor`, vínculo N:N `pizza_categoria_sabor`, preços em centavos em `pizza_sabor_preco` (único por sabor×tamanho).
- Seed inicial de tamanhos: **P** e **M** → máx. 2 sabores; **G** → máx. 3 (ids `pizza-tamanho-p/m/g`). Sem hardcode no domínio/UI.
- Precificação oficial no main (`montarPreviewPizza` / `resolverComposicaoPizza`): `MAIOR_SABOR` = máximo; `MEDIA_SABORES` = `Math.round(soma / n)` em centavos.
- No pedido: pizza vira `pedido_item` oficial com `tipo = PIZZA`, `produto_id` null, quantidade sempre 1; composição em `pizza_pedido_item` + `pizza_pedido_item_sabor` com snapshots de nomes, regra e preços.
- Inclusão em `BEGIN IMMEDIATE`; alterações futuras no catálogo não afetam itens já lançados.
- Divisão ATIVA bloqueia inclusão/remoção de pizza com `ALTERACAO_PIZZA_BLOQUEADA_POR_DIVISAO_ATIVA`.
- UI: Cardápio com abas **Produtos** | **Pizzas**; no pedido **Adicionar produto** / **Adicionar pizza**.

### Schema SQL

```sql
-- app_metadata
CREATE TABLE IF NOT EXISTS app_metadata (
  chave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  criado_em TEXT NOT NULL
);

-- sessao_caixa
CREATE TABLE IF NOT EXISTS sessao_caixa (
  id TEXT PRIMARY KEY NOT NULL,
  operador_id TEXT NOT NULL,
  operador_nome TEXT NOT NULL,
  saldo_inicial_centavos INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'ABERTO',
  aberto_em TEXT NOT NULL,
  fechado_em TEXT,
  saldo_final_informado_centavos INTEGER,
  saldo_final_esperado_centavos INTEGER,
  diferenca_centavos INTEGER,
  observacao_fechamento TEXT,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL
);

-- movimento_caixa
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

-- categoria_produto
CREATE TABLE IF NOT EXISTS categoria_produto (
  id TEXT PRIMARY KEY NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL
);

-- produto
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

-- mesa
CREATE TABLE IF NOT EXISTS mesa (
  id TEXT PRIMARY KEY NOT NULL,
  numero INTEGER NOT NULL,
  nome TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'LIVRE',
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL
);

-- pedido
CREATE TABLE IF NOT EXISTS pedido (
  id TEXT PRIMARY KEY NOT NULL,
  sessao_caixa_id TEXT NOT NULL,
  mesa_id TEXT,
  tipo TEXT NOT NULL,
  status TEXT NOT NULL,
  subtotal_centavos INTEGER NOT NULL DEFAULT 0,
  desconto_itens_centavos INTEGER NOT NULL DEFAULT 0,
  desconto_pedido_centavos INTEGER NOT NULL DEFAULT 0,
  total_centavos INTEGER NOT NULL DEFAULT 0,
  valor_pago_centavos INTEGER NOT NULL DEFAULT 0,
  valor_cortesia_centavos INTEGER NOT NULL DEFAULT 0,
  valor_restante_centavos INTEGER NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL,
  finalizado_em TEXT,
  cancelado_em TEXT,
  motivo_cancelamento TEXT,
  FOREIGN KEY (sessao_caixa_id) REFERENCES sessao_caixa (id),
  FOREIGN KEY (mesa_id) REFERENCES mesa (id)
);

-- pedido_item
CREATE TABLE IF NOT EXISTS pedido_item (
  id TEXT PRIMARY KEY NOT NULL,
  pedido_id TEXT NOT NULL,
  produto_id TEXT,
  tipo TEXT NOT NULL DEFAULT 'PRODUTO',
  produto_nome TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  preco_unitario_centavos INTEGER NOT NULL,
  subtotal_centavos INTEGER NOT NULL,
  desconto_centavos INTEGER NOT NULL,
  total_centavos INTEGER NOT NULL,
  observacao TEXT,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL,
  cancelado_em TEXT,
  motivo_cancelamento TEXT,
  FOREIGN KEY (pedido_id) REFERENCES pedido (id),
  FOREIGN KEY (produto_id) REFERENCES produto (id)
);

-- pizza (catalogo + composicao no pedido — ver migration 0015)
-- pizza_categoria, pizza_tamanho, pizza_sabor, pizza_categoria_sabor,
-- pizza_sabor_preco, pizza_pedido_item, pizza_pedido_item_sabor

-- pagamento_pedido
CREATE TABLE IF NOT EXISTS pagamento_pedido (
  id TEXT PRIMARY KEY NOT NULL,
  pedido_id TEXT NOT NULL,
  sessao_caixa_id TEXT NOT NULL,
  forma_pagamento TEXT NOT NULL,
  valor_centavos INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'CONFIRMADO',
  motivo_cortesia TEXT,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL,
  cancelado_em TEXT,
  FOREIGN KEY (pedido_id) REFERENCES pedido (id),
  FOREIGN KEY (sessao_caixa_id) REFERENCES sessao_caixa (id)
);
```
### Índices

```sql
-- Pedido
CREATE INDEX IF NOT EXISTS idx_pedido_status ON pedido (status);
CREATE INDEX IF NOT EXISTS idx_pedido_mesa ON pedido (mesa_id);

-- Movimento Caixa
CREATE INDEX IF NOT EXISTS idx_movimento_caixa_sessao
  ON movimento_caixa (sessao_caixa_id, criado_em);

-- Produto
CREATE INDEX IF NOT EXISTS idx_produto_categoria
  ON produto (categoria_id);
CREATE INDEX IF NOT EXISTS idx_produto_ativo
  ON produto (ativo);

-- Pedido Item
CREATE INDEX IF NOT EXISTS idx_pedido_item_pedido
  ON pedido_item (pedido_id);
```

---

## Domain Models (TypeScript)

### Sessão de Caixa

```ts
export interface SessaoCaixa {
  id: string
  operadorId: string
  operadorNome: string
  saldoInicialCentavos: number
  status: 'ABERTO' | 'FECHADO' | 'CANCELADO'
  abertoEm: string
  fechadoEm: string | null
  saldoFinalInformadoCentavos: number | null
  saldoFinalEsperadoCentavos: number | null
  diferencaCentavos: number | null
  observacaoFechamento: string | null
  criadoEm: string
  atualizadoEm: string
}
```

### Movimento de Caixa

```ts
export interface MovimentoCaixa {
  id: string
  sessaoCaixaId: string
  tipo: 'SUPRIMENTO' | 'SANGRIA' | 'RETIRADA'
  valorCentavos: number
  descricao: string | null
  origem: 'MANUAL'
  criadoEm: string
  atualizadoEm: string
}
```

### Mesa

```ts
export interface Mesa {
  id: string
  numero: number
  nome: string
  status: 'LIVRE' | 'OCUPADA' | 'INATIVA'
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}
```

### Produto

```ts
export interface Produto {
  id: string
  categoriaId: string
  nome: string
  descricao: string | null
  precoCentavos: number
  ativo: boolean
  criadoEm: string
  atualizadoEm: string
}

export interface ProdutoComCategoria extends Produto {
  categoriaNome: string
}
```

### Pedido

```ts
export interface Pedido {
  id: string
  sessaoCaixaId: string
  mesaId: string | null
  tipo: 'MESA' | 'BALCAO'
  status: 'ABERTO' | 'FINALIZADO' | 'CANCELADO'
  subtotalCentavos: number
  descontoItensCentavos: number
  descontoPedidoCentavos: number
  totalCentavos: number
  valorPagoCentavos: number
  valorCortesiaCentavos: number
  valorRestanteCentavos: number
  criadoEm: string
  atualizadoEm: string
  finalizadoEm: string | null
  canceladoEm: string | null
  motivoCancelamento: string | null
}

export interface PedidoItem {
  id: string
  pedidoId: string
  produtoId: string
  produtoNome: string
  quantidade: number
  precoUnitarioCentavos: number
  subtotalCentavos: number
  descontoCentavos: number
  totalCentavos: number
  observacao: string | null
  criadoEm: string
  atualizadoEm: string
  canceladoEm: string | null
  motivoCancelamento: string | null
}

export interface ResumoPedido {
  pedido: Pedido
  itens: PedidoItem[]
}
```

### Pagamento

```ts
export interface PagamentoPedido {
  id: string
  pedidoId: string
  sessaoCaixaId: string
  formaPagamento: 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'PIX' | 'CORTESIA'
  valorCentavos: number
  status: 'CONFIRMADO' | 'CANCELADO'
  motivoCortesia: string | null
  criadoEm: string
  atualizadoEm: string
  canceladoEm: string | null
}

export interface ResumoPagamentoPedido {
  pedidoId: string
  totalPedidoCentavos: number
  totalPagoCentavos: number
  valorRestanteCentavos: number
  pagamentos: PagamentoPedido[]
}
```

---

## IPC Channels

### Sistema

| Channel | Direction | Payload | Response |
|---------|-----------|---------|----------|
| `sistema:obter-informacoes` | Renderer → Main | - | `{ version, platform, userDataPath }` |

### Caixa

| Channel | Direction | Payload | Response |
|---------|-----------|---------|----------|
| `caixa:abrir-sessao` | Renderer → Main | `{ operadorId, operadorNome, saldoInicialCentavos }` | `SessaoCaixa` |
| `caixa:obter-sessao-aberta` | Renderer → Main | - | `SessaoCaixa | null` |
| `caixa:registrar-movimento` | Renderer → Main | `{ tipo, valorCentavos, descricao? }` | `MovimentoCaixa` |
| `caixa:listar-movimentos` | Renderer → Main | - | `MovimentoCaixa[]` |
| `caixa:obter-resumo-atual` | Renderer → Main | - | `ResumoCaixaAtual` |
| `caixa:fechar-sessao` | Renderer → Main | `{ saldoFinalInformadoCentavos, observacaoFechamento? }` | `SessaoCaixa` |
| `caixa:obter-ultima-sessao` | Renderer → Main | - | `SessaoCaixa | null` |

### Produtos

| Channel | Direction | Payload | Response |
|---------|-----------|---------|----------|
| `produtos:criar-categoria` | Renderer → Main | `{ nome, descricao? }` | `CategoriaProduto` |
| `produtos:listar-categorias` | Renderer → Main | `{ apenasAtivas? }` | `CategoriaProduto[]` |
| `produtos:atualizar-categoria` | Renderer → Main | `{ categoriaId, nome?, descricao? }` | `CategoriaProduto` |
| `produtos:inativar-categoria` | Renderer → Main | `{ categoriaId }` | `CategoriaProduto` |
| `produtos:reativar-categoria` | Renderer → Main | `{ categoriaId }` | `CategoriaProduto` |
| `produtos:excluir-categoria` | Renderer → Main | `{ categoriaId }` | `void` |
| `produtos:criar-produto` | Renderer → Main | `{ categoriaId, nome, descricao?, precoCentavos }` | `Produto` |
| `produtos:listar-produtos` | Renderer → Main | `{ categoriaId?, apenasAtivos? }` | `Produto[]` |
| `produtos:buscar-produtos` | Renderer → Main | `{ termo, categoriaId?, apenasAtivos? }` | `Produto[]` |
| `produtos:atualizar-produto` | Renderer → Main | `{ produtoId, categoriaId?, nome?, descricao?, precoCentavos? }` | `Produto` |
| `produtos:inativar-produto` | Renderer → Main | `{ produtoId }` | `Produto` |
| `produtos:reativar-produto` | Renderer → Main | `{ produtoId }` | `Produto` |
| `produtos:excluir-produto` | Renderer → Main | `{ produtoId }` | `void` |
| `produtos:obter-produto-por-id` | Renderer → Main | `{ produtoId }` | `Produto | null` |

### Mesas

| Channel | Direction | Payload | Response |
|---------|-----------|---------|----------|
| `mesas:criar-intervalo` | Renderer → Main | `{ numeroInicial, numeroFinal }` | `Mesa[]` |
| `mesas:listar` | Renderer → Main | - | `Mesa[]` |
| `mesas:atualizar` | Renderer → Main | `{ mesaId, numero?, nome? }` | `Mesa` |
| `mesas:inativar` | Renderer → Main | `{ mesaId }` | `Mesa` |
| `mesas:transferir-pedido` | Renderer → Main | `{ pedidoId, mesaDestinoId, motivo? }` | `{ pedidoId, mesaOrigem, mesaDestino }` |
| `mesas:agrupar-pedido` | Renderer → Main | `{ pedidoId, mesaIds, motivo? }` | `{ pedidoId, agrupamentoId, mesaPrincipal, mesas }` |
| `mesas:encerrar-agrupamento` | Renderer → Main | `{ pedidoId, motivo, observacao? }` | `MesaAgrupamento` |
| `mesas:obter-agrupamento-pedido` | Renderer → Main | `{ pedidoId }` | `ResumoMesaAgrupamento \| null` |
| `mesas:listar-historico-mesa` | Renderer → Main | `{ mesaId }` | `PedidoMesaMovimentacao[]` |

### Pedidos

| Channel | Direction | Payload | Response |
|---------|-----------|---------|----------|
| `pedidos:criar-pedido-mesa` | Renderer → Main | `{ mesaId }` | `Pedido` |
| `pedidos:criar-pedido-balcao` | Renderer → Main | - | `Pedido` |
| `pedidos:obter-pedido-aberto-por-mesa` | Renderer → Main | `{ mesaId }` | `ResumoPedido \| null` |
| `pedidos:listar-pedidos-abertos` | Renderer → Main | - | `Pedido[]` |
| `pedidos:adicionar-item` | Renderer → Main | `{ pedidoId, produtoId, quantidade, descontoCentavos?, observacao? }` | `ResumoPedido` |
| `pedidos:alterar-quantidade-item` | Renderer → Main | `{ pedidoId, itemId, quantidade }` | `ResumoPedido` |
| `pedidos:remover-item` | Renderer → Main | `{ pedidoId, itemId, motivoCancelamento }` | `ResumoPedido` |
| `pedidos:aplicar-desconto` | Renderer → Main | `{ pedidoId, descontoCentavos, motivoDesconto? }` | `ResumoPedido` |
| `pedidos:obter-resumo` | Renderer → Main | `{ pedidoId, incluirItensCancelados? }` | `ResumoPedido` |
| `pedidos:cancelar` | Renderer → Main | `{ pedidoId, motivoCancelamento }` | `Pedido` |
| `pedidos:listar-historico` | Renderer → Main | `{ status?, formaPagamento? }` | `ItemHistoricoPedido[]` |
| `pedidos:listar-historico-mesa` | Renderer → Main | `{ pedidoId }` | `PedidoMesaMovimentacao[]` |
| `pedidos:adicionar-pizza` | Renderer → Main | `{ pedidoId, categoriaId, tamanhoId, saborIds, observacao? }` | `ResumoPedido` |
| `pedidos:obter-pizza-item` | Renderer → Main | `{ pedidoItemId }` | `PizzaPedidoItemResumo` |

### Pizzas

| Channel | Direction | Payload | Response |
|---------|-----------|---------|----------|
| `pizzas:listar-categorias` | Renderer → Main | `{ apenasAtivas? }` | `PizzaCategoria[]` |
| `pizzas:criar-categoria` | Renderer → Main | `{ nome, descricao?, regraPrecificacao?, ordem? }` | `PizzaCategoria` |
| `pizzas:atualizar-categoria` | Renderer → Main | `{ categoriaId, nome?, descricao?, regraPrecificacao?, ativa?, ordem? }` | `PizzaCategoria` |
| `pizzas:listar-tamanhos` | Renderer → Main | `{ apenasAtivas? }` | `PizzaTamanho[]` |
| `pizzas:criar-tamanho` | Renderer → Main | `{ nome, sigla, maximoSabores, ordem? }` | `PizzaTamanho` |
| `pizzas:atualizar-tamanho` | Renderer → Main | `{ tamanhoId, nome?, sigla?, maximoSabores?, ativa?, ordem? }` | `PizzaTamanho` |
| `pizzas:listar-sabores` | Renderer → Main | `{ apenasAtivos?, categoriaId? }` | `PizzaSabor[]` |
| `pizzas:criar-sabor` | Renderer → Main | `{ nome, descricao?, ordem? }` | `PizzaSabor` |
| `pizzas:atualizar-sabor` | Renderer → Main | `{ saborId, nome?, descricao?, ativa?, ordem? }` | `PizzaSabor` |
| `pizzas:vincular-sabor-categoria` | Renderer → Main | `{ categoriaId, saborId, ativo? }` | `void` |
| `pizzas:definir-preco` | Renderer → Main | `{ saborId, tamanhoId, valorCentavos }` | `PizzaSaborPreco` |
| `pizzas:listar-precos-sabor` | Renderer → Main | `{ saborId, apenasAtivos? }` | `PizzaSaborPreco[]` |
| `pizzas:listar-categorias-sabor` | Renderer → Main | `{ saborId }` | `string[]` |
| `pizzas:montar-preview` | Renderer → Main | `{ categoriaId, tamanhoId, saborIds }` | `PreviewPizza` |

### Pagamentos

| Channel | Direction | Payload | Response |
|---------|-----------|---------|----------|
| `pagamentos:registrar-pedido` | Renderer → Main | `{ pedidoId, formaPagamento, valorCentavos, motivoCortesia? }` | `ResumoPagamentoPedido` |
| `pagamentos:listar-pedido` | Renderer → Main | `{ pedidoId }` | `PagamentoPedido[]` |
| `pagamentos:obter-resumo-pedido` | Renderer → Main | `{ pedidoId }` | `ResumoPagamentoPedido` |

### Divisão de conta

| Channel | Direction | Payload | Response |
|---------|-----------|---------|----------|
| `divisao-conta:criar` | Renderer → Main | `{ pedidoId, partes: [{ identificacao, valorDefinidoCentavos }] }` | `ResumoDivisaoConta` |
| `divisao-conta:obter-resumo` | Renderer → Main | `{ pedidoId }` | `ResumoDivisaoConta \| null` |
| `divisao-conta:registrar-pagamento-parte` | Renderer → Main | `{ pedidoId, parteId, formaPagamento, valorCentavos, motivoCortesia? }` | `ResumoDivisaoConta` |
| `divisao-conta:cancelar` | Renderer → Main | `{ pedidoId, motivo? }` | `ResumoDivisaoConta` |
| `divisao-conta:listar-historico` | Renderer → Main | `{ pedidoId }` | `PedidoDivisaoMovimentacao[]` |

---

## Error Codes

### ErroCaixa

| Código | Mensagem | Situação |
|--------|----------|----------|
| `CAIXA_JA_ABERTO` | Já existe uma sessão de caixa aberta | Tentar abrir nova sessão com caixa já aberto |
| `SALDO_INICIAL_INVALIDO` | Saldo inicial não pode ser negativo | Saldo inicial < 0 |
| `CAIXA_NAO_ABERTO` | Não existe sessão de caixa aberta | Operação exige caixa aberto |
| `SALDO_FINAL_INVALIDO` | Saldo final informado não pode ser negativo | Saldo final < 0 |
| `CAIXA_JA_FECHADO` | A sessão de caixa já foi fechada | Tentar fechar sessão já fechada |

### ErroProdutos

| Código | Mensagem | Situação |
|--------|----------|----------|
| `ENTRADA_INVALIDA` | Entrada inválida | Validation error (Zod) |
| `CATEGORIA_NAO_ENCONTRADA` | Categoria não encontrada | ID inválido |
| `PRODUTO_NAO_ENCONTRADO` | Produto não encontrado | ID inválido |
| `PRODUTO_EM_USO` | Produto não pode ser excluído pois está em uso | Tentar excluir produto usado em pedidos |
| `CATEGORIA_EM_USO` | Categoria não pode ser excluída pois possui produtos | Tentar excluir categoria com produtos |

### ErroMesas

| Código | Mensagem | Situação |
|--------|----------|----------|
| `ENTRADA_INVALIDA` | Entrada inválida | Validation error |
| `MESAS_NAO_ENCONTRADA` | Mesa não encontrada | ID inválido |
| `INTERVALO_INVALIDO` | Número final deve ser maior ou igual ao inicial | Intervalo inválido |

### ErroPedidos

| Código | Mensagem | Situação |
|--------|----------|----------|
| `ENTRADA_INVALIDA` | Entrada inválida | Validation error |
| `CAIXA_NAO_ABERTO` | Abra o caixa antes de operar pedidos | Caixa fechado |
| `PEDIDO_NAO_ENCONTRADO` | Pedido não encontrado | ID inválido |
| `PEDIDO_NAO_ABERTO` | Pedido não está aberto para alteração | Operação exige pedido aberto |
| `ITEM_NAO_ENCONTRADO` | Item não encontrado | ID inválido |
| `MESA_NAO_ENCONTRADA` | Mesa não encontrada | ID inválido |
| `MESA_OCUPADA` | Mesa já possui pedido aberto | Tentar abrir pedido em mesa ocupada |
| `MESA_INATIVA` | Não é permitido abrir pedido em mesa inativa | Mesa desativada |

### ErroPizzas

| Código | Situação |
|--------|----------|
| `PIZZA_CATEGORIA_NAO_ENCONTRADA` / `PIZZA_CATEGORIA_INATIVA` | Categoria inexistente ou inativa |
| `PIZZA_TAMANHO_NAO_ENCONTRADO` / `PIZZA_TAMANHO_INATIVO` | Tamanho inexistente ou inativo |
| `PIZZA_SABOR_NAO_ENCONTRADO` / `PIZZA_SABOR_INATIVO` | Sabor inexistente ou inativo |
| `PIZZA_SABOR_NAO_PERTENCE_A_CATEGORIA` | Sabor sem vínculo ativo com a categoria |
| `PIZZA_SABOR_DUPLICADO` | Mesmo sabor repetido na composição |
| `PIZZA_SEM_SABOR` | Lista de sabores vazia |
| `PIZZA_QUANTIDADE_SABORES_EXCEDE_LIMITE` | Excede `pizza_tamanho.maximo_sabores` |
| `PIZZA_PRECO_NAO_CONFIGURADO_PARA_TAMANHO` | Sem preço ativo sabor×tamanho |
| `PIZZA_REGRA_PRECIFICACAO_INVALIDA` | Regra da categoria inválida |
| `ALTERACAO_PIZZA_BLOQUEADA_POR_DIVISAO_ATIVA` | Inclusão/remoção com divisão ATIVA |
| `QUANTIDADE_PIZZA_NAO_ALTERAVEL` | Tentativa de alterar quantidade do item pizza |
| `ENTRADA_INVALIDA` | Validação Zod |

---

## Padrões de Implementação

### Use-Case Pattern

```ts
// 1. Definir entrada
export interface MinhaEntrada {
  campo1: string
  campo2: number
}

// 2. Definir saída
export interface MinhaSaida {
  id: string
  campo1: string
  campo2: number
}

// 3. Implementar use-case
export function criarMinhaFuncao(
  repositorio: MinhaRepository = criarMinhaRepository(),
) {
  return function minhaFuncao(entrada: MinhaEntrada): MinhaSaida {
    // Validar entrada (pode usar Zod)
    // Invocar repository
    // Retornar resultado
  }
}

export const minhaFuncao = criarMinhaFuncao()
```

### Repository Pattern

```ts
export class MinhaRepository {
  constructor(
    private readonly obterConexao = obterConexaoBancoLocal,
  ) {}

  inserir(dados: DadosEntrada): Resultado {
    const conexao = this.obterConexao()
    // Executar INSERT
    // Persistir (opcional)
    // Retornar resultado
  }

  buscarPorId(id: string): Resultado | null {
    const conexao = this.obterConexao()
    // Executar SELECT
    // Mapear linha para objeto
  }

  // ... outros métodos
}
```

### IPC Handler Pattern

```ts
export function registrarHandlersX() {
  ipcMain.handle(CANAIS_IPC.XXX, async (evento, entradaDesconhecida) => {
    try {
      const entrada = schema.parse(entradaDesconhecida)
      return useCase(entrada)
    } catch (erro) {
      tratarErro(erro)
    }
  })
}

function tratarErro(erro: unknown): never {
  if (erro instanceof ErroX) {
    throw erro
  }
  if (erro instanceof ZodError) {
    throw new ErroX(CODIGO.ENTRADA_INVALIDA, 'Entrada inválida.')
  }
  throw erro
}
```

### React Hook Pattern

```ts
export function useX() {
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  const fn = async (entrada) => {
    setCarregando(true)
    setErro(null)
    setSucesso(null)

    try {
      const resposta = await ipc.invoke('canal', entrada)
      setSucesso('Operação realizada com sucesso')
      return resposta
    } catch (e) {
      setErro(e.message)
      return false
    } finally {
      setCarregando(false)
    }
  }

  return {
    carregando,
    erro,
    sucesso,
    fn,
  }
}
```

---

## Cálculos Financeiros

### Sessão de Caixa

```ts
saldoFinalEsperado = saldoInicial
                   + SUM(movimentos_positivos)
                   + SUM(vendas_por_forma)
                   - SUM(movimentos_negativos)

diferenca = saldoInformado - saldoFinalEsperado
```

### Pedido

```ts
subtotalBruto = Σ(quantidade * precoUnitario)
descontoItens = Σ(descontoItem)
subtotalLiquido = subtotalBruto - descontoItens
descontoPedido = descontoGeralAplicado
totalPedido = subtotalLiquido - descontoPedido

valorPago = Σ(pagamentosConfirmados_semCortesia)
valorCortesia = Σ(pagamentosConfirmados_comCortesia)
valorRestante = totalPedido - valorPago - valorCortesia
```

### Formatação de Valores

```ts
export function formatarCentavosParaReal(centavos: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100)
}
```

---

## Layouts e Componentes

### Padrão Master-Detail

```
┌───────────────────┬─────────────────────────┐
│  Lista Principal  │   Detalhe / Formulário  │
│  (scroll só aqui) │   (colapsado por padrão)  │
│                   │                         │
│ - Item 1          │  [Formulário aberto]    │
│ - Item 2          │                         │
│ - Item 3          │  [Formulário fechado]   │
│ - ...             │                         │
└───────────────────┴─────────────────────────┘
```

### Padrão Toolbar + Lista

```
┌───────────────────────────────────────────┐
│  Toolbar (fixo no topo)                   │
│  [Filtros] [Search] [Botões de ação]      │
├───────────────────────────────────────────┤
│  Lista (scroll aqui)                      │
│  - Item 1                                 │
│  - Item 2                                 │
│  - Item 3                                 │
│  - ...                                    │
└───────────────────────────────────────────┘
```

---

## Testes

### Estrutura de Testes

```
tests/
├── unit/                  # Testes unitários
│   ├── use-cases/         # Testes de use-cases
│   ├── repositories/      # Testes de repositories
│   └── utils/             # Testes de utilitários
└── e2e/                   # Testes end-to-end
    ├── caixa/
    ├── produtos/
    ├── pedidos/
    └── pagamentos/
```

### Exemplo de Teste Unitário

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { criarAbrirSessaoCaixa } from '../src/main/modules/caixa/use-cases/abrir-sessao-caixa'

describe('abrirSessaoCaixa', () => {
  it('deve criar nova sessão com saldo inicial', async () => {
    // Arrange
    const repositorio = criarRepositorioMock()
    const useCase = criarAbrirSessaoCaixa(repositorio)

    // Act
    const resultado = useCase({
      operadorId: 'usr_1',
      operadorNome: 'João',
      saldoInicialCentavos: 20000,
    })

    // Assert
    expect(resultado.id).toBeDefined()
    expect(resultado.saldoInicialCentavos).toBe(20000)
    expect(resultado.status).toBe('ABERTO')
  })

  it('deve lançar erro se caixa já estiver aberto', async () => {
    // Arrange
    const repositorio = criarRepositorioMockComSessaoAberta()
    const useCase = criarAbrirSessaoCaixa(repositorio)

    // Act & Assert
    expect(() => useCase({...})).toThrow('Já existe uma sessão de caixa aberta.')
  })
})
```

---

## Notas Finais

- Todos os valores financeiros em **centavos** (inteiros)
- Sempre usar `Intl.NumberFormat` para formatar valores
- Feedback de erro user-friendly (não expor stack traces)
- Feedback de sucesso não-modal (toast estilo)
- Scroll controlado (apenas áreas de lista rolam)
- Formulários colapsados (não modais)
- Validar entrada com Zod em todos os IPC handlers
- Tratamento de erro padronizado em todos os use-cases