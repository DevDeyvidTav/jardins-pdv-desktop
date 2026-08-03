import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  erro: Error | null
}

export class ErrorBoundaryApp extends Component<Props, State> {
  state: State = { erro: null }

  static getDerivedStateFromError(erro: Error): State {
    return { erro }
  }

  componentDidCatch(erro: Error, info: ErrorInfo): void {
    console.error('[renderer] Erro na interface:', erro, info.componentStack)
  }

  render() {
    if (this.state.erro) {
      return (
        <main
          style={{
            minHeight: '100vh',
            padding: '2rem',
            fontFamily: 'Segoe UI, system-ui, sans-serif',
            background: '#f3f4f6',
            color: '#111827',
          }}
          data-testid="erro-boundary-app"
        >
          <h1 style={{ marginTop: 0 }}>Falha ao carregar a interface</h1>
          <p style={{ color: '#4b5563' }}>
            A tela ficou em branco por um erro no React. Detalhe tecnico:
          </p>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: '1rem',
            }}
          >
            {this.state.erro.message}
          </pre>
          <button
            type="button"
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              background: '#111827',
              color: '#fff',
              cursor: 'pointer',
            }}
            onClick={() => window.location.reload()}
          >
            Recarregar
          </button>
        </main>
      )
    }

    return this.props.children
  }
}
