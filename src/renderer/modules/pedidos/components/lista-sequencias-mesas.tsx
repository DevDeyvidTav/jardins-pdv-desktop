import { useMemo, useState } from 'react'
import type { Mesa, SequenciaMesas, TipoUsoMesa } from '@shared/types/mesa'
import { TIPO_USO_MESA } from '@shared/types/mesa'
import { agruparSequenciasMesas } from '@shared/utils/agrupar-sequencias-mesas'

interface ListaSequenciasMesasProps {
  mesas: Mesa[]
  carregando: boolean
  onExcluirSequencia: (
    numeroInicial: number,
    numeroFinal: number,
    tipoUso: TipoUsoMesa,
  ) => Promise<boolean>
}

function rotuloTipo(tipoUso: TipoUsoMesa): string {
  if (tipoUso === TIPO_USO_MESA.BALCAO) {
    return 'Balcao'
  }
  if (tipoUso === TIPO_USO_MESA.DELIVERY) {
    return 'Delivery'
  }
  return 'Mesa comum'
}

function rotuloIntervalo(sequencia: SequenciaMesas): string {
  if (sequencia.numeroInicial === sequencia.numeroFinal) {
    return String(sequencia.numeroInicial)
  }
  return `${sequencia.numeroInicial}–${sequencia.numeroFinal}`
}

export function ListaSequenciasMesas({
  mesas,
  carregando,
  onExcluirSequencia,
}: ListaSequenciasMesasProps) {
  const sequencias = useMemo(() => agruparSequenciasMesas(mesas), [mesas])
  const [excluindoChave, setExcluindoChave] = useState<string | null>(null)

  if (sequencias.length === 0) {
    return (
      <div className="lista-sequencias-mesas" data-testid="lista-sequencias-mesas">
        <h3 className="lista-sequencias-mesas__titulo">Sequencias cadastradas</h3>
        <p className="lista-sequencias-mesas__vazio">Nenhuma sequencia cadastrada ainda.</p>
      </div>
    )
  }

  return (
    <div className="lista-sequencias-mesas" data-testid="lista-sequencias-mesas">
      <h3 className="lista-sequencias-mesas__titulo">Sequencias cadastradas</h3>
      <p className="lista-sequencias-mesas__ajuda">
        So e possivel apagar se nenhuma posicao da sequencia estiver com pedido aberto.
      </p>
      <ul className="lista-sequencias-mesas__lista">
        {sequencias.map((sequencia) => {
          const chave = `${sequencia.tipoUso}:${sequencia.numeroInicial}-${sequencia.numeroFinal}`
          const excluindo = excluindoChave === chave

          return (
            <li
              key={chave}
              className="lista-sequencias-mesas__item"
              data-testid="item-sequencia-mesa"
              data-tipo-uso={sequencia.tipoUso}
            >
              <div className="lista-sequencias-mesas__info">
                <strong>{rotuloTipo(sequencia.tipoUso)}</strong>
                <span>
                  {rotuloIntervalo(sequencia)} · {sequencia.quantidade}{' '}
                  {sequencia.quantidade === 1 ? 'posicao' : 'posicoes'}
                </span>
              </div>
              <button
                type="button"
                className="lista-sequencias-mesas__apagar"
                data-testid="botao-apagar-sequencia-mesa"
                disabled={carregando || excluindo}
                onClick={() => {
                  const confirmar = window.confirm(
                    `Apagar a sequencia ${rotuloTipo(sequencia.tipoUso)} ${rotuloIntervalo(sequencia)}? So funciona se nao houver pedido aberto.`,
                  )
                  if (!confirmar) {
                    return
                  }
                  setExcluindoChave(chave)
                  void onExcluirSequencia(
                    sequencia.numeroInicial,
                    sequencia.numeroFinal,
                    sequencia.tipoUso,
                  ).finally(() => setExcluindoChave(null))
                }}
              >
                {excluindo ? 'Apagando…' : 'Apagar'}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
