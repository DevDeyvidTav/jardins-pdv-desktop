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
