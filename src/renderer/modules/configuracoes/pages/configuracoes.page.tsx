import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { CategoriaProduto } from '@shared/types/categoria-produto'
import {
  ROTULOS_SETOR_IMPRESSAO,
  SETORES_IMPRESSORA_CONFIG,
  type ConfigImpressoraEntrada,
  type ImpressoraDetectada,
  type ImpressorasSistemaResposta,
  type SetorImpressao,
  type SetorImpressoraConfig,
} from '@shared/types/config-impressora'
import { extrairMensagemErroIpc } from '@shared/utils/erro-ipc'
import { PainelSyncStatus } from '../components/painel-sync-status'
import { PainelAtualizacao } from '../components/painel-atualizacao'
import { useSyncEstado } from '../hooks/use-sync-estado'
import type { OperadorResumo } from '@shared/types/operador'
import { PERFIL_OPERADOR, TAMANHO_PIN_OPERADOR } from '@shared/types/operador'
import { useOperador } from '../hooks/use-operador'
import { useAtualizacao } from '../hooks/use-atualizacao'
import './configuracoes.css'

type AbaConfig = 'impressoras' | 'sync' | 'operador' | 'sistema'

interface ConfiguracoesPageProps {
  operador: ReturnType<typeof useOperador>
}

export function ConfiguracoesPage({ operador }: ConfiguracoesPageProps) {
  const [abaAtiva, setAbaAtiva] = useState<AbaConfig>('impressoras')
  const sync = useSyncEstado(true)
  const atualizacao = useAtualizacao()
  const [infoSync, setInfoSync] = useState<{
    apiUrl: string | null
    apiConfigurada: boolean
  }>({ apiUrl: null, apiConfigurada: false })
  const [impressoras, setImpressoras] = useState<ConfigImpressoraEntrada[]>([])
  const [impressorasSistema, setImpressorasSistema] =
    useState<ImpressorasSistemaResposta>({ impressoras: [], portasCom: [] })
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([])
  const [operadores, setOperadores] = useState<OperadorResumo[]>([])
  const [operadorSelecionadoId, setOperadorSelecionadoId] = useState('')
  const [pinOperador, setPinOperador] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  const carregarDados = useCallback(async () => {
    setCarregando(true)
    setErro(null)

    try {
      const [configs, listaCategorias, info, detectadas, listaOperadores] = await Promise.all([
        window.pdv.config.listarImpressoras(),
        window.pdv.produtos.listarCategorias(),
        window.pdv.config.obterInfoSync(),
        window.pdv.config.listarImpressorasSistema(),
        window.pdv.config.listarOperadores(),
      ])

      const mapa = new Map(configs.map((config) => [config.setor, config]))
      setImpressoras(
        SETORES_IMPRESSORA_CONFIG.map((setor) => ({
          setor,
          nomeImpressora: mapa.get(setor)?.nomeImpressora ?? '',
          portaCom: mapa.get(setor)?.portaCom ?? '',
        })),
      )
      setImpressorasSistema(detectadas)
      setCategorias(listaCategorias)
      setInfoSync({
        apiUrl: info.apiUrl,
        apiConfigurada: info.apiConfigurada,
      })
      setOperadores(listaOperadores)
      setOperadorSelecionadoId((atual) => atual || listaOperadores[0]?.operadorId || '')
    } catch (causa) {
      setErro(extrairMensagemErroIpc(causa))
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void carregarDados()
  }, [carregarDados])

  async function testarImpressaoSetor(setor: SetorImpressoraConfig) {
    setErro(null)
    setSucesso(null)

    try {
      const resultado =
        setor === 'BALCAO'
          ? await window.pdv.impressao.imprimirAmostra({ tipo: 'CONTA' })
          : await window.pdv.impressao.imprimirAmostra({
              tipo: 'COMANDA',
              setor,
            })

      if (resultado.impresso) {
        setSucesso(`Teste enviado para ${ROTULOS_SETOR_IMPRESSAO[setor]}.`)
      } else {
        setErro(resultado.aviso ?? 'Nao foi possivel imprimir o teste.')
      }
    } catch (causa) {
      setErro(extrairMensagemErroIpc(causa))
    }
  }

  async function recuperarImpressoras() {
    setErro(null)
    setSucesso(null)

    try {
      const resultados = await window.pdv.config.recuperarImpressoras()
      const resumo = resultados
        .map((item) => `${item.nome}: ${item.status ?? 'desconhecido'} (${item.jobCount ?? 0} job(s))`)
        .join(' · ')
      setSucesso(
        resultados.length > 0
          ? `Fila limpa. ${resumo}`
          : 'Nenhuma impressora configurada para recuperar.',
      )
      await carregarDados()
    } catch (causa) {
      setErro(extrairMensagemErroIpc(causa))
    }
  }

  async function salvarImpressoras(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setSucesso(null)

    try {
      await window.pdv.config.salvarImpressoras({
        configs: impressoras.filter((config) => config.nomeImpressora.trim()),
      })
      setSucesso('Impressoras salvas.')
      await carregarDados()
    } catch (causa) {
      setErro(extrairMensagemErroIpc(causa))
    }
  }

  async function alterarSetorCategoria(
    categoriaId: string,
    setorImpressao: SetorImpressao | null,
  ) {
    setErro(null)
    setSucesso(null)

    try {
      const atualizada = await window.pdv.config.atualizarSetorCategoria({
        categoriaId,
        setorImpressao,
      })
      setCategorias((atual) =>
        atual.map((categoria) =>
          categoria.id === atualizada.id ? atualizada : categoria,
        ),
      )
      setSucesso('Setor da categoria atualizado.')
    } catch (causa) {
      setErro(extrairMensagemErroIpc(causa))
    }
  }

  function atribuirImpressoraDetectada(
    setor: SetorImpressoraConfig,
    detectada: ImpressoraDetectada,
  ) {
    setImpressoras((atual) =>
      atual.map((item) =>
        item.setor === setor
          ? {
              ...item,
              nomeImpressora: detectada.nome,
              portaCom: detectada.porta ?? '',
            }
          : item,
      ),
    )
  }

  async function salvarOperadorConfig(evento: FormEvent) {
    evento.preventDefault()
    const ok = await operador.salvarPin(operadorSelecionadoId, pinOperador.trim())
    if (ok) {
      setSucesso('PIN atualizado.')
      setPinOperador('')
    }
  }

  const badgeErro = Boolean(sync.estado?.ultimoErro)
  const badgePendencias = sync.estado?.pendente ?? 0

  return (
    <main className="configuracoes" data-testid="configuracoes-page">
      <header className="configuracoes__cabecalho">
        <h1>Configurações</h1>
        <span
          className="configuracoes__badge-sync"
          data-erro={badgeErro}
          data-testid="badge-sync"
        >
          Sync: {badgePendencias} pendente{badgePendencias === 1 ? '' : 's'}
          {badgeErro ? ' · erro' : ''}
        </span>
      </header>

      <nav className="configuracoes__abas">
        <button
          type="button"
          data-ativo={abaAtiva === 'impressoras'}
          onClick={() => setAbaAtiva('impressoras')}
        >
          Impressoras
        </button>
        <button
          type="button"
          data-ativo={abaAtiva === 'sync'}
          onClick={() => setAbaAtiva('sync')}
        >
          Sync
        </button>
        <button
          type="button"
          data-ativo={abaAtiva === 'operador'}
          onClick={() => setAbaAtiva('operador')}
        >
          Usuarios
        </button>
        <button
          type="button"
          data-ativo={abaAtiva === 'sistema'}
          onClick={() => setAbaAtiva('sistema')}
        >
          Sistema
        </button>
      </nav>

      {carregando ? <p>Carregando...</p> : null}
      {erro ? (
        <p className="config-erro" role="alert">
          {erro}
        </p>
      ) : null}
      {sucesso ? <p className="config-sucesso">{sucesso}</p> : null}

      {abaAtiva === 'impressoras' ? (
        <div className="config-painel">
          <section className="config-impressoras-detectadas">
            <div className="config-impressoras-detectadas__cabecalho">
              <h2>Impressoras plugadas no Windows</h2>
              <div className="config-impressoras-detectadas__acoes">
                <button
                  type="button"
                  className="config-impressoras-detectadas__atualizar"
                  onClick={() => void recuperarImpressoras()}
                >
                  Limpar fila / recuperar
                </button>
                <button
                  type="button"
                  className="config-impressoras-detectadas__atualizar"
                  onClick={() => void carregarDados()}
                >
                  Atualizar lista
                </button>
              </div>
            </div>
            {impressorasSistema.impressoras.some((item) => item.status === 'Error') ? (
              <p className="config-impressoras-detectadas__alerta config-impressoras-detectadas__alerta--info">
                Status <strong>Error</strong> no Windows e comum na MP-4200 (driver
                Bematech_USB). Se o cupom sair, pode ignorar. So reinicie a impressora se{' '}
                <em>parar</em> de imprimir de verdade.
              </p>
            ) : null}
            {impressorasSistema.impressoras.length === 0 ? (
              <p className="config-impressoras-detectadas__vazio">
                Nenhuma impressora detectada. Verifique cabos USB e drivers, depois
                clique em Atualizar lista.
              </p>
            ) : (
              <table className="config-impressoras-detectadas__tabela">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Porta</th>
                    <th>Status</th>
                    <th>Atribuir ao setor</th>
                  </tr>
                </thead>
                <tbody>
                  {impressorasSistema.impressoras.map((detectada) => (
                    <tr key={detectada.nome}>
                      <td>
                        {detectada.nome}
                        {detectada.padrao ? (
                          <span className="config-impressoras-detectadas__padrao">
                            padrão
                          </span>
                        ) : null}
                      </td>
                      <td>{detectada.porta ?? '—'}</td>
                      <td>{detectada.status ?? '—'}</td>
                      <td>
                        <select
                          defaultValue=""
                          onChange={(evento) => {
                            const setor = evento.target.value as SetorImpressoraConfig
                            if (!setor) {
                              return
                            }
                            atribuirImpressoraDetectada(setor, detectada)
                            evento.target.value = ''
                          }}
                        >
                          <option value="">Escolher setor…</option>
                          {SETORES_IMPRESSORA_CONFIG.map((setor) => (
                            <option key={setor} value={setor}>
                              {ROTULOS_SETOR_IMPRESSAO[setor]}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {impressorasSistema.portasCom.length > 0 ? (
              <div className="config-portas-com">
                <h3>Portas COM</h3>
                <ul>
                  {impressorasSistema.portasCom.map((porta) => (
                    <li
                      key={porta.porta}
                      data-ocupada={Boolean(porta.impressora)}
                    >
                      <strong>{porta.porta}</strong>
                      {porta.impressora
                        ? ` — ${porta.impressora}`
                        : ' — livre'}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <h2>Impressoras por setor</h2>
          <p className="config-impressoras__dica">
            Somente setores com nome preenchido e salvos recebem impressao. Deixe vazio
            os setores que ainda nao tem impressora (ex.: pizza, japonesa, chinesa).
          </p>
          <form onSubmit={(evento) => void salvarImpressoras(evento)}>
            <datalist id="nomes-impressoras-detectadas">
              {impressorasSistema.impressoras.map((item) => (
                <option key={item.nome} value={item.nome} />
              ))}
            </datalist>
            <datalist id="portas-com-detectadas">
              {impressorasSistema.portasCom.map((item) => (
                <option key={item.porta} value={item.porta} />
              ))}
            </datalist>
            <table className="config-impressoras__tabela">
              <thead>
                <tr>
                  <th>Setor</th>
                  <th>Nome da impressora (Windows)</th>
                  <th>Porta COM (opcional)</th>
                  <th>Teste</th>
                </tr>
              </thead>
              <tbody>
                {impressoras.map((config, indice) => (
                  <tr key={config.setor}>
                    <td>{ROTULOS_SETOR_IMPRESSAO[config.setor]}</td>
                    <td>
                      <input
                        list="nomes-impressoras-detectadas"
                        value={config.nomeImpressora}
                        onChange={(evento) => {
                          const valor = evento.target.value
                          setImpressoras((atual) =>
                            atual.map((item, i) =>
                              i === indice ? { ...item, nomeImpressora: valor } : item,
                            ),
                          )
                        }}
                        placeholder="Ex.: MP-4200 Caixa"
                      />
                    </td>
                    <td>
                      <input
                        list="portas-com-detectadas"
                        value={config.portaCom ?? ''}
                        onChange={(evento) => {
                          const valor = evento.target.value
                          setImpressoras((atual) =>
                            atual.map((item, i) =>
                              i === indice ? { ...item, portaCom: valor } : item,
                            ),
                          )
                        }}
                        placeholder="COM ou vazio se Bematech_USB"
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="config-impressoras__testar"
                        disabled={!config.nomeImpressora.trim()}
                        onClick={() =>
                          void testarImpressaoSetor(
                            config.setor as SetorImpressoraConfig,
                          )
                        }
                      >
                        Testar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="submit">Salvar impressoras</button>
          </form>

          <h2>Categorias → setor de impressão</h2>
          <table className="config-categorias__tabela">
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Setor</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((categoria) => (
                <tr key={categoria.id}>
                  <td>{categoria.nome}</td>
                  <td>
                    <select
                      value={categoria.setorImpressao ?? ''}
                      onChange={(evento) => {
                        const valor = evento.target.value
                        void alterarSetorCategoria(
                          categoria.id,
                          valor ? (valor as SetorImpressao) : null,
                        )
                      }}
                    >
                      <option value="">Padrão (por tipo de produto)</option>
                      {SETORES_IMPRESSORA_CONFIG.map((setor) => (
                        <option key={setor} value={setor}>
                          {ROTULOS_SETOR_IMPRESSAO[setor]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {abaAtiva === 'sync' ? (
        <div className="config-painel">
          <PainelSyncStatus
            sync={sync}
            apiUrl={infoSync.apiUrl}
            apiConfigurada={infoSync.apiConfigurada}
          />
        </div>
      ) : null}

      {abaAtiva === 'operador' ? (
        <div className="config-painel config-operador">
          <h2>Usuarios do PDV</h2>
          <ul className="config-operador__lista" data-testid="lista-usuarios-pdv">
            {operadores.map((item) => (
              <li key={item.operadorId}>
                <strong>{item.operadorNome}</strong>
                <span>
                  {item.perfil === PERFIL_OPERADOR.ADMIN ? 'Administradora' : 'Operadora'}
                </span>
              </li>
            ))}
          </ul>
          <form onSubmit={(evento) => void salvarOperadorConfig(evento)}>
            <label className="config-operador__campo">
              Usuario
              <select
                value={operadorSelecionadoId}
                onChange={(evento) => setOperadorSelecionadoId(evento.target.value)}
                required
              >
                {operadores.map((item) => (
                  <option key={item.operadorId} value={item.operadorId}>
                    {item.operadorNome}
                  </option>
                ))}
              </select>
            </label>
            <label className="config-operador__campo">
              Novo PIN ({TAMANHO_PIN_OPERADOR} digitos)
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                pattern={`\\d{${TAMANHO_PIN_OPERADOR}}`}
                maxLength={TAMANHO_PIN_OPERADOR}
                value={pinOperador}
                onChange={(evento) =>
                  setPinOperador(
                    evento.target.value.replace(/\D/g, '').slice(0, TAMANHO_PIN_OPERADOR),
                  )
                }
                minLength={TAMANHO_PIN_OPERADOR}
                required
              />
            </label>
            {operador.erro ? <p className="config-erro">{operador.erro}</p> : null}
            <button type="submit">Atualizar PIN</button>
          </form>
        </div>
      ) : null}

      {abaAtiva === 'sistema' ? (
        <div className="config-painel">
          <PainelAtualizacao
            estado={atualizacao.estado}
            carregando={atualizacao.carregando}
            erro={atualizacao.erro}
            onVerificar={() => void atualizacao.verificar()}
            onInstalar={() => void atualizacao.instalar()}
          />
        </div>
      ) : null}
    </main>
  )
}
