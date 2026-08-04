import { describe, expect, it } from 'vitest'
import { extrairMensagemErroIpc } from '../../src/shared/utils/erro-ipc'

describe('extrairMensagemErroIpc', () => {
  it('remove prefixo tecnico do Electron IPC', () => {
    const mensagem = extrairMensagemErroIpc(
      new Error(
        "Error invoking remote method 'produtos:excluir-categoria': ErroProdutos: Nao e possivel excluir esta categoria enquanto houver produtos vinculados.",
      ),
    )

    expect(mensagem).toBe(
      'Nao e possivel excluir esta categoria enquanto houver produtos vinculados.',
    )
  })

  it('mantem mensagem simples de Error', () => {
    expect(extrairMensagemErroIpc(new Error('Falha objetiva.'))).toBe('Falha objetiva.')
  })
})
