import type { CriarPedidoDeliveryEntrada, ResumoPedido } from '@shared/types/pedido'
import { TIPO_PEDIDO } from '@shared/types/pedido'
import { ErroDelivery, CODIGOS_ERRO_DELIVERY } from '../errors/erros-delivery'
import { CODIGOS_ERRO_CLIENTES, ErroClientes } from '../../clientes/errors/erros-clientes'
import {
  criarPedidoRepository,
  type PedidoRepository,
} from '../../pedidos/repositories/pedido.repository'
import {
  criarSessaoCaixaRepository,
  type SessaoCaixaRepository,
} from '../../caixa/repositories/sessao-caixa.repository'
import {
  criarPedidoEntregaRepository,
  type PedidoEntregaRepository,
} from '../repositories/pedido-entrega.repository'
import {
  criarClienteRepository,
  type ClienteRepository,
} from '../../clientes/repositories/cliente.repository'
import {
  executarEmTransacaoImediata,
  persistirConexaoBanco,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { registrarEventoPedidoSync } from '../../sincronizacao/services/registrar-evento-pedido'
import { registrarAcaoAuditoria } from '../../sincronizacao/services/registrar-acao-auditoria'
import { obterTaxaEntregaPadraoCentavos } from './taxa-entrega-padrao'

function normalizarOpcional(valor?: string | null): string | null {
  const texto = valor?.trim() ?? ''
  return texto.length > 0 ? texto : null
}

export function criarCriarPedidoDelivery(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioSessao: SessaoCaixaRepository = criarSessaoCaixaRepository(),
  repositorioEntrega: PedidoEntregaRepository = criarPedidoEntregaRepository(),
  obterConexao = obterConexaoBancoLocal,
  obterTaxaPadrao = obterTaxaEntregaPadraoCentavos,
  repositorioCliente: ClienteRepository = criarClienteRepository(),
) {
  return function criarPedidoDelivery(
    entrada: CriarPedidoDeliveryEntrada,
  ): ResumoPedido {
    const conexao = obterConexao()
    const nomeInformado = entrada.clienteNome?.trim() ?? ''
    if (nomeInformado.length === 1) {
      throw new ErroDelivery(
        CODIGOS_ERRO_DELIVERY.ENTRADA_INVALIDA,
        'Nome do cliente deve ter no minimo 2 caracteres quando informado.',
      )
    }

    const resultado = executarEmTransacaoImediata(conexao, () => {
      const sessao = repositorioSessao.buscarSessaoAberta()
      if (!sessao) {
        throw new ErroDelivery(
          CODIGOS_ERRO_DELIVERY.CAIXA_NAO_ABERTO,
          'Nao existe sessao de caixa aberta.',
        )
      }

      let clienteId: string | null = null
      let nome = nomeInformado
      let telefone = normalizarOpcional(entrada.telefone)
      let endereco = normalizarOpcional(entrada.endereco)

      if (entrada.clienteId) {
        const cliente = repositorioCliente.buscarPorId(entrada.clienteId)
        if (!cliente) {
          throw new ErroClientes(
            CODIGOS_ERRO_CLIENTES.CLIENTE_NAO_ENCONTRADO,
            'Cliente nao encontrado.',
          )
        }
        if (!cliente.ativo) {
          throw new ErroClientes(
            CODIGOS_ERRO_CLIENTES.CLIENTE_INATIVO,
            'Cliente inativo nao pode ser usado no delivery.',
          )
        }
        clienteId = cliente.id
        nome = nome || cliente.nome
        telefone = telefone ?? cliente.telefone
        endereco = endereco ?? cliente.endereco
      }

      const taxaEntregaCentavos =
        entrada.taxaEntregaCentavos !== undefined
          ? entrada.taxaEntregaCentavos
          : obterTaxaPadrao()

      if (taxaEntregaCentavos < 0) {
        throw new ErroDelivery(
          CODIGOS_ERRO_DELIVERY.TAXA_ENTREGA_INVALIDA,
          'Taxa de entrega deve ser maior ou igual a zero.',
        )
      }

      const pedido = repositorioPedido.inserir({
        sessaoCaixaId: sessao.id,
        mesaId: null,
        tipo: TIPO_PEDIDO.DELIVERY,
        taxaEntregaCentavos,
        clienteId,
      })

      repositorioEntrega.inserir({
        pedidoId: pedido.id,
        clienteNome: nome,
        telefone,
        endereco,
        observacao: normalizarOpcional(entrada.observacao),
      })

      const entrega = repositorioEntrega.buscarPorPedidoId(pedido.id)!
      registrarEventoPedidoSync(pedido.id, OPERACAO_SYNC.CREATE, conexao)
      registrarAcaoAuditoria(
        {
          acao: 'PEDIDO_CRIAR',
          resumo: `Abriu pedido delivery para ${nome}`,
          entidade: 'PEDIDO',
          entidadeId: pedido.id,
          detalhes: { tipo: 'DELIVERY', clienteNome: nome },
        },
        conexao,
      )
      return { pedido, itens: [], entrega, divisao: null }
    })

    persistirConexaoBanco(conexao)
    return resultado
  }
}

export const criarPedidoDelivery = criarCriarPedidoDelivery()
