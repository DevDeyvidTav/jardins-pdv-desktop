import { execFileSync } from 'node:child_process'
import {
  ACAO_DIAGNOSTICO_IMPRESSORA,
  TIPO_DIAGNOSTICO_IMPRESSORA,
  type DiagnosticoImpressora,
  type DispositivoImpressaoDetectado,
  type ImpressoraDetectada,
  type ImpressorasSistemaResposta,
  type PortaComDetectada,
} from '@shared/types/config-impressora'

const COMANDO_LISTAR_IMPRESSORAS = `
$ErrorActionPreference = 'SilentlyContinue'
$padrao = (Get-Printer | Where-Object { $_.Default -eq $true } | Select-Object -First 1 -ExpandProperty Name)
$impressoras = @(Get-Printer | ForEach-Object {
  $porta = $_.PortName
  if ($porta -match '^COM\\d+') { $porta = $porta.TrimEnd(':') }
  [PSCustomObject]@{
    nome = $_.Name
    porta = $porta
    status = [string]$_.PrinterStatus
    padrao = ($_.Name -eq $padrao)
  }
})
$mapa = @{}
foreach ($item in $impressoras) {
  if ($item.porta -match '^COM\\d+$') { $mapa[$item.porta] = $item.nome }
}
$portasCom = @([System.IO.Ports.SerialPort]::GetPortNames() | Sort-Object | ForEach-Object {
  [PSCustomObject]@{ porta = $_; impressora = $mapa[$_] }
})
$portasUsb = @(Get-PrinterPort | Where-Object { $_.Name -match '^USB\\d+' } | ForEach-Object { $_.Name })
$portasUsadas = @($impressoras | ForEach-Object { $_.porta })
$portasUsbLivres = @($portasUsb | Where-Object { $portasUsadas -notcontains $_ })
$dispositivos = @(Get-PnpDevice | Where-Object {
  $_.Class -eq 'Printer' -or
  $_.FriendlyName -match '(?i)printing support|impressora|thermal|pos[ -]?[0-9]|tm-?t[0-9]|mp-?[0-9]{3}|elgin|bematech|epson|daruma|tanca|sweda|gprinter|xprinter'
} | ForEach-Object {
  [PSCustomObject]@{
    nome = $_.FriendlyName
    classe = [string]$_.Class
    status = [string]$_.Status
  }
})
[PSCustomObject]@{
  impressoras = $impressoras
  portasCom = $portasCom
  portasUsbLivres = $portasUsbLivres
  dispositivos = $dispositivos
} | ConvertTo-Json -Compress -Depth 4
`.trim()

export function executarConsultaPowerShellConfig(comando: string): string {
  return execFileSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', comando],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true },
  )
}

function normalizarPortaCom(porta: string | null | undefined): string | null {
  if (!porta?.trim()) {
    return null
  }

  const limpa = porta.trim().replace(/:$/, '')
  return limpa.match(/^COM\d+$/i) ? limpa.toUpperCase() : limpa
}

function paraLista<T>(valor: T | T[] | undefined): T[] {
  if (!valor) {
    return []
  }

  return Array.isArray(valor) ? valor : [valor]
}

/**
 * Cada diagnóstico nasce com a ação que resolve aquele cenário — a tela de
 * configuração só precisa renderizar o botão correspondente.
 */
