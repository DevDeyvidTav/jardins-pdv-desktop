import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import './app/estilos-globais.css'

const elementoRaiz = document.getElementById('root')

if (!elementoRaiz) {
  throw new Error('Elemento raiz do React nao encontrado.')
}

createRoot(elementoRaiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
