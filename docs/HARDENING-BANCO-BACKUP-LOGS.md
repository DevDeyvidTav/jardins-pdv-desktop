# Hardening técnico — banco, backup, logs e transações

Documento canônico do estado atual após a etapa de hardening (`apps/desktop`).

## Arquitetura

```text
Renderer (React) → Preload (contextBridge) → IPC → Main → better-sqlite3 → arquivo SQLite
```

Fonte de verdade de módulos de domínio: `src/main/modules/` (scaffolds legados `modulos/` / `banco/` removidos).

## Persistência

| Item | Caminho |
|------|---------|
| Banco | `{userData}/pdv-local.sqlite` |
| WAL / SHM | ao lado do banco (`*.sqlite-wal`, `*.sqlite-shm`) |
| Backups | `{userData}/backups/pdv-backup-v{schema}-{timestamp}-{motivo}.sqlite` |
| Logs | `{userData}/logs/pdv-YYYY-MM-DD.log` |

`userData` vem de `app.getPath('userData')` (Electron). Nunca gravar banco em `src`, `out`, `resources` ou temp de build.

### Pragmas aplicados em toda abertura

| Pragma | Valor | Motivo |
|--------|-------|--------|
| `foreign_keys` | `ON` | Integridade referencial obrigatória |
| `journal_mode` | `WAL` | Melhor concorrência leitura/escrita em desktop |
| `busy_timeout` | `5000` | Evita `SQLITE_BUSY` imediato |
| `synchronous` | `NORMAL` | Equilíbrio durabilidade × desempenho com WAL |
| `cache_size` | `-8000` | ~8 MB de cache |
| `temp_store` | `MEMORY` | Temporários em RAM |

Banco em memória (`:memory:`) só para testes explícitos — nunca em produção.

### Compatibilidade com instalações sql.js

O fluxo antigo exportava bytes SQLite válidos para `pdv-local.sqlite`. O better-sqlite3 abre o **mesmo arquivo**. Antes de migrations estruturais, é criado backup. Se a migration falhar: rollback da transação + arquivo original preservado + backup `pre-migration`.

## Migrations

- **Fonte de verdade executável:** `src/main/database/migracoes/registro-migracoes.ts`
- Arquivos `00xx-*.sql` na mesma pasta são espelho documental (não executados isoladamente).
- Versão em `app_metadata.chave = 'schema_version'`.
- Versão atual após hardening: **17** (`0017-pagamento-fk-divisao-parte`).

### Migration 17 — FK pagamento ↔ parte

Reconstrói `pagamento_pedido` com:

```sql
FOREIGN KEY (pedido_divisao_parte_id) REFERENCES pedido_divisao_parte (id)
```

Preserva todos os pagamentos (incluindo `pedido_divisao_parte_id IS NULL`). Referências órfãs falham na cópia por causa da FK.

Validação de domínio adicional (parte pertence à divisão do mesmo pedido) permanece no main, dentro da transação de pagamento de parte.

## Transações financeiras

Helper: `executarEmTransacaoImediata(conexao, fn)` → `BEGIN IMMEDIATE` … `COMMIT` / `ROLLBACK`.

Leituras que fundamentam decisão financeira devem ocorrer **dentro** da mesma transação das escritas. O renderer não conhece detalhes transacionais.

## Backup e recuperação

- Backup automático no boot (intervalo mínimo configurável, default 12 h).
- Backup obrigatório antes de migrations pendentes.
- Retenção default: **14** arquivos.
- `PRAGMA integrity_check` na abertura; falha → `ErroIntegridadeBanco`, diálogo ao usuário, **sem restore automático**.
- Função testável: `restaurarBackup(caminhoBackup, caminhoBanco)` (preserva cópia `*.pre-restore-*`).

## Logs

- JSON lines em `logs/`.
- Handlers: `uncaughtException`, `unhandledRejection`.
- Contexto: operação, ids de pedido/pagamento/divisão, código de domínio, stack, versão app/schema.
- Renderer continua recebendo mensagem amigável + código via IPC; stack não é exibida na UI.

## Empacotamento Windows / native module

Após `npm install`, sempre rode:

```bash
npm run rebuild:native
```

Instala **Visual Studio Build Tools 2022** com workload **Desktop development with C++** (MSVC + Windows SDK).

O script gera dois binários:

| Arquivo | Uso |
|---------|-----|
| `node_modules/better-sqlite3/electron/better_sqlite3.node` | Electron (app) via `nativeBinding` |
| `node_modules/better-sqlite3/build/Release/better_sqlite3.node` | Node (vitest) |

`better-sqlite3@11.8.1` é usado porque a v13 apresentou crash no Electron 34 no Windows.

`better-sqlite3` está em `external` do bundle main (`electron.vite.config.ts`).

## Testes

| Suíte | Caminho |
|-------|---------|
| Unit + migrations/backup/FK | `tests/unit/conexao-sqlite.test.ts` |
| Transações / divisão | `tests/unit/hardening/transacoes-financeiras.test.ts` |
| Persistência integração | `tests/integration/hardening-persistencia.test.ts` |
| E2E UI (requer rebuild Electron) | `tests/e2e/hardening-persistencia.spec.ts` |

## Domínios já implementados

Caixa, pedidos/itens, mesas (transferência/agrupamento), delivery (taxa), pagamentos parciais/cortesia, divisão de conta, pizzas, referência sequencial de pedido.

## Limitações conhecidas

- Rebuild nativo do Electron depende do ambiente Windows com VS.
- Restore de backup ainda sem tela administrativa — apenas API interna + orientação no diálogo de integridade.
- Rebuild nativo do Electron deve ser validado manualmente no Windows empacotado após `npm run rebuild:native`.

## Recuperação rápida (integridade)

1. Anotar caminho do backup mais recente no diálogo / logs.
2. Fechar o PDV.
3. Em `{userData}`, renomear `pdv-local.sqlite` (e `-wal`/`-shm` se existirem).
4. Copiar o backup escolhido para `pdv-local.sqlite`.
5. Reabrir o app e conferir `schema_version` nos logs.
