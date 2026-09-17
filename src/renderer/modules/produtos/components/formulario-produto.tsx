import { useEffect, useState, type FormEvent } from 'react'
import type { CategoriaProduto } from '@shared/types/categoria-produto'
import type { ProdutoComCategoria, SalvarProdutoFormulario } from '@shared/types/produto'
import { FISCAL_PRODUTO_PADRAO } from '@shared/utils/fiscal-produto'
import { converterReaisParaCentavos, formatarMoeda } from '@shared/utils/moeda'

function formatarCentavosParaInput(centavos: number): string {
  return (centavos / 100).toFixed(2).replace('.', ',')
}

function formatarAliquotaParaInput(aliquota: number | null | undefined): string {
  if (aliquota === null || aliquota === undefined) {
    return ''
  }

  return String(aliquota).replace('.', ',')
}

function converterAliquotaParaNumero(valor: string): number | null {
  const normalizado = valor.trim().replace(',', '.')
  if (normalizado === '') {
    return null
  }

  const numero = Number(normalizado)
  return Number.isFinite(numero) ? numero : null
}

function validarCodigoNumerico(valor: string, tamanho: number, rotulo: string): string | null {
  const apenasDigitos = valor.replace(/\D/g, '')
  if (apenasDigitos === '') {
    return null
  }

  if (apenasDigitos.length !== tamanho) {
    return `${rotulo} deve ter ${tamanho} digitos.`
  }

  return null
}

interface FormularioProdutoProps {
  categorias: CategoriaProduto[]
  categoriaPadraoId?: string
  produtoInicial?: ProdutoComCategoria | null
  carregando: boolean
  onSalvar: (dados: SalvarProdutoFormulario) => Promise<boolean>
  onLimparFeedback: () => void
  onCancelar?: () => void
  permitirFiscal?: boolean
}

