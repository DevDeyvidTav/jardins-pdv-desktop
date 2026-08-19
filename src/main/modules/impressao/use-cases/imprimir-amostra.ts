import {
  TIPO_DOCUMENTO_IMPRESSAO,
  type ImprimirAmostraEntrada,
  type ResultadoImpressaoAmostra,
} from '@shared/types/impressao'
import { registrarLog } from '../../../logging/logger'
import { CODIGOS_ERRO_IMPRESSAO, ErroImpressao } from '../errors/erros-impressao'
import { codificarCupomEscPos } from '../infraestrutura/encoder-escpos'
import { enviarBufferImpressora } from '../infraestrutura/enviar-impressora'
import {
  criarDocumentoComandaAmostra,
  criarDocumentoContaAmostra,
} from '../templates/dados-amostra'
import { montarComanda } from '../templates/montar-comanda'
import { montarConta } from '../templates/montar-conta'

export function criarImprimirAmostra(
  enviarBuffer = enviarBufferImpressora,
) {
  return function imprimirAmostra(
    entrada: ImprimirAmostraEntrada,
  ): ResultadoImpressaoAmostra {
    const linhas =
      entrada.tipo === TIPO_DOCUMENTO_IMPRESSAO.CONTA
        ? montarConta(criarDocumentoContaAmostra())
        : montarComandaDoSetor(entrada)

    const texto = linhas.join('\n')
    let impresso = false
    let aviso: string | null = null

    try {
      enviarBuffer(codificarCupomEscPos(linhas))
      impresso = true
      registrarLog('info', 'impressao_amostra_enviada', {
        operacao: 'impressao.imprimirAmostra',
        tipo: entrada.tipo,
        setor: entrada.setor ?? null,
      })
    } catch (erro) {
      aviso =
        erro instanceof Error
          ? erro.message
          : 'Nao foi possivel enviar o cupom para a impressora.'
      registrarLog('warn', 'impressao_amostra_falhou_envio', {
        operacao: 'impressao.imprimirAmostra',
        tipo: entrada.tipo,
        setor: entrada.setor ?? null,
        codigoErro: CODIGOS_ERRO_IMPRESSAO.FALHA_ENVIO_IMPRESSORA,
      })
    }

    return {
      tipo: entrada.tipo,
      setor: entrada.setor ?? null,
      linhas,
      texto,
      impresso,
      aviso,
    }
  }
}

function montarComandaDoSetor(entrada: ImprimirAmostraEntrada) {
  if (!entrada.setor) {
    throw new ErroImpressao(
      CODIGOS_ERRO_IMPRESSAO.SETOR_OBRIGATORIO,
      'Setor e obrigatorio para comanda.',
    )
  }

  return montarComanda(criarDocumentoComandaAmostra(entrada.setor))
}

export const imprimirAmostra = criarImprimirAmostra()
