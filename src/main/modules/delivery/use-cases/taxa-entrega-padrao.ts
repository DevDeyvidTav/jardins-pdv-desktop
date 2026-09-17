import type {
  DefinirTaxaEntregaPadraoEntrada,
  ObterTaxaEntregaPadraoResultado,
} from '@shared/types/pedido'
import {
  consultarValorMetadata,
  definirValorMetadata,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { ErroDelivery, CODIGOS_ERRO_DELIVERY } from '../errors/erros-delivery'
import { PERMISSAO_PDV } from '@shared/types/operador'
import { assertPermissaoOperador } from '../../configuracoes/services/contexto-sessao-operador'

export const CHAVE_TAXA_ENTREGA_PADRAO = 'taxa_entrega_padrao_centavos'

export function obterTaxaEntregaPadraoCentavos(): number {
  const conexao = obterConexaoBancoLocal()
  const valor = consultarValorMetadata(conexao, CHAVE_TAXA_ENTREGA_PADRAO)
  if (!valor) return 0
  const centavos = Number.parseInt(valor, 10)
  return Number.isNaN(centavos) || centavos < 0 ? 0 : centavos
}

export function criarObterTaxaEntregaPadrao() {
  return function obterTaxaEntregaPadrao(): ObterTaxaEntregaPadraoResultado {
    return { taxaEntregaPadraoCentavos: obterTaxaEntregaPadraoCentavos() }
  }
}

export function criarDefinirTaxaEntregaPadrao() {
  return function definirTaxaEntregaPadrao(
    entrada: DefinirTaxaEntregaPadraoEntrada,
  ): ObterTaxaEntregaPadraoResultado {
    assertPermissaoOperador(PERMISSAO_PDV.TAXA_ENTREGA_PADRAO)

    if (entrada.taxaEntregaPadraoCentavos < 0) {
      throw new ErroDelivery(
        CODIGOS_ERRO_DELIVERY.TAXA_ENTREGA_INVALIDA,
        'Taxa de entrega deve ser maior ou igual a zero.',
      )
    }

    const conexao = obterConexaoBancoLocal()
    definirValorMetadata(
      conexao,
      CHAVE_TAXA_ENTREGA_PADRAO,
      String(entrada.taxaEntregaPadraoCentavos),
    )

    return { taxaEntregaPadraoCentavos: entrada.taxaEntregaPadraoCentavos }
  }
}

export const obterTaxaEntregaPadrao = criarObterTaxaEntregaPadrao()
export const definirTaxaEntregaPadrao = criarDefinirTaxaEntregaPadrao()
