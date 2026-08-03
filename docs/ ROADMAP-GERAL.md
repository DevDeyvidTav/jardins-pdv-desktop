# PDV Desktop - Jardins

## Visão Geral

Sistema PDV desktop construído com Electron + React + TypeScript + SQLite, focado em operação de restaurante com gestão de caixa, produtos, pedidos (mesas e balcão) e pagamentos.

---

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [ROADMAP-SPRINTS.md](ROADMAP-SPRINTS.md) | Planejamento detalhado em sprints (7 semanas) |
| [ESPECIFICAÇÃO-TECNICA.md](ESPECIFICAÇÃO-TECNICA.md) | Arquitetura, schemas, IPC, erros |
| [layout-pedidos-mesas.md](layout-pedidos-mesas.md) | Layout UX de pedidos e mesas |
| [layout-produtos-caixa.md](layout-produtos-caixa.md) | Layout UX de produtos e caixa |

---

## Arquitetura Técnica

### Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | Electron (main + renderer process) |
| UI | React 19 + TypeScript |
| Database | SQLite (sql.js) |
| Validação | Zod |
| Testes | Vitest + Playwright |

### Estrutura de Diretórios

```
apps/desktop/src/
├── main/              # Processo principal (Electron)
│   ├── app/           # Inicialização, janela
│   ├── database/      # Camada de dados (SQLite)
│   ├── compartilhado/ # Utilitários e erros compartilhados
│   ├── ipc/           # Handlers IPC (main ↔ renderer)
│   └── modules/       # Domínios (caixa, mesas, pedidos, produtos)
│       ├── use-cases/       # Lógica de negócio
│       ├── repositories/    # Repositories SQLite
│       ├── schemas/         # Schemas Zod
│       └── types/           # Types TypeScript
└── renderer/          # Processo renderer (React)
    ├── app/           # App.tsx e navegação
    ├── components/    # Componentes globais
    ├── modules/       # Módulos React por domínio
    │   ├── components/ # Componentes específicos
    │   ├── pages/      # Páginas React
    │   └── hooks/      # Hooks do domínio
    └── shared/        # Types compartilhados
```

---

## Domínios do Sistema

### 1. Caixa

**Responsável:** Abertura, movimentações e fechamento do caixa.

**Entidades:** SessaoCaixa, MovimentoCaixa

**Status:** ABERTO, FECHADO, CANCELADO

**Casos de Uso:** abrir, fechar, registrar movimento, resumo

### 2. Produtos e Categorias

**Responsável:** Catálogo de produtos com agrupamento por categorias.

**Entidades:** CategoriaProduto, Produto

**Casos de Uso:** CRUD, busca, inativar/reativar, excluir

### 3. Mesas

**Responsável:** Cadastro e status de mesas (Livre, Ocupada, Inativa).

**Entidades:** Mesa

**Status:** LIVRE, OCUPADA, INATIVA

**Casos de Uso:** criar intervalo, listar, atualizar, inativar

### 4. Pedidos

**Responsável:** Criação, gestão e finalização de pedidos (mesa ou balcão).

**Entidades:** Pedido, PedidoItem, PagamentoPedido

**Tipos:** MESA, BALCAO

**Status:** ABERTO, FINALIZADO, CANCELADO

**Casos de Uso:** criar, adicionar item, cancelar, aplicar desconto, finalizar

### 5. Pagamentos

**Responsável:** Registros de pagamento por forma (Dinheiro, Cartão, Pix, Cortesia).

**Entidades:** PagamentoPedido

**Formas:** DINHEIRO, CARTAO_CREDITO, CARTAO_DEBITO, PIX, CORTESIA

**Status:** CONFIRMADO, CANCELADO

---

## Últimos Commits

