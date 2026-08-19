import {
  SETOR_COZINHA,
  type DocumentoComandaImpressao,
  type DocumentoContaImpressao,
  type ItemDocumentoImpressao,
  type SetorCozinha,
} from '@shared/types/impressao'

export const EMITIDO_EM_AMOSTRA = '2026-08-17T22:40:00.000Z'

const ITEM_PIZZA: ItemDocumentoImpressao = {
  quantidade: 1,
  nome: 'Pizza G',
  detalhes: ['Calabresa', 'Mussarela'],
  observacao: 'sem cebola',
  precoUnitarioCentavos: 5500,
  totalCentavos: 5500,
  setor: SETOR_COZINHA.PIZZA,
  cancelado: false,
}

const ITEM_JAPONES: ItemDocumentoImpressao = {
  quantidade: 1,
  nome: 'Combinado 20 pecas',
  detalhes: [],
  observacao: 'sem wasabi',
  precoUnitarioCentavos: 4800,
  totalCentavos: 4800,
  setor: SETOR_COZINHA.JAPONESA,
  cancelado: false,
}

const ITEM_CHINES: ItemDocumentoImpressao = {
  quantidade: 1,
  nome: 'Yakisoba carne',
  detalhes: [],
  observacao: null,
  precoUnitarioCentavos: 3200,
  totalCentavos: 3200,
  setor: SETOR_COZINHA.CHINESA,
  cancelado: false,
}

const ITEM_CANCELADO: ItemDocumentoImpressao = {
  quantidade: 1,
  nome: 'Refrigerante lata',
  detalhes: [],
  observacao: null,
  precoUnitarioCentavos: 600,
  totalCentavos: 600,
  setor: SETOR_COZINHA.CHINESA,
  cancelado: true,
}

export function criarDocumentoContaAmostra(): DocumentoContaImpressao {
  return {
    estabelecimento: 'JARDINS',
    tipoPedido: 'MESA',
    mesaNumero: 12,
    referencia: 104,
    emitidoEm: EMITIDO_EM_AMOSTRA,
    itens: [ITEM_PIZZA, ITEM_JAPONES, ITEM_CHINES, ITEM_CANCELADO],
    subtotalCentavos: 13500,
    descontoItensCentavos: 0,
    descontoPedidoCentavos: 500,
    taxaEntregaCentavos: 0,
    totalCentavos: 13000,
    valorPagoCentavos: 5000,
    valorCortesiaCentavos: 0,
    valorRestanteCentavos: 8000,
    pagamentos: [{ formaRotulo: 'Dinheiro', valorCentavos: 5000 }],
  }
}

export function criarDocumentoComandaAmostra(
  setor: SetorCozinha,
): DocumentoComandaImpressao {
  const conta = criarDocumentoContaAmostra()

  return {
    setor,
    tipoPedido: conta.tipoPedido,
    mesaNumero: conta.mesaNumero,
    referencia: conta.referencia,
    emitidoEm: conta.emitidoEm,
    itens: conta.itens.filter((item) => item.setor === setor),
    via: '1a via',
  }
}
