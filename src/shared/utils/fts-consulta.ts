/** Monta consulta FTS5 com prefixo por token (equivalente pratico ao tsquery do PostgreSQL). */
export function montarConsultaFts(termo: string): string | null {
  const tokens = termo
    .trim()
    .split(/\s+/)
    .map((parte) => parte.replace(/"/g, '""'))
    .filter(Boolean)

  if (tokens.length === 0) {
    return null
  }

  return tokens.map((token) => `"${token}"*`).join(' AND ')
}
