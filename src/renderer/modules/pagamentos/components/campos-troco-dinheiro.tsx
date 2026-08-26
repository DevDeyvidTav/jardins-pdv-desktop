import { converterReaisParaCentavos, formatarMoeda } from '@shared/utils/moeda'
import {
  calcularTrocoDinheiro,
  cedulasAtalhoParaRecebido,
} from '@shared/utils/troco-dinheiro'

interface Props {
  valorAplicadoCentavos: number | null
  valorRecebido: string
  onValorRecebidoChange: (valor: string) => void
  disabled?: boolean
}

function formatarCentavosParaInput(centavos: number): string {
  return (centavos / 100).toFixed(2).replace('.', ',')
}

export function CamposTrocoDinheiro({
  valorAplicadoCentavos,
  valorRecebido,
  onValorRecebidoChange,
  disabled = false,
}: Props) {
  const aplicado = valorAplicadoCentavos ?? 0
  const recebidoDigitado = converterReaisParaCentavos(valorRecebido)
  const recebidoEfetivo = valorRecebido.trim() === '' ? aplicado : recebidoDigitado
  const recebidoInsuficiente =
    recebidoEfetivo != null && aplicado > 0 && recebidoEfetivo < aplicado
  const trocoCentavos =
    recebidoEfetivo != null && !recebidoInsuficiente
      ? calcularTrocoDinheiro(aplicado, recebidoEfetivo)
      : null
  const atalhos = aplicado > 0 ? cedulasAtalhoParaRecebido(aplicado) : []

  return (
    <div className="campos-troco-dinheiro" data-testid="campos-troco-dinheiro">
      <label className="campos-troco-dinheiro__campo">
        Recebido
        <input
          data-testid="campo-valor-recebido"
          value={valorRecebido}
          onChange={(evento) => onValorRecebidoChange(evento.target.value)}
          placeholder="0,00"
          inputMode="decimal"
          disabled={disabled}
        />
      </label>
      {aplicado > 0 ? (
        <div className="campos-troco-dinheiro__atalhos" data-testid="atalhos-troco">
          <button
            type="button"
            data-testid="atalho-sem-troco"
            disabled={disabled}
            onClick={() => onValorRecebidoChange(formatarCentavosParaInput(aplicado))}
          >
            Sem troco
          </button>
          {atalhos.map((cedula) => (
            <button
              key={cedula}
              type="button"
              data-testid={`atalho-cedula-${cedula}`}
              disabled={disabled}
              onClick={() => onValorRecebidoChange(formatarCentavosParaInput(cedula))}
            >
              {formatarMoeda(cedula)}
            </button>
          ))}
        </div>
      ) : null}
      {recebidoInsuficiente ? (
        <p className="campos-troco-dinheiro__aviso" role="status">
          Valor recebido menor que o pagamento.
        </p>
      ) : (
        <p className="campos-troco-dinheiro__troco" data-testid="valor-troco">
          Troco: {formatarMoeda(trocoCentavos ?? 0)}
        </p>
      )}
    </div>
  )
}
