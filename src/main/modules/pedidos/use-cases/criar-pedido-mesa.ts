import type { Pedido } from '@shared/types/pedido'
import { TIPO_PEDIDO } from '@shared/types/pedido'
import { STATUS_MESA, TIPO_MOVIMENTACAO_MESA } from '@shared/types/mesa'
import type { CriarPedidoMesaEntrada } from '@shared/types/pedido'
import {
  executarEmTransacaoImediata,
  persistirConexaoBanco,
} from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import type { SessaoCaixaRepository } from '../../caixa/repositories/sessao-caixa.repository'
import { criarSessaoCaixaRepository } from '../../caixa/repositories/sessao-caixa.repository'
import type { MesaRepository } from '../../mesas/repositories/mesa.repository'
import { criarMesaRepository } from '../../mesas/repositories/mesa.repository'
import {
  inserirMovimentacaoNaConexao,
  mesaPertenceAAgrupamentoAtivo,
  snapshotMesa,
} from '../../mesas/services/mesa-movimentacao.sql'
import { CODIGOS_ERRO_PEDIDOS, ErroPedidos } from '../errors/erros-pedidos'
import type { PedidoRepository } from '../repositories/pedido.repository'
import { criarPedidoRepository } from '../repositories/pedido.repository'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { registrarEventoPedidoSync } from '../../sincronizacao/services/registrar-evento-pedido'
import { registrarAcaoAuditoria } from '../../sincronizacao/services/registrar-acao-auditoria'

export function criarCriarPedidoMesa(
  repositorioPedido: PedidoRepository = criarPedidoRepository(),
  repositorioMesa: MesaRepository = criarMesaRepository(),
  repositorioSessao: SessaoCaixaRepository = criarSessaoCaixaRepository(),
  obterConexao = obterConexaoBancoLocal,
) {
  return function criarPedidoMesa(entrada: CriarPedidoMesaEntrada): Pedido {
    const conexao = obterConexao()
    const pedido = executarEmTransacaoImediata(conexao, () => {
      const sessaoAberta = repositorioSessao.buscarSessaoAberta()

      if (!sessaoAberta) {
        throw new ErroPedidos(
          CODIGOS_ERRO_PEDIDOS.CAIXA_NAO_ABERTO,
          'Nao existe sessao de caixa aberta.',
        )
      }

      const mesa = repositorioMesa.buscarPorId(entrada.mesaId)

      if (!mesa) {
        throw new ErroPedidos(
          CODIGOS_ERRO_PEDIDOS.MESA_NAO_ENCONTRADA,
          'Mesa nao encontrada.',
        )
      }

      if (!mesa.ativo || mesa.status === STATUS_MESA.INATIVA) {
        throw new ErroPedidos(
          CODIGOS_ERRO_PEDIDOS.MESA_INATIVA,
          'Nao e permitido abrir pedido em mesa inativa.',
        )
      }

      if (mesa.status === STATUS_MESA.AGRUPADA || mesa.status === STATUS_MESA.OCUPADA) {
        throw new ErroPedidos(
          CODIGOS_ERRO_PEDIDOS.MESA_OCUPADA,
          'Mesa ja possui pedido aberto.',
        )
      }

      if (mesaPertenceAAgrupamentoAtivo(conexao, entrada.mesaId)) {
        throw new ErroPedidos(
          CODIGOS_ERRO_PEDIDOS.MESA_OCUPADA,
          'Mesa ja pertence a um agrupamento ativo.',
        )
      }

      const pedidoAberto = repositorioPedido.buscarPedidoAbertoPorMesa(entrada.mesaId)

      if (pedidoAberto) {
        throw new ErroPedidos(
          CODIGOS_ERRO_PEDIDOS.MESA_OCUPADA,
          'Mesa ja possui pedido aberto.',
        )
      }

      const pedidoCriado = repositorioPedido.inserir({
        sessaoCaixaId: sessaoAberta.id,
        mesaId: entrada.mesaId,
        tipo: TIPO_PEDIDO.MESA,
      })

      repositorioMesa.atualizarStatus(entrada.mesaId, STATUS_MESA.OCUPADA)

      inserirMovimentacaoNaConexao(conexao, {
        pedidoId: pedidoCriado.id,
        tipo: TIPO_MOVIMENTACAO_MESA.PEDIDO_ABERTO_NA_MESA,
        mesaDestinoId: mesa.id,
        dadosAntes: { mesa: snapshotMesa(mesa) },
        dadosDepois: {
          pedidoId: pedidoCriado.id,
          mesa: { ...snapshotMesa(mesa), status: STATUS_MESA.OCUPADA },
        },
      })

      registrarEventoPedidoSync(pedidoCriado.id, OPERACAO_SYNC.CREATE, conexao)
      registrarAcaoAuditoria(
        {
          acao: 'PEDIDO_CRIAR',
          resumo: `Abriu pedido de mesa ${mesa.numero}`,
          entidade: 'PEDIDO',
          entidadeId: pedidoCriado.id,
          detalhes: { tipo: 'MESA', mesaId: mesa.id, mesaNumero: mesa.numero },
        },
        conexao,
      )

      return pedidoCriado
    })

    persistirConexaoBanco(conexao)
    return pedido
  }
}

export const criarPedidoMesa = criarCriarPedidoMesa()