export function classificarDiagnosticosImpressora(
  entrada: Omit<ImpressorasSistemaResposta, 'diagnosticos'>,
): DiagnosticoImpressora[] {
  const diagnosticos: DiagnosticoImpressora[] = []
  const nomesInstalados = new Set(
    entrada.impressoras.map((item) => item.nome.trim().toLowerCase()),
  )

  for (const porta of entrada.portasUsbLivres) {
    diagnosticos.push({
      tipo: TIPO_DIAGNOSTICO_IMPRESSORA.SEM_FILA_USB,
      titulo: `Impressora USB conectada na ${porta}, mas não instalada`,
      detalhe:
        'O Windows reconheceu um dispositivo de impressão USB nessa porta, porém nenhuma impressora usa ela. ' +
        'Instale como impressora genérica para imprimir sem driver do fabricante.',
      acao: ACAO_DIAGNOSTICO_IMPRESSORA.INSTALAR_GENERICA,
      porta,
    })
  }

  for (const dispositivo of entrada.dispositivos) {
    const comErro = Boolean(dispositivo.status) && dispositivo.status !== 'OK'
    const jaInstalado = nomesInstalados.has(dispositivo.nome.trim().toLowerCase())
    if (!comErro || jaInstalado) {
      continue
    }

    diagnosticos.push({
      tipo: TIPO_DIAGNOSTICO_IMPRESSORA.DISPOSITIVO_COM_ERRO,
      titulo: `"${dispositivo.nome}" está com problema de driver`,
      detalhe:
        `O Windows marcou o dispositivo como "${dispositivo.status}". ` +
        'Instalar como impressora genérica costuma resolver em térmicas ESC/POS; se persistir, baixe o driver do fabricante.',
      acao: ACAO_DIAGNOSTICO_IMPRESSORA.INSTALAR_GENERICA,
      porta: null,
    })
  }

  for (const portaCom of entrada.portasCom) {
    if (portaCom.impressora) {
      continue
    }

    diagnosticos.push({
      tipo: TIPO_DIAGNOSTICO_IMPRESSORA.PORTA_COM_LIVRE,
      titulo: `Porta ${portaCom.porta} ativa sem impressora associada`,
      detalhe:
        'Existe uma porta serial ativa (térmica USB em modo serial). ' +
        'Atribua-a a um setor para imprimir direto pela porta, sem precisar de driver.',
      acao: ACAO_DIAGNOSTICO_IMPRESSORA.USAR_PORTA_COM,
      porta: portaCom.porta,
    })
  }

  if (
    entrada.impressoras.length === 0 &&
    entrada.portasUsbLivres.length === 0 &&
    entrada.portasCom.length === 0 &&
    diagnosticos.length === 0
  ) {
    diagnosticos.push({
      tipo: TIPO_DIAGNOSTICO_IMPRESSORA.NENHUMA_IMPRESSORA,
      titulo: 'Nenhuma impressora detectada',
      detalhe:
        'Nada apareceu em nenhuma fonte do Windows. Verifique se as impressoras estão ligadas e com o cabo USB ' +
        'firmemente conectado (teste outra porta USB), depois clique em Atualizar lista.',
      acao: ACAO_DIAGNOSTICO_IMPRESSORA.VERIFICAR_CONEXAO,
      porta: null,
    })
  }

  return diagnosticos
}

function parseRespostaImpressorasSistema(json: string): ImpressorasSistemaResposta {
  const vazia: ImpressorasSistemaResposta = {
    impressoras: [],
    portasCom: [],
    portasUsbLivres: [],
    dispositivos: [],
    diagnosticos: [],
  }

  if (!json.trim()) {
    return vazia
  }

  const bruto = JSON.parse(json) as {
    impressoras?: ImpressoraDetectada | ImpressoraDetectada[]
    portasCom?: PortaComDetectada | PortaComDetectada[]
    portasUsbLivres?: string | string[]
    dispositivos?: DispositivoImpressaoDetectado | DispositivoImpressaoDetectado[]
  }

  const parcial = {
    impressoras: paraLista(bruto.impressoras).map((item) => ({
      nome: String(item.nome ?? '').trim(),
      porta: normalizarPortaCom(item.porta),
      status: item.status ? String(item.status) : null,
      padrao: Boolean(item.padrao),
    })),
    portasCom: paraLista(bruto.portasCom).map((item) => ({
      porta: normalizarPortaCom(item.porta) ?? String(item.porta ?? ''),
      impressora: item.impressora ? String(item.impressora) : null,
    })),
    portasUsbLivres: paraLista(bruto.portasUsbLivres)
      .map((item) => String(item ?? '').trim().toUpperCase())
      .filter(Boolean),
    dispositivos: paraLista(bruto.dispositivos).map((item) => ({
      nome: String(item.nome ?? '').trim(),
      classe: item.classe ? String(item.classe) : null,
      status: item.status ? String(item.status) : null,
    })),
  }

  return {
    ...parcial,
    diagnosticos: classificarDiagnosticosImpressora(parcial),
  }
}

export function listarImpressorasSistema(
  executarConsulta?: (comando: string) => string,
  env: NodeJS.ProcessEnv = process.env,
): ImpressorasSistemaResposta {
  const vazia: ImpressorasSistemaResposta = {
    impressoras: [],
    portasCom: [],
    portasUsbLivres: [],
    dispositivos: [],
    diagnosticos: [],
  }

  if (env.PDV_IMPRESSORA_MOCK === '1') {
    return vazia
  }

  if (env.NODE_ENV === 'test' && !executarConsulta) {
    return vazia
  }

  if (!executarConsulta && process.platform !== 'win32') {
    return vazia
  }

  const executar = executarConsulta ?? executarConsultaPowerShellConfig

  try {
    const saida = executar(COMANDO_LISTAR_IMPRESSORAS)
    return parseRespostaImpressorasSistema(saida)
  } catch {
    return vazia
  }
}
