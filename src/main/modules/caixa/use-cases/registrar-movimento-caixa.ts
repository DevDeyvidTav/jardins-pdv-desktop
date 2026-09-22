import type {
  MovimentoCaixa,
  RegistrarMovimentoCaixaEntrada,
} from '@shared/types/movimento-caixa'
import {
  CODIGOS_ERRO_CAIXA,
  ErroCaixa,
} from '../errors/erros-caixa'
import {
  criarMovimentoCaixaRepository,
  type MovimentoCaixaRepository,
} from '../repositories/movimento-caixa.repository'
import {
  criarSessaoCaixaRepository,
  type SessaoCaixaRepository,
} from '../repositories/sessao-caixa.repository'
import { executarEmTransacaoImediata } from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import { OPERACAO_SYNC } from '@shared/types/sincronizacao'
import { registrarEventoMovimentoCaixaSync } from '../../sincronizacao/services/registrar-evento-caixa'
import { registrarAcaoAuditoria } from '../../sincronizacao/services/registrar-acao-auditoria'

export function criarRegistrarMovimentoCaixa(
  repositorioSessao: SessaoCaixaRepository = criarSessaoCaixaRepository(),
  repositorioMovimento: MovimentoCaixaRepository = criarMovimentoCaixaRepository(),
  obterConexao = obterConexaoBancoLocal,
) {
  return function registrarMovimentoCaixa(
    entrada: RegistrarMovimentoCaixaEntrada,
  ): MovimentoCaixa {
    const conexao = obterConexao()
    return executarEmTransacaoImediata(conexao, () => {
      const sessaoAberta = repositorioSessao.buscarSessaoAberta()

      if (!sessaoAberta) {
        throw new ErroCaixa(
          CODIGOS_ERRO_CAIXA.CAIXA_NAO_ABERTO,
          'Nao existe sessao de caixa aberta.',
        )
      }

      if (entrada.valorCentavos <= 0) {
        throw new ErroCaixa(
          CODIGOS_ERRO_CAIXA.VALOR_MOVIMENTO_INVALIDO,
          'Valor do movimento deve ser maior que zero.',
        )
      }

      const descricaoNormalizada = entrada.descricao?.trim() ?? null

      if (entrada.tipo === 'RETIRADA' && !descricaoNormalizada) {
        throw new ErroCaixa(
          CODIGOS_ERRO_CAIXA.DESCRICAO_OBRIGATORIA,
          'Descricao e obrigatoria para retirada.',
        )
      }

      const movimento = repositorioMovimento.inserir({
        sessaoCaixaId: sessaoAberta.id,
        tipo: entrada.tipo,
        valorCentavos: entrada.valorCentavos,
        descricao: descricaoNormalizada,
      })

      registrarEventoMovimentoCaixaSync(conexao, movimento, OPERACAO_SYNC.CREATE)
      registrarAcaoAuditoria(
        {
          acao: 'CAIXA_MOVIMENTO',
          resumo: `${movimento.tipo === 'RETIRADA' ? 'Retirada' : 'Suprimento'} de caixa`,
          entidade: 'MOVIMENTO_CAIXA',
          entidadeId: movimento.id,
          detalhes: {
            tipo: movimento.tipo,
            valorCentavos: movimento.valorCentavos,
            descricao: movimento.descricao,
          },
        },
        conexao,
      )
      return movimento
    })
  }
}

export const registrarMovimentoCaixa = criarRegistrarMovimentoCaixa()
