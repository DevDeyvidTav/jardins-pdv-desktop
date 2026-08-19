import { useEffect, useState, type FormEvent } from 'react'
import {
  FORMAS_PAGAMENTO_BAIXA_TALAO,
  ROTULOS_FORMA_PAGAMENTO,
  type FormaPagamento,
} from '@shared/types/pagamento-pedido'
import { converterReaisParaCentavos, formatarMoeda } from '@shared/utils/moeda'
import type { UseClientesResultado } from '../hooks/use-clientes'
import './clientes.css'

interface ClientesPageProps {
  clientes: UseClientesResultado
}

function formatarCentavosParaInput(centavos: number): string {
  return (centavos / 100).toFixed(2).replace('.', ',')
}

export function ClientesPage({ clientes }: ClientesPageProps) {
  const selecionado = clientes.clienteSelecionado
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [documento, setDocumento] = useState('')
  const [endereco, setEndereco] = useState('')
  const [liberaTalao, setLiberaTalao] = useState(false)
  const [valorBaixa, setValorBaixa] = useState('')
  const [formaBaixa, setFormaBaixa] = useState<FormaPagamento>(
    FORMAS_PAGAMENTO_BAIXA_TALAO[0],
  )
  const [observacaoBaixa, setObservacaoBaixa] = useState('')
  const [erroFormulario, setErroFormulario] = useState<string | null>(null)

  useEffect(() => {
    void clientes.recarregar()
  }, [clientes.recarregar])

  useEffect(() => {
    setNome(selecionado?.nome ?? '')
    setTelefone(selecionado?.telefone ?? '')
    setDocumento(selecionado?.documento ?? '')
    setEndereco(selecionado?.endereco ?? '')
    setLiberaTalao(selecionado?.liberaTalao ?? false)
    setErroFormulario(null)
  }, [selecionado?.id])

  useEffect(() => {
    if (clientes.conta) {
      setValorBaixa(
        clientes.conta.saldoCentavos > 0
          ? formatarCentavosParaInput(clientes.conta.saldoCentavos)
          : '',
      )
    }
  }, [clientes.conta?.saldoCentavos, clientes.conta?.competencia])

  async function handleSalvar(evento: FormEvent) {
    evento.preventDefault()
    setErroFormulario(null)
    clientes.limparFeedback()

    const entrada = {
      nome: nome.trim(),
      telefone: telefone.trim() || undefined,
      documento: documento.trim() || undefined,
      endereco: endereco.trim() || undefined,
      liberaTalao,
    }

    if (entrada.nome.length < 2) {
      setErroFormulario('Nome do cliente deve ter no minimo 2 caracteres.')
      return
    }

    if (selecionado) {
      await clientes.atualizarCliente({
        nome: entrada.nome,
        telefone: entrada.telefone ?? null,
        documento: entrada.documento ?? null,
        endereco: entrada.endereco ?? null,
        liberaTalao: entrada.liberaTalao,
      })
      return
    }

    await clientes.criarCliente(entrada)
  }

  async function handleBaixa(evento: FormEvent) {
    evento.preventDefault()
    clientes.limparFeedback()
    const valorCentavos = converterReaisParaCentavos(valorBaixa)
    if (valorCentavos === null || valorCentavos <= 0) {
      return
    }
    await clientes.registrarBaixa({
      formaPagamento: formaBaixa,
      valorCentavos,
      observacao: observacaoBaixa.trim() || undefined,
    })
  }

  function novoCadastro() {
    void clientes.selecionarCliente(null)
    setNome('')
    setTelefone('')
    setDocumento('')
    setEndereco('')
    setLiberaTalao(false)
    setErroFormulario(null)
    clientes.limparFeedback()
  }

  return (
    <main className="clientes clientes--operacao" data-testid="pagina-clientes">
      <div className="clientes-operacao">
        <aside className="clientes-operacao__lista">
          <header className="clientes-operacao__cabecalho">
            <div>
              <h1>Clientes</h1>
              <p className="clientes-operacao__meta">
                {clientes.clientes.length} cadastrado
                {clientes.clientes.length === 1 ? '' : 's'}
              </p>
            </div>
            <button
              type="button"
              className="clientes__botao-secundario"
              data-testid="botao-novo-cliente"
              onClick={novoCadastro}
            >
              Novo
            </button>
          </header>

          <input
            className="clientes-operacao__busca"
            data-testid="campo-busca-cliente"
            type="search"
            placeholder="Buscar por nome, telefone ou documento"
            value={clientes.termoBusca}
            onChange={(evento) => clientes.definirTermoBusca(evento.target.value)}
          />

          {clientes.carregando && clientes.clientes.length === 0 ? (
            <p>Carregando clientes...</p>
          ) : clientes.clientes.length === 0 ? (
            <p className="clientes-operacao__vazio" data-testid="lista-clientes-vazia">
              Nenhum cliente cadastrado.
            </p>
          ) : (
            <ul className="clientes-operacao__itens" data-testid="lista-clientes">
              {clientes.clientes.map((cliente) => (
                <li key={cliente.id}>
                  <button
                    type="button"
                    className="clientes-operacao__item"
                    data-testid="item-cliente"
                    data-ativo={selecionado?.id === cliente.id}
                    onClick={() => void clientes.selecionarCliente(cliente)}
                  >
                    <strong>{cliente.nome}</strong>
                    <span>
                      {cliente.liberaTalao ? 'Talão liberado' : 'Sem talão'}
                      {cliente.ativo ? '' : ' · inativo'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="clientes-operacao__detalhe">
          {clientes.sucesso ? (
            <p className="clientes__sucesso" role="status" data-testid="feedback-sucesso-clientes">
              {clientes.sucesso}
            </p>
          ) : null}
          {clientes.erro ? (
            <p className="clientes__erro" role="alert" data-testid="erro-clientes">
              {clientes.erro}
            </p>
          ) : null}

          <form
            className="formulario-cliente"
            data-testid="formulario-cliente"
            onSubmit={(evento) => void handleSalvar(evento)}
          >
            <h2>{selecionado ? 'Editar cliente' : 'Novo cliente'}</h2>

            <label className="formulario-cliente__campo">
              Nome *
              <input
                data-testid="campo-nome-cliente"
                value={nome}
                onChange={(evento) => setNome(evento.target.value)}
                autoComplete="off"
              />
            </label>
            <label className="formulario-cliente__campo">
              Telefone
              <input
                data-testid="campo-telefone-cliente"
                value={telefone}
                onChange={(evento) => setTelefone(evento.target.value)}
              />
            </label>
            <label className="formulario-cliente__campo">
              Documento
              <input
                data-testid="campo-documento-cliente"
                value={documento}
                onChange={(evento) => setDocumento(evento.target.value)}
              />
            </label>
            <label className="formulario-cliente__campo">
              Endereco
              <input
                data-testid="campo-endereco-cliente"
                value={endereco}
                onChange={(evento) => setEndereco(evento.target.value)}
              />
            </label>
            <label className="formulario-cliente__check">
              <input
                data-testid="campo-libera-talao"
                type="checkbox"
                checked={liberaTalao}
                onChange={(evento) => setLiberaTalao(evento.target.checked)}
              />
              Libera talão
            </label>

            {erroFormulario ? (
              <p className="formulario-cliente__erro" role="alert">
                {erroFormulario}
              </p>
            ) : null}

            <div className="formulario-cliente__acoes">
              <button type="submit" data-testid="botao-salvar-cliente">
                {selecionado ? 'Salvar alteracoes' : 'Cadastrar cliente'}
              </button>
              {selecionado?.ativo ? (
                <button
                  type="button"
                  className="clientes__botao-secundario"
                  data-testid="botao-inativar-cliente"
                  onClick={() => void clientes.inativarCliente()}
                >
                  Inativar
                </button>
              ) : null}
              {selecionado && !selecionado.ativo ? (
                <button
                  type="button"
                  className="clientes__botao-secundario"
                  data-testid="botao-reativar-cliente"
                  onClick={() => void clientes.reativarCliente()}
                >
                  Reativar
                </button>
              ) : null}
            </div>
          </form>

          {selecionado ? (
            <section className="conta-talao" data-testid="painel-conta-talao">
              <header className="conta-talao__cabecalho">
                <h2>Talão do mês</h2>
                <label>
                  Competencia
                  <input
                    data-testid="campo-competencia-talao"
                    type="month"
                    value={clientes.competencia}
                    onChange={(evento) => clientes.definirCompetencia(evento.target.value)}
                  />
                </label>
              </header>

              {clientes.carregandoConta && !clientes.conta ? (
                <p>Carregando conta...</p>
              ) : clientes.conta ? (
                <>
                  <dl className="conta-talao__totais">
                    <div>
                      <dt>Lancado</dt>
                      <dd data-testid="talao-total-lancado">
                        {formatarMoeda(clientes.conta.totalLancadoCentavos)}
                      </dd>
                    </div>
                    <div>
                      <dt>Baixado</dt>
                      <dd data-testid="talao-total-baixado">
                        {formatarMoeda(clientes.conta.totalBaixadoCentavos)}
                      </dd>
                    </div>
                    <div>
                      <dt>Saldo</dt>
                      <dd data-testid="talao-saldo">
                        {formatarMoeda(clientes.conta.saldoCentavos)}
                      </dd>
                    </div>
                  </dl>

                  {clientes.conta.lancamentos.length > 0 ? (
                    <ul className="conta-talao__lancamentos" data-testid="lista-lancamentos-talao">
                      {clientes.conta.lancamentos.map((lancamento) => (
                        <li key={lancamento.pagamentoId}>
                          Pedido #{lancamento.pedidoReferencia} ·{' '}
                          {formatarMoeda(lancamento.valorCentavos)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="clientes-operacao__vazio">Nenhum lançamento neste mês.</p>
                  )}

                  <form
                    className="formulario-baixa-talao"
                    data-testid="formulario-baixa-talao"
                    onSubmit={(evento) => void handleBaixa(evento)}
                  >
                    <h3>Registrar baixa</h3>
                    <label>
                      Forma
                      <select
                        data-testid="campo-forma-baixa-talao"
                        value={formaBaixa}
                        onChange={(evento) =>
                          setFormaBaixa(evento.target.value as FormaPagamento)
                        }
                      >
                        {FORMAS_PAGAMENTO_BAIXA_TALAO.map((forma) => (
                          <option key={forma} value={forma}>
                            {ROTULOS_FORMA_PAGAMENTO[forma]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Valor (R$)
                      <input
                        data-testid="campo-valor-baixa-talao"
                        value={valorBaixa}
                        onChange={(evento) => setValorBaixa(evento.target.value)}
                        inputMode="decimal"
                      />
                    </label>
                    <label>
                      Observacao
                      <input
                        data-testid="campo-observacao-baixa-talao"
                        value={observacaoBaixa}
                        onChange={(evento) => setObservacaoBaixa(evento.target.value)}
                      />
                    </label>
                    <button
                      type="submit"
                      data-testid="botao-registrar-baixa-talao"
                      disabled={!clientes.conta.saldoCentavos}
                    >
                      Registrar baixa
                    </button>
                  </form>
                </>
              ) : null}
            </section>
          ) : null}
        </section>
      </div>
    </main>
  )
}
