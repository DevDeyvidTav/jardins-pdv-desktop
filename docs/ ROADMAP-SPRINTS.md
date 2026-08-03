# PDV Desktop - Planejamento de Sprints

## Sprint 0 (Setup e Preparação)

### Objetivo
Configurar ambiente e preparar estrutura para as próximas sprints.

### Tarefas
- [ ] Revisar e consolidar documentação (este documento)
- [ ] Criar board de tarefas no GitHub/ClickUp/Trello
- [ ] Definir branch strategy (feat/, fix/, chore/)
- [ ] Setup CI/CD básico
- [ ] Definir versão inicial (v0.1.0)

### Duração: 1 dia

---

## Sprint 1 (Pagamento Completo)

### Objetivo
Implementar tela completa de pagamento com suporte a múltiplas formas.

### Critérios de Aceite
- [ ] Tela `pagamento-pedido.page.tsx` completa
- [ ] Seleção de forma de pagamento (Dinheiro, Cartão, Pix, Cortesia)
- [ ] Campo para entrada de valor
- [ ] Cálculo automático de troco (dinheiro)
- [ ] Lista de pagamentos realizados no pedido
- [ ] Botão "Adicionar Pagamento"
- [ ] Botão "Finalizar Pagamento" (quita pedido)
- [ ] Botão "Cancelar Último Pagamento"
- [ ] Resumo financeiro (subtotal, descontos, total, pago, restante)
- [ ] Feedback visual de sucesso/erro
- [ ] Testes E2E para fluxo completo

### Tarefas

#### Backend (IPC)
- [ ] Criar `pagamentos.ipc.ts` no renderer (handlers)
- [ ] Criar `pagamentos/hooks/use-pagamentos.ts` hook
- [ ] Implementar `registrarPagamento` com validações
- [ ] Implementar `cancelarPagamento` (último por pedido)
- [ ] Implementar `obterResumoPagamento`

#### Frontend (React)
- [ ] Criar `pages/pagamento-pedido.page.tsx`
- [ ] Criar `components/formulario-pagamento-pedido.tsx`
- [ ] Criar `components/lista-pagamentos-pedido.tsx`
- [ ] Criar `components/resumo-pagamento-pedido.tsx`
- [ ] Integração com `usePagamentos` hook
- [ ] Estilização (padrão do projeto)
- [ ] Testes E2E

### Entregáveis
- Tela de pagamento funcional
- Hooks e handlers IPC implementados
- Documentação atualizada

### Duração: 5 dias

---

## Sprint 2 (Fechamento de Caixa)

### Objetivo
Implementar tela de fechamento de caixa completa com impressão.

### Critérios de Aceite
- [ ] Tela `fechamento-caixa.page.tsx` completa
- [ ] Exibe saldo inicial
- [ ] Exibe movimentos por tipo (filtráveis)
- [ ] Exibe vendas por forma de pagamento
- [ ] Calcula saldo esperado automaticamente
- [ ] Campo para saldo físico informado
- [ ] Calcula e exibe diferença
- [ ] Campo para observação
- [ ] Botão "Confirmar Fechamento"
- [ ] Botão "Cancelar" (abre caixa novamente)
- [ ] Relatório de fechamento impresso/exportado
- [ ] Testes E2E

### Tarefas

#### Backend (IPC)
- [ ] Criar `fechamento-caixa.ts` use-case completo
- [ ] Implementar `calcularTotaisFechamento`
- [ ] Implementar `gerarRelatorioFechamento`

#### Frontend (React)
- [ ] Criar `pages/fechamento-caixa.page.tsx`
- [ ] Criar `components/resumo-fechamento-completo.tsx`
- [ ] Criar `components/formulario-fechamento-caixa.tsx`
- [ ] Criar `components/lista-movimentos-fechamento.tsx`
- [ ] Integração com `useCaixa` hook
- [ ] Estilização
- [ ] Testes E2E

### Entregáveis
- Tela de fechamento funcional
- Relatório de fechamento
- Documentação atualizada

### Duração: 5 dias

---

## Sprint 3 (Relatórios)

### Objetivo
Implementar relatórios básicos com exportação.

### Critérios de Aceite
- [ ] Tela `relatorios.page.tsx`
- [ ] Relatório de Vendas (por período)
  - Total por forma de pagamento
  - Total de descontos
  - Total de cortesias
- [ ] Relatório de Movimentos de Caixa
  - Filtrado por período
  - Filtrado por tipo
- [ ] Relatório de Produtos Mais Vendidos
  - Top 10 produtos
  - Quantidade e receita
- [ ] Relatório de Mesas
  - Ocupação por hora/dia
- [ ] Exportação CSV/Excel
- [ ] Testes unitários

### Tarefas

#### Backend (IPC)
- [ ] Criar `relatorios/relatorio-vendas.ts` use-case
- [ ] Criar `relatorios/relatorio-movimentos.ts` use-case
- [ ] Criar `relatorios/relatorio-produtos.ts` use-case
- [ ] Criar `relatorios/relatorio-mesas.ts` use-case
- [ ] Implementar exportação CSV/Excel

#### Frontend (React)
- [ ] Criar `pages/relatorios.page.tsx`
- [ ] Criar `components/filtro-periodo.tsx`
- [ ] Criar `components/tabela-relatorio.tsx`
- [ ] Implementar download de CSV/Excel
- [ ] Estilização
- [ ] Testes unitários

### Entregáveis
- 4 relatórios funcionais
- Exportação de dados
- Documentação atualizada

### Duração: 5 dias

---

## Sprint 4 (Configurações)

### Objetivo
Implementar tela de configurações com dados da empresa e preferências.

### Critérios de Aceite
- [ ] Tela `configuracoes.page.tsx`
- [ ] Dados da Empresa
  - Nome/Fantasia
  - CNPJ
  - Endereço completo
  - Telefone
