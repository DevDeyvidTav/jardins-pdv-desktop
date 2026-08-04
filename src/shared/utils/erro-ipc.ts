/**
 * Normaliza erros vindos do IPC do Electron para exibicao na UI.
 * Remove o prefixo tecnico "Error invoking remote method '...': ErroX: ".
 */
export function extrairMensagemErroIpc(causa: unknown): string {
  if (causa instanceof Error && causa.message.trim() !== '') {
    return limparMensagemIpc(causa.message)
  }

  if (typeof causa === 'string' && causa.trim() !== '') {
    return limparMensagemIpc(causa)
  }

  if (causa && typeof causa === 'object' && 'message' in causa) {
    const mensagem = String((causa as { message: unknown }).message ?? '')
    if (mensagem.trim() !== '') {
      return limparMensagemIpc(mensagem)
    }
  }

  return 'Nao foi possivel concluir a operacao.'
}

function limparMensagemIpc(mensagem: string): string {
  const semPrefixoInvoke = mensagem.replace(
    /^Error invoking remote method '[^']+':\s*/i,
    '',
  )

  const semPrefixoClasse = semPrefixoInvoke.replace(
    /^(Erro[A-Za-z]+|Error):\s*/i,
    '',
  )

  return semPrefixoClasse.trim() || 'Nao foi possivel concluir a operacao.'
}
