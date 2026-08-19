import Database from 'better-sqlite3'

type ParametroSql = string | number | null | Uint8Array | bigint

/**
 * Adaptador de Statement com API compatível com sql.js
 * (prepare → bind → step → getAsObject → free).
 */
export class StatementCompativel {
  private readonly statement: Database.Statement
  private parametros: ParametroSql[] = []
  private linhas: Record<string, unknown>[] | null = null
  private indice = -1
  private atual: Record<string, unknown> | null = null

  constructor(statement: Database.Statement) {
    this.statement = statement
  }

  bind(parametros: ParametroSql[] = []): void {
    this.parametros = parametros
    this.linhas = null
    this.indice = -1
    this.atual = null
  }

  step(): boolean {
    if (this.linhas === null) {
      this.linhas = this.statement.all(...this.parametros) as Record<
        string,
        unknown
      >[]
      this.indice = -1
    }

    this.indice += 1
    if (this.indice < this.linhas.length) {
      this.atual = this.linhas[this.indice]!
      return true
    }

    this.atual = null
    return false
  }

  getAsObject(): Record<string, unknown> {
    return this.atual ?? {}
  }

  free(): void {
    this.linhas = null
    this.atual = null
    this.indice = -1
    this.parametros = []
  }
}

export type ResultadoExecSqlJs = Array<{
  columns: string[]
  values: unknown[][]
}>

/**
 * Adaptador de Database com API compatível com sql.js
 * (prepare / run / exec / close).
 */
export class DatabaseCompativel {
  private alteracoesRecentes = 0

  constructor(readonly nativo: Database.Database) {}

  prepare(sql: string): StatementCompativel {
    return new StatementCompativel(this.nativo.prepare(sql))
  }

  run(sql: string, parametros?: ParametroSql[]): void {
    if (parametros !== undefined) {
      const info = this.nativo.prepare(sql).run(...parametros)
      this.alteracoesRecentes = info.changes
      return
    }
    this.nativo.exec(sql)
    this.alteracoesRecentes = 0
  }

  getRowsModified(): number {
    return this.alteracoesRecentes
  }

  exec(sql: string): ResultadoExecSqlJs {
    const resultados: ResultadoExecSqlJs = []

    try {
      if (/^\s*SELECT/i.test(sql.trim())) {
        const linhas = this.nativo.prepare(sql).all() as Record<
          string,
          unknown
        >[]
        if (linhas.length > 0) {
          const columns = Object.keys(linhas[0]!)
          resultados.push({
            columns,
            values: linhas.map((linha) =>
              columns.map((coluna) => linha[coluna]),
            ),
          })
        } else {
          resultados.push({ columns: [], values: [] })
        }
        return resultados
      }
    } catch {
      // fallback para exec puro
    }

    this.nativo.exec(sql)
    return resultados
  }

  close(): void {
    this.nativo.close()
  }
}
