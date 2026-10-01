import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type {
  InstalarImpressoraGenericaEntrada,
  ResultadoInstalacaoImpressoraGenerica,
} from '@shared/types/config-impressora'

const NOME_PADRAO_IMPRESSORA = 'Impressora Jardins'

/**
 * Roda elevado (UAC): instala o driver "Generic / Text Only" embutido do
 * Windows e cria a fila na porta USB livre. Térmicas ESC/POS recebem RAW do
 * PDV, então o driver genérico é suficiente — sem instalador do fabricante.
 * O resultado sai por arquivo porque processo elevado não devolve stdout.
 */
const SCRIPT_INSTALAR_GENERICA = `
param(
  [string]$PortName = '',
  [string]$PrinterName = '',
  [string]$ResultPath = ''
)

function Gravar([string]$texto) {
  [IO.File]::WriteAllText($ResultPath, $texto)
}

try {
  $ErrorActionPreference = 'Stop'

  if (-not (Get-PrinterDriver -Name 'Generic / Text Only' -ErrorAction SilentlyContinue)) {
    Add-PrinterDriver -Name 'Generic / Text Only'
  }

  $porta = $PortName.Trim()
  if (-not $porta) {
    $usadas = @(Get-Printer | ForEach-Object { $_.PortName })
    $livre = @(Get-PrinterPort | Where-Object {
      $_.Name -match '^USB\\d+' -and $usadas -notcontains $_.Name
    } | Select-Object -First 1)
    if ($livre) { $porta = $livre.Name }
  }

  if (-not $porta) {
    Gravar 'FAIL:Nenhuma porta USB de impressao livre foi encontrada. Verifique se a impressora esta ligada e com o cabo USB conectado.'
    exit 1
  }

  $nome = $PrinterName.Trim()
  if (-not $nome) { $nome = 'Impressora Jardins' }
  $base = $nome
  $i = 2
  while (Get-Printer -Name $nome -ErrorAction SilentlyContinue) {
    $nome = "$base ($i)"
    $i++
  }

  Add-Printer -Name $nome -DriverName 'Generic / Text Only' -PortName $porta
  Gravar "OK:$nome|$porta"
  exit 0
} catch {
  Gravar ('FAIL:' + $_.Exception.Message)
  exit 1
}
`.trim()

export function interpretarResultadoInstalacaoGenerica(
  conteudo: string,
): ResultadoInstalacaoImpressoraGenerica {
  const texto = conteudo.trim()

  if (texto.startsWith('OK:')) {
    const [nome = '', porta = ''] = texto.slice(3).split('|')
    return {
      instalada: true,
      nomeImpressora: nome.trim() || null,
      porta: porta.trim() || null,
      mensagem: `Impressora "${nome.trim()}" instalada na ${porta.trim()}.`,
    }
  }

  const detalhe = texto.startsWith('FAIL:') ? texto.slice(5).trim() : texto
  return {
    instalada: false,
    nomeImpressora: null,
    porta: null,
    mensagem: detalhe || 'Falha desconhecida ao instalar a impressora genérica.',
  }
}

function executarElevado(script: string, resultado: string, porta: string, nome: string): void {
  const argumentos =
    `-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "${script}" ` +
    `-PortName "${porta}" -PrinterName "${nome}" -ResultPath "${resultado}"`
  const comando =
    `Start-Process powershell.exe -Verb RunAs -Wait -WindowStyle Hidden ` +
    `-ArgumentList '${argumentos.replace(/'/g, "''")}'`

  execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', comando], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    windowsHide: true,
    timeout: 120_000,
  })
}

interface DependenciasInstalacao {
  executar?: (script: string, resultado: string, porta: string, nome: string) => void
  lerResultado?: (caminho: string) => string
  env?: NodeJS.ProcessEnv
}

export function instalarImpressoraGenerica(
  entrada: InstalarImpressoraGenericaEntrada = {},
  dependencias: DependenciasInstalacao = {},
): ResultadoInstalacaoImpressoraGenerica {
  const env = dependencias.env ?? process.env

  if (env.NODE_ENV === 'test' || env.PDV_IMPRESSORA_MOCK === '1') {
    return {
      instalada: false,
      nomeImpressora: null,
      porta: null,
      mensagem: 'Instalação de impressora desabilitada em ambiente de teste.',
    }
  }

  if (!dependencias.executar && process.platform !== 'win32') {
    return {
      instalada: false,
      nomeImpressora: null,
      porta: null,
      mensagem: 'Instalação automática de impressora só está disponível no Windows.',
    }
  }

  const porta = entrada.porta?.trim() ?? ''
  const nome = entrada.nomeSugerido?.trim() || NOME_PADRAO_IMPRESSORA
  const script = join(tmpdir(), `pdv-instalar-generica-${process.pid}.ps1`)
  const resultado = join(tmpdir(), `pdv-instalar-generica-${process.pid}.txt`)

  const executar = dependencias.executar ?? executarElevado
  const lerResultado =
    dependencias.lerResultado ?? ((caminho: string) => readFileSync(caminho, 'utf8'))

  try {
    writeFileSync(script, SCRIPT_INSTALAR_GENERICA, 'utf8')
    executar(script, resultado, porta, nome)
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro)
    if (/cancelad|canceled/i.test(mensagem)) {
      return {
        instalada: false,
        nomeImpressora: null,
        porta: null,
        mensagem:
          'Instalação cancelada. O Windows pediu permissão de administrador e ela não foi concedida — clique em "Sim" na janela de permissão para instalar.',
      }
    }
    return {
      instalada: false,
      nomeImpressora: null,
      porta: null,
      mensagem: `Não foi possível executar a instalação: ${mensagem}`,
    }
  } finally {
    try {
      unlinkSync(script)
    } catch {
      // script temporário
    }
  }

  try {
    if (!dependencias.lerResultado && !existsSync(resultado)) {
      return {
        instalada: false,
        nomeImpressora: null,
        porta: null,
        mensagem:
          'A instalação terminou sem gravar resultado. Tente novamente ou instale manualmente pelo Painel de Controle.',
      }
    }

    return interpretarResultadoInstalacaoGenerica(lerResultado(resultado))
  } finally {
    try {
      unlinkSync(resultado)
    } catch {
      // resultado temporário
    }
  }
}
