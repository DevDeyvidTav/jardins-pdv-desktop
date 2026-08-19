# Layout de pedidos e mesas

Este documento descreve o padrao visual e de interacao da tela de **Pedidos** no PDV desktop, inspirado no layout operacional do **Swfast v62** usado pelo cliente, com refinamentos da paleta atual do projeto.

## Objetivo

Permitir operacao rapida em ambiente de restaurante:

- visao geral das mesas em **grade**
- detalhe do pedido no **painel esquerdo**
- cores de status alinhadas ao sistema legado
- acoes contextuais ao selecionar uma mesa

## Estrutura (master-detail)

```text
+----------------------------+-------------------------------+
|  Painel esquerdo (~38%)    |  Area da grade (~62%)         |
|  - Mesa + status           |  - Toolbar (cadastro/balcao)  |
|  - Itens do pedido         |  - Grade 6 colunas            |
|  - Total                   |  - Filtros por status         |
|  - Acoes (criar/adicionar) |                               |
+----------------------------+-------------------------------+
```

### Painel esquerdo

| Estado | Conteudo |
|--------|----------|
| Nenhuma mesa selecionada | Mensagem: "Selecione uma mesa na grade" |
| Mesa livre selecionada | Numero, status **Livre**, botao **Criar pedido** |
| Mesa ocupada selecionada | Carrega pedido aberto automaticamente |
| Pedido aberto | Tabela Qtde / Produto / Valor / Total, total em destaque, **Adicionar item** |

### Area da grade

- Quadrados clicaveis com o **numero da mesa** centralizado
- **10 colunas** em desktop, altura fixa ~42px (nao quadrados grandes)
- Apenas a **grade** rola; toolbar e filtros ficam fixos
- Selecao com borda azul (`#1976d2`) — mesmo papel do destaque no Swfast

### Painel esquerdo (sem scroll externo)

- Cabecalho compacto (mesa + status) fixo no topo
- Lista de itens ocupa o espaco central e **so ela rola** se houver muitos itens
- Linhas densas (~32px), alinhadas ao topo — nao esticar para preencher a altura do painel
- Rodape fixo: total + botao **Adicionar item**
- Formulario compacto (busca, produto, qtd, botao **Adicionar**) fixo acima do rodape quando aberto

### Filtros inferiores

Barra de chips espelhando o sistema antigo:

| Filtro | Cor de fundo | Status exibido |
|--------|--------------|----------------|
| Livres | `#e8f5e9` | `LIVRE` |
| Ocupadas | `#fff9c4` | `OCUPADA` |
| Agrupadas | `#bbdefb` | `AGRUPADA` |
| Inativas | `#ffcdd2` | `INATIVA` ou mesa desativada |
| Todas | `#eceff1` | Sem filtro |

> Status futuros do legado (Fechadas, Recebidas) serao adicionados quando existirem no dominio.

## Paleta de cores por status de mesa

Tokens CSS definidos em `pedidos.css`:

| Status | Gradiente (topo → base) | Texto | Referencia Swfast |
|--------|-------------------------|-------|-------------------|
| Livre | `#f1f8e9` → `#c8e6c9` | `#1b5e20` | Verde claro |
| Ocupada | `#fffde7` → `#ffe082` | `#e65100` | Amarelo/laranja |
| Agrupada | `#e3f2fd` → `#90caf9` | `#0d47a1` | Azul |
| Inativa | `#ffebee` → `#ffcdd2` | `#b71c1c` | Rosa/vermelho claro |
| Selecionada | Borda `#1976d2` + sombra azul | — | Destaque azul |

Total do pedido no painel: verde `#2e7d32` (mesmo peso visual do total no Swfast).

## Fluxo de interacao

1. Operador abre **Pedidos** com caixa aberto
2. Clica em um quadrado da grade → mesa fica selecionada
3. Se **LIVRE**: painel mostra **Criar pedido**
4. Se **OCUPADA**: pedido aberto carrega automaticamente no painel
5. Com pedido aberto: **Adicionar item** expande o formulario de produtos abaixo da lista
6. **Cadastrar mesas** (toolbar) abre formulario de intervalo (ex.: 1–30)
7. **Pedido balcao** abre pedido sem mesa no painel esquerdo

## Componentes React

| Arquivo | Responsabilidade |
|---------|------------------|
| `pages/pedidos.page.tsx` | Layout master-detail |
| `components/grade-mesas.tsx` | Grade de quadrados |
| `components/painel-mesa-pedido.tsx` | Painel esquerdo + acoes |
| `components/filtros-status-mesas.tsx` | Barra de filtros |
| `components/formulario-mesa.tsx` | Cadastro por intervalo |
| `constants/mesa-status-cores.ts` | Filtros, rotulos e classes de status |

## Test IDs relevantes (E2E)

| testid | Elemento |
|--------|----------|
| `pagina-pedidos` | Tela principal |
| `grade-mesas` | Container da grade |
| `item-mesa` | Celula/botao de mesa |
| `botao-abrir-mesa` | Criar pedido (mesa livre) |
| `pagina-pedido-aberto` | Painel com pedido ativo |
| `botao-adicionar-item-painel` | Abre formulario de item |
| `botao-cadastrar-mesas` | Toggle cadastro por intervalo |
| `filtros-status-mesas` | Barra de filtros |

## Abas da area direita

| Aba | Conteudo |
|-----|----------|
| Mesas | Grade + filtros de status + cadastro/balcao |
| Historico | Lista de pedidos finalizados/cancelados |

### Historico

- Filtros: **Todos / Finalizados / Cancelados**
- Filtro por forma de pagamento (Dinheiro, Credito, Debito, Pix, Cortesia)
- Clique no item carrega o pedido no painel esquerdo (somente leitura)
- Apos finalizar ou cancelar, a aba Historico abre automaticamente

## Manutencao

Ao adicionar novos status de mesa:

1. Estender `STATUS_MESA` no shared
2. Adicionar token de cor em `pedidos.css`
3. Atualizar `mesa-status-cores.ts` (classe + filtro, se aplicavel)
4. Documentar neste arquivo
