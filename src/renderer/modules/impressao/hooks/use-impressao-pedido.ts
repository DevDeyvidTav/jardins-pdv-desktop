import { useState } from 'react'
import type { ResultadoImpressao } from '@shared/types/impressao'
import { extrairMensagemErroIpc } from '@shared/utils/erro-ipc'

export function useImpressaoPedido() {
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  const executar = async (
    acao: (pedidoId: string) => Promise<ResultadoImpressao>,
    pedidoId: string,
    mensagemSucesso: string,
  ) => {
    setCarregando(true)
    setErro(null)
    setSucesso(null)

    try {
      if (
        typeof window.pdv.impressao?.imprimirConta !== 'function' ||
        typeof window.pdv.impressao?.imprimirComanda !== 'function'
      ) {
        setErro('Reinicie o aplicativo para carregar a impressao.')
        return null
      }

      const resultado = await acao(pedidoId)
      if (resultado.impresso) {
        setSucesso(mensagemSucesso)
      } else {
        setSucesso('Cupom montado. A impressora local nao recebeu o papel.')
        setErro(resultado.aviso)
      }
      return resultado
    } catch (causa) {
      setErro(extrairMensagemErroIpc(causa))
      return null
    } finally {
      setCarregando(false)
    }
  }

  return {
    carregando,
    erro,
    sucesso,
    imprimirConta: (pedidoId: string) =>
      executar(
        (id) => window.pdv.impressao.imprimirConta({ pedidoId: id }),
        pedidoId,
        'Conta enviada para a impressora.',
      ),
    imprimirComanda: (pedidoId: string) =>
      executar(
        (id) => window.pdv.impressao.imprimirComanda({ pedidoId: id }),
        pedidoId,
        'Comanda enviada para a impressora.',
      ),
  }
}