| Commit | Funcionalidade |
|--------|----------------|
| `44920d9` | Histórico, cancelamento com motivo, exclusão/edição de catálogo |
| `5913c92` | Descontos em pedidos, atualização estrutura de pagamento |
| `307e428` | Registro e resumo de pagamentos de pedidos |
| `37ecf1f` | Cancelamento de itens em pedidos |
| `bbc48af` | Gerenciamento de mesas e pedidos |
| `e55832f` | Gerenciamento de produtos e categorias |
| `082ce48` | Fechamento de sessão de caixa |
| `dec1861` | Registro e listagem de movimentos de caixa |
| `9e88a42` | Abertura de caixa e estrutura base |
| `627d537` | Fundação inicial (Electron + SQLite) |

---

## Checklist de Implementação

### Caixa ✓
- [x] Abertura de sessão
- [x] Registro de movimentos
- [x] Listagem de movimentos
- [x] Resumo de caixa atual
- [x] Fechamento de sessão
- [x] Última sessão

### Produtos ✓
- [x] CRUD de categorias
- [x] CRUD de produtos
- [x] Busca por termo
- [x] Filtro por categoria
- [x] Inativar/reativar
- [x] Exclusão (validação)

### Mesas ✓
- [x] Cadastro por intervalo
- [x] Listagem
- [x] Atualização
- [x] Inativação

### Pedidos ✓
- [x] Criar pedido mesa/balcão
- [x] Adicionar itens
- [x] Cancelar itens
- [x] Aplicar descontos
- [x] Cancelar pedido
- [x] Histórico

### Pagamentos ⚠️ (Parcial)
- [x] Registrar pagamento
- [x] Listar pagamentos
- [x] Resumo de pagamento
- [ ] Tela completa de pagamento
- [ ] Cupom fiscal
- [ ] Múltiplas formas por pedido
- [ ] Cálculo de troco

---

## ROADMAP DETALHADO (Resumo)

### FASE 1 - MÍNIMO VIÁVEL COMPLETO (Prioridade Alta)

| Semana | Item | Status |
|--------|------|--------|
| 1-2 | Pagamento de Pedidos (UI) | Lógica pronta, UI incompleta |
| 3 | Fechamento de Caixa (UI) | Lógica pronta, UI incompleta |
| 4 | Relatórios Básicos | Novos relatórios |

### FASE 2 - MELHORIAS DE UX (Prioridade Média)

| Semana | Item | Status |
|--------|------|--------|
| 5-6 | Configurações | Dados da empresa, impressão, turnos |
| 7 | Backups | Automático + manual |

### FASE 3 - RECURSOS AVANÇADOS (Prioridade Baixa)

| Semana | Item | Status |
|--------|------|--------|
| 8 | Impressão Térmica | ESC/POS |
| 9-10 | Multiterminais | Sincronização |
| 11-12 | Login de Operador | Auth + permissões |

---

## Resumo de Padrões de Código

### Error Handling

```ts
if (erro instanceof ErroX) throw erro
if (erro instanceof ZodError) throw new ErroX(CODIGO.ENTRADA_INVALIDA, '...')
throw erro
```

### IPC Handler

```ts
ipcMain.handle(CANAIS_IPC.XXX, async (e, entrada) => {
  try { return useCase(schema.parse(entrada)) }
  catch (erro) { tratarErro(erro) }
})
```

### React Hook

```ts
const fn = async (entrada) => {
  setCarregando(true); setErro(null); setSucesso(null)
  try { const resposta = await ipc.invoke('canal', entrada); setSucesso('Ok'); return resposta }
  catch (e) { setErro(e.message); return false }
  finally { setCarregando(false) }
}
```

---

## Glossário

| Termo | Significado |
|-------|-------------|
| sessão de caixa | Período de operação (aberto → fechado) |
| movimento de caixa | Entrada/saída de dinheiro (suprimento, sangria, retirada) |
| migracao | Script SQL que cria/altera tabelas |
| use-case | Lógica de negócio centralizada |
| repository | Camada de persistência (SQLite) |
| IPC | Comunicação entre processo main e renderer |
| master-detail | Layout com lista principal e detalhe lateral |
| soft delete | Marcar como inativo, não excluir fisicamente |
| centavos | Valor em inteiro (ex: R$ 10,50 = 1050) |
