import type { CriarProdutoEntrada, AtualizarProdutoEntrada } from '@shared/types/produto'
import { FISCAL_PRODUTO_PADRAO } from '@shared/utils/fiscal-produto'
import { PERMISSAO_PDV } from '@shared/types/operador'
import { operadorTemPermissao } from '@shared/utils/permissoes-operador'
import { obterSessaoOperador } from '../../configuracoes/services/contexto-sessao-operador'
import {
  CODIGOS_ERRO_PRODUTOS,
  ErroProdutos,
} from '../errors/erros-produtos'

function sessaoPodeEditarFiscal(): boolean {
  const operador = obterSessaoOperador()
  if (!operador) {
    return false
  }
  return operadorTemPermissao(operador.perfil, PERMISSAO_PDV.FISCAL_PRODUTO)
}

export function aplicarRestricaoFiscalCriar(
  entrada: CriarProdutoEntrada,
): CriarProdutoEntrada {
  if (sessaoPodeEditarFiscal()) {
    return entrada
  }

  return {
    ...entrada,
    fiscalNcm: null,
    fiscalCest: null,
    fiscalCfop: FISCAL_PRODUTO_PADRAO.fiscalCfop,
    fiscalIcmsOrigem: FISCAL_PRODUTO_PADRAO.fiscalIcmsOrigem,
    fiscalIcmsCsosn: FISCAL_PRODUTO_PADRAO.fiscalIcmsCsosn,
    fiscalPisCst: FISCAL_PRODUTO_PADRAO.fiscalPisCst,
    fiscalCofinsCst: FISCAL_PRODUTO_PADRAO.fiscalCofinsCst,
    fiscalAliquotaNacional: null,
  }
}

export function validarRestricaoFiscalAtualizar(entrada: AtualizarProdutoEntrada): void {
  if (sessaoPodeEditarFiscal()) {
    return
  }

  const alterouFiscal =
    entrada.fiscalNcm !== undefined ||
    entrada.fiscalCest !== undefined ||
    entrada.fiscalCfop !== undefined ||
    entrada.fiscalIcmsOrigem !== undefined ||
    entrada.fiscalIcmsCsosn !== undefined ||
    entrada.fiscalPisCst !== undefined ||
    entrada.fiscalCofinsCst !== undefined ||
    entrada.fiscalAliquotaNacional !== undefined

  if (alterouFiscal) {
    throw new ErroProdutos(
      CODIGOS_ERRO_PRODUTOS.SEM_PERMISSAO,
      'Voce nao tem permissao para alterar dados fiscais.',
    )
  }
}