export function FormularioProduto({
  categorias,
  categoriaPadraoId,
  produtoInicial = null,
  carregando: _carregando,
  onSalvar,
  onLimparFeedback,
  onCancelar,
  permitirFiscal = false,
}: FormularioProdutoProps) {
  const editando = produtoInicial !== null
  const categoriasAtivas = categorias.filter((categoria) => categoria.ativo)
  const categoriasDisponiveis =
    editando && produtoInicial
      ? categorias.filter(
          (categoria) =>
            categoria.ativo || categoria.id === produtoInicial.categoriaId,
        )
      : categoriasAtivas

  const [categoriaId, setCategoriaId] = useState(
    produtoInicial?.categoriaId ??
      (categoriaPadraoId && categoriasAtivas.some((c) => c.id === categoriaPadraoId)
        ? categoriaPadraoId
        : (categoriasAtivas[0]?.id ?? '')),
  )
  const [nome, setNome] = useState(produtoInicial?.nome ?? '')
  const [descricao, setDescricao] = useState(produtoInicial?.descricao ?? '')
  const [preco, setPreco] = useState(
    produtoInicial ? formatarCentavosParaInput(produtoInicial.precoCentavos) : '',
  )
  const [fiscalNcm, setFiscalNcm] = useState(produtoInicial?.fiscalNcm ?? '')
  const [fiscalCest, setFiscalCest] = useState(produtoInicial?.fiscalCest ?? '')
  const [fiscalCfop, setFiscalCfop] = useState(
    produtoInicial?.fiscalCfop ?? FISCAL_PRODUTO_PADRAO.fiscalCfop,
  )
  const [fiscalIcmsOrigem, setFiscalIcmsOrigem] = useState(
    String(produtoInicial?.fiscalIcmsOrigem ?? FISCAL_PRODUTO_PADRAO.fiscalIcmsOrigem),
  )
  const [fiscalIcmsCsosn, setFiscalIcmsCsosn] = useState(
    produtoInicial?.fiscalIcmsCsosn ?? FISCAL_PRODUTO_PADRAO.fiscalIcmsCsosn,
  )
  const [fiscalPisCst, setFiscalPisCst] = useState(
    produtoInicial?.fiscalPisCst ?? FISCAL_PRODUTO_PADRAO.fiscalPisCst,
  )
  const [fiscalCofinsCst, setFiscalCofinsCst] = useState(
    produtoInicial?.fiscalCofinsCst ?? FISCAL_PRODUTO_PADRAO.fiscalCofinsCst,
  )
  const [fiscalAliquotaNacional, setFiscalAliquotaNacional] = useState(
    formatarAliquotaParaInput(produtoInicial?.fiscalAliquotaNacional),
  )
  const [erroValidacao, setErroValidacao] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  function resetarCamposFiscaisPadrao() {
    setFiscalNcm('')
    setFiscalCest('')
    setFiscalCfop(FISCAL_PRODUTO_PADRAO.fiscalCfop)
    setFiscalIcmsOrigem(String(FISCAL_PRODUTO_PADRAO.fiscalIcmsOrigem))
    setFiscalIcmsCsosn(FISCAL_PRODUTO_PADRAO.fiscalIcmsCsosn)
    setFiscalPisCst(FISCAL_PRODUTO_PADRAO.fiscalPisCst)
    setFiscalCofinsCst(FISCAL_PRODUTO_PADRAO.fiscalCofinsCst)
    setFiscalAliquotaNacional('')
  }

  // Sincroniza o formulario so quando o produto em edicao muda (por id),
  // evitando resetar a digitacao a cada re-render do pai.
  useEffect(() => {
    if (produtoInicial) {
      setCategoriaId(produtoInicial.categoriaId)
      setNome(produtoInicial.nome)
      setDescricao(produtoInicial.descricao ?? '')
      setPreco(formatarCentavosParaInput(produtoInicial.precoCentavos))
      setFiscalNcm(produtoInicial.fiscalNcm ?? '')
      setFiscalCest(produtoInicial.fiscalCest ?? '')
      setFiscalCfop(produtoInicial.fiscalCfop)
      setFiscalIcmsOrigem(String(produtoInicial.fiscalIcmsOrigem))
      setFiscalIcmsCsosn(produtoInicial.fiscalIcmsCsosn)
      setFiscalPisCst(produtoInicial.fiscalPisCst)
      setFiscalCofinsCst(produtoInicial.fiscalCofinsCst)
      setFiscalAliquotaNacional(formatarAliquotaParaInput(produtoInicial.fiscalAliquotaNacional))
      setErroValidacao(null)
      return
    }

    setNome('')
    setDescricao('')
    setPreco('')
    resetarCamposFiscaisPadrao()
    setErroValidacao(null)

    if (
      categoriaPadraoId &&
      categorias.some((categoria) => categoria.ativo && categoria.id === categoriaPadraoId)
    ) {
      setCategoriaId(categoriaPadraoId)
      return
    }

    const primeiraAtiva = categorias.find((categoria) => categoria.ativo)
    setCategoriaId(primeiraAtiva?.id ?? '')
    // Intencionalmente nao depende de `categorias`/`produtoInicial` por referencia:
    // so reage a troca do produto (id) ou do filtro de categoria padrao.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync por id
  }, [produtoInicial?.id, categoriaPadraoId])

  // Em modo criacao, preenche a categoria padrao quando a lista chega do IPC.
  useEffect(() => {
    if (produtoInicial || categoriaId !== '') {
      return
    }

    if (
      categoriaPadraoId &&
      categorias.some((categoria) => categoria.ativo && categoria.id === categoriaPadraoId)
    ) {
      setCategoriaId(categoriaPadraoId)
      return
    }

    const primeiraAtiva = categorias.find((categoria) => categoria.ativo)
    if (primeiraAtiva) {
      setCategoriaId(primeiraAtiva.id)
    }
  }, [produtoInicial, categoriaId, categoriaPadraoId, categorias])

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    onLimparFeedback()
    setErroValidacao(null)

    if (categoriaId === '') {
      setErroValidacao('Selecione uma categoria ativa.')
      return
    }

    if (nome.trim() === '') {
      setErroValidacao('Informe o nome do produto.')
      return
    }

    const precoCentavos = converterReaisParaCentavos(preco)

    if (precoCentavos === null) {
      setErroValidacao('Informe um preco valido e nao negativo.')
      return
    }

    let dadosFiscais: Partial<SalvarProdutoFormulario> = {}

    if (permitirFiscal) {
      const erroNcm = validarCodigoNumerico(fiscalNcm, 8, 'NCM')
      if (erroNcm) {
        setErroValidacao(erroNcm)
        return
      }

      const erroCest = validarCodigoNumerico(fiscalCest, 7, 'CEST')
      if (erroCest) {
        setErroValidacao(erroCest)
        return
      }

      const erroCfop = validarCodigoNumerico(fiscalCfop, 4, 'CFOP')
      if (erroCfop) {
        setErroValidacao(erroCfop)
        return
      }

      const erroCsosn = validarCodigoNumerico(fiscalIcmsCsosn, 3, 'CSOSN')
      if (erroCsosn) {
        setErroValidacao(erroCsosn)
        return
      }

      const erroPis = validarCodigoNumerico(fiscalPisCst, 2, 'CST PIS')
      if (erroPis) {
        setErroValidacao(erroPis)
        return
      }

      const erroCofins = validarCodigoNumerico(fiscalCofinsCst, 2, 'CST COFINS')
      if (erroCofins) {
        setErroValidacao(erroCofins)
        return
      }

      const origem = Number(fiscalIcmsOrigem)
      if (!Number.isInteger(origem) || origem < 0 || origem > 8) {
        setErroValidacao('Origem ICMS deve ser um numero entre 0 e 8.')
        return
      }

      const aliquota = converterAliquotaParaNumero(fiscalAliquotaNacional)
      if (fiscalAliquotaNacional.trim() !== '' && aliquota === null) {
        setErroValidacao('Informe uma aliquota nacional valida.')
        return
      }

      if (aliquota !== null && (aliquota < 0 || aliquota > 100)) {
        setErroValidacao('Aliquota nacional deve ficar entre 0 e 100%.')
        return
      }

      dadosFiscais = {
        fiscalNcm: fiscalNcm.replace(/\D/g, '') || null,
        fiscalCest: fiscalCest.replace(/\D/g, '') || null,
        fiscalCfop: fiscalCfop.replace(/\D/g, ''),
        fiscalIcmsOrigem: origem,
        fiscalIcmsCsosn: fiscalIcmsCsosn.replace(/\D/g, ''),
        fiscalPisCst: fiscalPisCst.replace(/\D/g, ''),
        fiscalCofinsCst: fiscalCofinsCst.replace(/\D/g, ''),
        fiscalAliquotaNacional: aliquota,
      }
    }

    setEnviando(true)

    try {
      const sucesso = await onSalvar({
        categoriaId,
        nome,
        precoCentavos,
        descricao: descricao.trim() || undefined,
        ...dadosFiscais,
      })

      if (sucesso && !editando) {
        setNome('')
        setDescricao('')
        setPreco('')
        resetarCamposFiscaisPadrao()
      }
    } finally {
      setEnviando(false)
    }
  }

  const precoPreview = converterReaisParaCentavos(preco)

  return (
    <form
      className="formulario-produto"
      data-testid={editando ? 'formulario-editar-produto' : 'formulario-produto'}
      onSubmit={(evento) => void handleSubmit(evento)}
    >
      <label className="formulario-produto__campo" htmlFor="categoria-produto">
        Categoria
        <select
          id="categoria-produto"
          data-testid="campo-categoria-produto"
          value={categoriaId}
          onChange={(evento) => setCategoriaId(evento.target.value)}
          disabled={enviando || categoriasDisponiveis.length === 0}
        >
          {categoriasDisponiveis.length === 0 ? (
            <option value="">Nenhuma categoria ativa</option>
          ) : (
            categoriasDisponiveis.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
                {!categoria.ativo ? ' (inativa)' : ''}
              </option>
            ))
          )}
        </select>
      </label>

      <label className="formulario-produto__campo" htmlFor="nome-produto">
        Nome
        <input
          id="nome-produto"
          data-testid="campo-nome-produto"
          type="text"
          value={nome}
          onChange={(evento) => setNome(evento.target.value)}
          disabled={enviando}
        />
      </label>

      <label className="formulario-produto__campo" htmlFor="descricao-produto">
        Descricao
        <input
          id="descricao-produto"
          data-testid="campo-descricao-produto"
          type="text"
          value={descricao}
          onChange={(evento) => setDescricao(evento.target.value)}
          disabled={enviando}
          placeholder="Opcional"
        />
      </label>

      <label className="formulario-produto__campo" htmlFor="preco-produto">
        Preco
        <input
          id="preco-produto"
          data-testid="campo-preco-produto"
          type="text"
          inputMode="decimal"
          placeholder="0,00"
          value={preco}
          onChange={(evento) => setPreco(evento.target.value)}
          disabled={enviando}
        />
      </label>

      {permitirFiscal ? (
      <fieldset className="formulario-produto__fiscal" data-testid="secao-fiscal-produto">
        <legend>Dados fiscais (NFC-e)</legend>
        <p className="formulario-produto__fiscal-ajuda">
          Padrao Simples Nacional: CFOP 5102, CSOSN 102 (tributado) ou 500 (ST), PIS/COFINS 07.
        </p>

        <div className="formulario-produto__fiscal-grid">
          <label className="formulario-produto__campo" htmlFor="fiscal-ncm-produto">
            NCM
            <input
              id="fiscal-ncm-produto"
              data-testid="campo-fiscal-ncm-produto"
              type="text"
              inputMode="numeric"
              placeholder="8 digitos"
              value={fiscalNcm}
              onChange={(evento) => setFiscalNcm(evento.target.value)}
              disabled={enviando}
            />
          </label>

          <label className="formulario-produto__campo" htmlFor="fiscal-cest-produto">
            CEST
            <input
              id="fiscal-cest-produto"
              data-testid="campo-fiscal-cest-produto"
              type="text"
              inputMode="numeric"
              placeholder="Opcional"
              value={fiscalCest}
              onChange={(evento) => setFiscalCest(evento.target.value)}
              disabled={enviando}
            />
          </label>

          <label className="formulario-produto__campo" htmlFor="fiscal-cfop-produto">
            CFOP
            <input
              id="fiscal-cfop-produto"
              data-testid="campo-fiscal-cfop-produto"
              type="text"
              inputMode="numeric"
              value={fiscalCfop}
              onChange={(evento) => setFiscalCfop(evento.target.value)}
              disabled={enviando}
            />
          </label>

          <label className="formulario-produto__campo" htmlFor="fiscal-origem-produto">
            Origem ICMS
            <input
              id="fiscal-origem-produto"
              data-testid="campo-fiscal-origem-produto"
              type="number"
              min={0}
              max={8}
              value={fiscalIcmsOrigem}
              onChange={(evento) => setFiscalIcmsOrigem(evento.target.value)}
              disabled={enviando}
            />
          </label>

          <label className="formulario-produto__campo" htmlFor="fiscal-csosn-produto">
            CSOSN
            <select
              id="fiscal-csosn-produto"
              data-testid="campo-fiscal-csosn-produto"
              value={fiscalIcmsCsosn}
              onChange={(evento) => setFiscalIcmsCsosn(evento.target.value)}
              disabled={enviando}
            >
              <option value="102">102 - Tributado SN</option>
              <option value="500">500 - ICMS cobrado anteriormente por ST</option>
            </select>
          </label>

          <label className="formulario-produto__campo" htmlFor="fiscal-pis-produto">
            CST PIS
            <input
              id="fiscal-pis-produto"
              data-testid="campo-fiscal-pis-produto"
              type="text"
              inputMode="numeric"
              value={fiscalPisCst}
              onChange={(evento) => setFiscalPisCst(evento.target.value)}
              disabled={enviando}
            />
          </label>

          <label className="formulario-produto__campo" htmlFor="fiscal-cofins-produto">
            CST COFINS
            <input
              id="fiscal-cofins-produto"
              data-testid="campo-fiscal-cofins-produto"
              type="text"
              inputMode="numeric"
              value={fiscalCofinsCst}
              onChange={(evento) => setFiscalCofinsCst(evento.target.value)}
              disabled={enviando}
            />
          </label>

          <label className="formulario-produto__campo" htmlFor="fiscal-aliquota-produto">
            Aliquota nacional (%)
            <input
              id="fiscal-aliquota-produto"
              data-testid="campo-fiscal-aliquota-produto"
              type="text"
              inputMode="decimal"
              placeholder="Opcional"
              value={fiscalAliquotaNacional}
              onChange={(evento) => setFiscalAliquotaNacional(evento.target.value)}
              disabled={enviando}
            />
          </label>
        </div>
      </fieldset>
      ) : null}

      {precoPreview !== null ? (
        <p className="formulario-produto__preview" data-testid="preview-preco-produto">
          Preco informado: {formatarMoeda(precoPreview)}
        </p>
      ) : null}

      {erroValidacao ? (
        <p className="formulario-produto__erro" role="alert" data-testid="erro-validacao-produto">
          {erroValidacao}
        </p>
      ) : null}

      <div className="formulario-produto__acoes">
        {onCancelar ? (
          <button
            type="button"
            className="produtos__botao-secundario"
            data-testid="botao-cancelar-edicao-produto"
            disabled={enviando}
            onClick={onCancelar}
          >
            Cancelar
          </button>
        ) : null}
        <button
          type="submit"
          data-testid={editando ? 'botao-salvar-produto' : 'botao-criar-produto'}
          disabled={enviando || categoriasDisponiveis.length === 0}
        >
          {editando ? 'Salvar produto' : 'Criar produto'}
        </button>
      </div>
    </form>
  )
}
