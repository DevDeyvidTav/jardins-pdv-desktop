import type {
  ContaTalaoCliente,
  ListarContasTalaoEntrada,
  ObterContaTalaoEntrada,
  RegistrarBaixaTalaoEntrada,
  TalaoBaixa,
} from '@shared/types/talao'
import { FORMAS_PAGAMENTO_BAIXA_TALAO } from '@shared/types/pagamento-pedido'
import { competenciaAtualUtc } from '@shared/utils/data-hora'
import { STATUS_SESSAO_CAIXA } from '@shared/types/sessao-caixa'
import { CODIGOS_ERRO_CLIENTES, ErroClientes } from '../errors/erros-clientes'
import {
  criarClienteRepository,
  type ClienteRepository,
} from '../repositories/cliente.repository'
import {
  criarTalaoRepository,
  type TalaoRepository,
} from '../repositories/talao.repository'
import {
  criarSessaoCaixaRepository,
  type SessaoCaixaRepository,
} from '../../caixa/repositories/sessao-caixa.repository'
import { registrarTalaoBaixaSync } from '../../sincronizacao/services/registrar-cadastro-sync'

function montarConta(
  repositorioCliente: ClienteRepository,
  repositorioTalao: TalaoRepository,
  clienteId: string,
  competencia: string,
): ContaTalaoCliente {
  const cliente = repositorioCliente.buscarPorId(clienteId)
  if (!cliente) {
    throw new ErroClientes(
      CODIGOS_ERRO_CLIENTES.CLIENTE_NAO_ENCONTRADO,
      'Cliente nao encontrado.',
    )
  }

  const lancamentos = repositorioTalao.listarLancamentos(clienteId, competencia)
  const baixas = repositorioTalao.listarBaixas(clienteId, competencia)
  const totalLancadoCentavos = lancamentos.reduce((acc, item) => acc + item.valorCentavos, 0)
  const totalBaixadoCentavos = baixas.reduce((acc, item) => acc + item.valorCentavos, 0)

  return {
    cliente,
    competencia,
    totalLancadoCentavos,
    totalBaixadoCentavos,
    saldoCentavos: totalLancadoCentavos - totalBaixadoCentavos,
    lancamentos,
    baixas,
  }
}

export function criarObterContaTalao(
  repositorioCliente: ClienteRepository = criarClienteRepository(),
  repositorioTalao: TalaoRepository = criarTalaoRepository(),
) {
  return function obterContaTalao(entrada: ObterContaTalaoEntrada): ContaTalaoCliente {
    return montarConta(
      repositorioCliente,
      repositorioTalao,
      entrada.clienteId,
      entrada.competencia ?? competenciaAtualUtc(),
    )
  }
}

export const obterContaTalao = criarObterContaTalao()

export function criarListarContasTalao(
  repositorioCliente: ClienteRepository = criarClienteRepository(),
  repositorioTalao: TalaoRepository = criarTalaoRepository(),
) {
  return function listarContasTalao(
    entrada: ListarContasTalaoEntrada = {},
  ): ContaTalaoCliente[] {
    const competencia = entrada.competencia ?? competenciaAtualUtc()
    const idsMovimento = new Set(repositorioTalao.listarClienteIdsComMovimento(competencia))
    const clientesTalao = repositorioCliente.listar({
      apenasAtivos: true,
      apenasComTalao: true,
    })

    const ids = new Set([...idsMovimento, ...clientesTalao.map((c) => c.id)])
    const contas = [...ids]
      .map((id) => montarConta(repositorioCliente, repositorioTalao, id, competencia))
      .sort((a, b) => a.cliente.nome.localeCompare(b.cliente.nome, 'pt-BR'))

    if (entrada.apenasComSaldo) {
      return contas.filter((conta) => conta.saldoCentavos > 0)
    }
    return contas
  }
}

export const listarContasTalao = criarListarContasTalao()

export function criarRegistrarBaixaTalao(
  repositorioCliente: ClienteRepository = criarClienteRepository(),
  repositorioTalao: TalaoRepository = criarTalaoRepository(),
  repositorioSessao: SessaoCaixaRepository = criarSessaoCaixaRepository(),
) {
  return function registrarBaixaTalao(entrada: RegistrarBaixaTalaoEntrada): TalaoBaixa {
    if (entrada.valorCentavos <= 0) {
      throw new ErroClientes(
        CODIGOS_ERRO_CLIENTES.ENTRADA_INVALIDA,
        'Valor da baixa deve ser maior que zero.',
      )
    }

    if (
      !(FORMAS_PAGAMENTO_BAIXA_TALAO as readonly string[]).includes(entrada.formaPagamento)
    ) {
      throw new ErroClientes(
        CODIGOS_ERRO_CLIENTES.FORMA_PAGAMENTO_INVALIDA,
        'Forma de pagamento invalida para baixa de talao.',
      )
    }

    const sessao = repositorioSessao.buscarSessaoAberta()
    if (!sessao || sessao.status !== STATUS_SESSAO_CAIXA.ABERTO) {
      throw new ErroClientes(
        CODIGOS_ERRO_CLIENTES.CAIXA_NAO_ABERTO,
        'Abra o caixa antes de dar baixa no talao.',
      )
    }

    const cliente = repositorioCliente.buscarPorId(entrada.clienteId)
    if (!cliente) {
      throw new ErroClientes(
        CODIGOS_ERRO_CLIENTES.CLIENTE_NAO_ENCONTRADO,
        'Cliente nao encontrado.',
      )
    }

    const competencia = entrada.competencia ?? competenciaAtualUtc()
    const lancado = repositorioTalao.somarLancamentos(cliente.id, competencia)
    const baixado = repositorioTalao.somarBaixas(cliente.id, competencia)
    const saldo = lancado - baixado

    if (entrada.valorCentavos > saldo) {
      throw new ErroClientes(
        CODIGOS_ERRO_CLIENTES.SALDO_INSUFICIENTE,
        'Valor da baixa nao pode ser maior que o saldo do talao no mes.',
      )
    }

    const baixa = repositorioTalao.inserirBaixa({
      clienteId: cliente.id,
      sessaoCaixaId: sessao.id,
      formaPagamento: entrada.formaPagamento,
      valorCentavos: entrada.valorCentavos,
      competencia,
      observacao: entrada.observacao?.trim() || null,
    })
    registrarTalaoBaixaSync(baixa)
    return baixa
  }
}

export const registrarBaixaTalao = criarRegistrarBaixaTalao()
