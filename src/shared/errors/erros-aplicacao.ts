export class ErroBancoLocal extends Error {
  constructor(mensagem: string, opcoes?: { cause?: unknown }) {
    super(mensagem)
    this.name = 'ErroBancoLocal'
    if (opcoes?.cause !== undefined) {
      this.cause = opcoes.cause
    }
  }
}

export class ErroInicializacaoAplicacao extends Error {
  constructor(mensagem: string, opcoes?: { cause?: unknown }) {
    super(mensagem)
    this.name = 'ErroInicializacaoAplicacao'
    if (opcoes?.cause !== undefined) {
      this.cause = opcoes.cause
    }
  }
}
