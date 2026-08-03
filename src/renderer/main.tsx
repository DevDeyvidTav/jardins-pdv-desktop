import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { ErrorBoundaryApp } from './app/error-boundary-app'
import './app/estilos-globais.css'

const elementoRaiz = document.getElementById('root')

if (!elementoRaiz) {
  throw new Error('Elemento raiz do React nao encontrado.')
}

createRoot(elementoRaiz).render(
  <StrictMode>
    <ErrorBoundaryApp>
      <App />
    </ErrorBoundaryApp>
  </StrictMode>,
)