- [ ] Impressão
  - Impressora padrão
  - Cupom detalhado/compacto
  - Qtd vias
- [ ] Turnos
  - Configuração de horários
- [ ] Salvar configurações (arquivo `config.json`)
- [ ] Carregar ao boot
- [ ] Alerta de reinicialização
- [ ] Testes unitários

### Tarefas

#### Backend (IPC)
- [ ] Criar `configuracoes.service.ts`
- [ ] Criar `configuracoes.schema.ts` (Zod)
- [ ] Implementar leitura/escrita `config.json`
- [ ] Criar `configuracoes.ipc.ts` handlers

#### Frontend (React)
- [ ] Criar `pages/configuracoes.page.tsx`
- [ ] Criar `components/formulario-dados-empresa.tsx`
- [ ] Criar `components/formulario-impressao.tsx`
- [ ] Criar `components/formulario-turnos.tsx`
- [ ] Implementar persistência
- [ ] Estilização
- [ ] Testes unitários

### Entregáveis
- Tela de configurações funcional
- Arquivo de configuração
- Documentação atualizada

### Duração: 5 dias

---

## Sprint 5 (Backups e Impressão)

### Objetivo
Implementar sistema de backups e suporte a impressora térmica.

### Critérios de Aceite
- [ ] Backup automático (diário/semanal)
- [ ] Backup manual (botão + exportar)
- [ ] Importar backup (restaurar)
- [ ] Verificação de integridade
- [ ] Interface de impressão (listar impressoras)
- [ ] Cupom fiscal impresso
- [ ] Comandos ESC/POS
- [ ] Testes unitários

### Tarefas

#### Backend (IPC)
- [ ] Criar `backups/backup.service.ts`
- [ ] Criar `backups/backup.service.test.ts`
- [ ] Criar `impressora/impressora.service.ts`
- [ ] Criar `impressora/impressora-escpos.ts`
- [ ] Implementar comandos ESC/POS
- [ ] Criar `impressora/ipc.ts` handlers

#### Frontend (React)
- [ ] Criar `pages/backups.page.tsx`
- [ ] Criar `components/botao-fazer-backup.tsx`
- [ ] Criar `components/lista-backups.tsx`
- [ ] Criar `pages/impressao.page.tsx`
- [ ] Criar `components/selecionar-impressora.tsx`
- [ ] Estilização
- [ ] Testes unitários

### Entregáveis
- Sistema de backups funcional
- Impressão térmica implementada
- Documentação atualizada

### Duração: 5 dias

---

## Sprint 6 (Testes e Polimento)

### Objetivo
Cobertura de testes e ajustes finos de UX.

### Critérios de Aceite
- [ ] Cobertura de testes > 80%
- [ ] Bug fixes críticos
- [ ] Melhorias de UX baseadas em feedback
- [ ] Performance tuning
- [ ] Documentação completa
- [ ] Changelog v1.0.0

### Tarefas
- [ ] Revisar e completar testes unitários
- [ ] Revisar e completar testes E2E
- [ ] Bug triage e fixes
- [ ] Performance profiling
- [ ] Acessibilidade (WCAG AA)
- [ ] Documentação de API
- [ ] Changelog completo

### Entregáveis
- 80%+ cobertura de testes
- Documentação completa
- Changelog v1.0.0
- Release candidate

### Duração: 5 dias

---

## Sprint 7 (Release v1.0.0)

### Objetivo
Lançamento oficial do v1.0.0.

### Tarefas
- [ ] Build de release (produção)
- [ ] Assinatura de executável
- [ ] Publicação no GitHub Releases
- [ ] Documentação de usuário
- [ ] Vídeo tutorial (opcional)
- [ ] Anúncio de release

### Entregáveis
- Release v1.0.0 publicado
- Documentação completa
- Changelog

### Duração: 2 dias

---

## Resumo de Sprints

| Sprint | Duração | Objetivo | Entregáveis |
|--------|---------|----------|-------------|
| 0 | 1 dia | Setup | Estrutura pronta |
| 1 | 5 dias | Pagamento | Tela de pagamento funcional |
| 2 | 5 dias | Fechamento | Tela de fechamento funcional |
| 3 | 5 dias | Relatórios | 4 relatórios + exportação |
| 4 | 5 dias | Configurações | Tela de configurações |
| 5 | 5 dias | Backups | Sistema de backups + impressão |
| 6 | 5 dias | Testes | 80%+ cobertura |
| 7 | 2 dias | Release | v1.0.0 publicado |

**Total: 33 dias (~7 semanas)**

---

## Priorização de Features

### Must Have (v1.0.0)
- [x] Tela de pagamento completa
- [x] Tela de fechamento de caixa
- [x] Relatórios básicos
- [x] Configurações
- [x] Backups
- [x] Impressão térmica
- [ ] Login de operador (opcional para v1.0.0)

### Nice to Have (v1.1.0)
- [ ] Login de operador
- [ ] Multiterminais
- [ ] Histórico de sincronização

### Future (v2.0.0+)
- [ ] Nuvem (sync online)
- [ ] Mobile app (app para garçom)
- [ ] Integração com PDV web

---

## Checklist de Release

- [ ] Todas as sprints concluídas
- [ ] Testes cobrindo 80%+ do código
- [ ] Documentação completa
- [ ] Changelog atualizado
- [ ] Build de produção funcional
- [ ] Assinatura de executável
- [ ] GitHub Releases publicado
- [ ] Documentação de usuário publicada

---

## Notas

- Cada sprint tem 5 dias úteis (exceto Sprint 0 e 7)
- Buffer de 2 dias para imprevistos
- Revisão diária de progresso (standup)
- Demo ao final de cada sprint