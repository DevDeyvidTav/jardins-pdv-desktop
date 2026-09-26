import { useEffect, useState } from 'react'
import { useAtualizacao } from '../hooks/use-atualizacao'
import './modal-atualizacao.css'

export function ModalAtualizacao() {
  const { estado, erro, instalar } = useAtualizacao()
  const [adiadaPara, setAdiadaPara] = useState<string | null>(null)

  const versao = estado?.versaoDisponivel ?? null
  const pronta = Boolean(estado?.baixada && versao)
  const baixando = Boolean(estado?.baixando && versao)
  const adiada = Boolean(versao && adiadaPara === versao)

  useEffect(() => {
    if (versao && adiadaPara && adiadaPara !== versao) {
      setAdiadaPara(null)
    }
  }, [versao, adiadaPara])

  if (!pronta && !baixando) {
    return null
  }

  if (pronta && adiada) {
    return null
  }

  if (baixando && !pronta) {
    return (
      <div className="aviso-atualizacao" data-testid="aviso-atualizacao-baixando" role="status">
        <p>
          Nova versão {versao} encontrada. Baixando
          {estado?.progressoPercentual != null ? ` ${estado.progressoPercentual}%` : '...'}
        </p>
      </div>
    )
  }

  return (
    <div className="modal-atualizacao" data-testid="modal-atualizacao">
      <div className="modal-atualizacao__conteudo">
        <h2>Atualização pronta</h2>
        <p>
          A versão <strong>{versao}</strong> já foi baixada. Reinicie o PDV para
          instalar. Pedidos e dados do caixa ficam no computador.
        </p>
        {erro || estado?.erro ? (
          <p className="modal-atualizacao__erro" role="alert">
            {erro ?? estado?.erro}
          </p>
        ) : null}
        <div className="modal-atualizacao__acoes">
          <button
            type="button"
            className="modal-atualizacao__secundario"
            onClick={() => {
              if (versao) {
                setAdiadaPara(versao)
              }
            }}
          >
            Depois
          </button>
          <button
            type="button"
            className="modal-atualizacao__primario"
            data-testid="botao-instalar-atualizacao"
            onClick={() => void instalar()}
          >
            Reiniciar e atualizar
          </button>
        </div>
      </div>
    </div>
  )
}
