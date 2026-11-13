export function normalizarCpf(valor: string | null | undefined): string {
  return (valor ?? '').replace(/\D/g, '')
}

export function cpfEhValido(valor: string | null | undefined): boolean {
  const cpf = normalizarCpf(valor)
  if (cpf.length !== 11) {
    return false
  }

  if (/^(\d)\1{10}$/.test(cpf)) {
    return false
  }

  const calcularDigito = (base: string, pesoInicial: number): number => {
    let soma = 0
    for (let indice = 0; indice < base.length; indice += 1) {
      soma += Number(base[indice]) * (pesoInicial - indice)
    }
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }

  const primeiro = calcularDigito(cpf.slice(0, 9), 10)
  const segundo = calcularDigito(cpf.slice(0, 10), 11)
  return primeiro === Number(cpf[9]) && segundo === Number(cpf[10])
}

export function formatarCpf(valor: string | null | undefined): string {
  const cpf = normalizarCpf(valor)
  if (cpf.length !== 11) {
    return cpf
  }

  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`
}

export function normalizarDocumentoNota(valor: string | null | undefined): string {
  return (valor ?? '').replace(/\D/g, '').slice(0, 14)
}

export function cnpjEhValido(valor: string | null | undefined): boolean {
  const cnpj = normalizarDocumentoNota(valor)
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
    return false
  }

  const calcularDigito = (base: string, pesos: number[]): number => {
    const soma = base.split('').reduce((total, digito, indice) => {
      return total + Number(digito) * pesos[indice]
    }, 0)
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }

  const primeiro = calcularDigito(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const segundo = calcularDigito(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  return primeiro === Number(cnpj[12]) && segundo === Number(cnpj[13])
}

/** Máscara progressiva: até 11 dígitos fica CPF; a partir do 12º, CNPJ. */
export function mascararCpfCnpj(valor: string | null | undefined): string {
  const digitos = normalizarDocumentoNota(valor)
  if (digitos.length <= 11) {
    let mascarado = digitos.slice(0, 3)
    if (digitos.length > 3) mascarado += `.${digitos.slice(3, 6)}`
    if (digitos.length > 6) mascarado += `.${digitos.slice(6, 9)}`
    if (digitos.length > 9) mascarado += `-${digitos.slice(9, 11)}`
    return mascarado
  }

  let mascarado = digitos.slice(0, 2)
  if (digitos.length > 2) mascarado += `.${digitos.slice(2, 5)}`
  if (digitos.length > 5) mascarado += `.${digitos.slice(5, 8)}`
  if (digitos.length > 8) mascarado += `/${digitos.slice(8, 12)}`
  if (digitos.length > 12) mascarado += `-${digitos.slice(12, 14)}`
  return mascarado
}

export function resolverDocumentoNota(
  valor: string | null | undefined,
): { ok: true; documento: string | null } | { ok: false; motivo: string } {
  const digitos = normalizarDocumentoNota(valor)
  if (digitos.length === 0) {
    return { ok: true, documento: null }
  }
  if (digitos.length === 11 && cpfEhValido(digitos)) {
    return { ok: true, documento: digitos }
  }
  if (digitos.length === 14 && cnpjEhValido(digitos)) {
    return { ok: true, documento: digitos }
  }
  return { ok: false, motivo: 'CPF ou CNPJ da nota invalido.' }
}
