import { useEffect, useState } from 'react'
import type { InformacoesSistema } from '@shared/types/informacoes-sistema'
import { StatusFundacao } from '../components/status-fundacao'
import './pagina-inicial.css'

export function PaginaInicial() {
  const [informacoes, setInformacoes] = useState<InformacoesSistema | null>(
    null,
  )
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    async function carregarInformacoes() {
      try {
        const dados = await window.pdv.sistema.obterInformacoes()
        setInformacoes(dados)
      } catch (causa) {
        const mensagem =
          causa instanceof Error
            ? causa.message
            : 'Nao foi possivel obter informacoes do sistema.'
        setErro(mensagem)
      }
    }

    void carregarInformacoes()
  }, [])

  return (
    <main className="pagina-inicial" data-testid="pagina-inicial">
      <section className="pagina-inicial__cartao">
        <p className="pagina-inicial__etiqueta">Fundacao desktop</p>
        <h1 data-testid="nome-sistema">
          {informacoes?.nomeAplicacao ?? 'PDV Restaurante'}
        </h1>
        <p className="pagina-inicial__mensagem">
          A fundacao do aplicativo desktop foi configurada com sucesso. Os
          proximos modulos do PDV podem ser implementados sobre esta base.
        </p>

        {erro ? (
          <p className="pagina-inicial__erro" role="alert">
            {erro}
          </p>
        ) : null}

        {informacoes ? <StatusFundacao informacoes={informacoes} /> : null}

        {!informacoes && !erro ? (
          <p className="pagina-inicial__carregando">Carregando status...</p>
        ) : null}
      </section>
    </main>
  )
}
