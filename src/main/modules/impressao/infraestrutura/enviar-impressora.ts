import { execFileSync } from 'node:child_process'
import { unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/** Legado: lock em arquivo ficava orfao apos reinicio do Electron no dev. */
const CAMINHO_LOCK_LEGADO = join(tmpdir(), 'pdv-impressora.lock')
/** Precisa exceder o timeout de escrita do driver (8s + 5ms/byte) com folga. */
const TIMEOUT_SCRIPT_MS = 45_000
/** WritePrinter e rapido; o que trava e o EndDoc/Close com a MP-4200 em Error. */
const TIMEOUT_SPOOLER_MS = 15_000
/** Marcador emitido pelo script assim que os bytes saem para a impressora. */
const MARCADOR_BYTES_ENVIADOS = /(^|\n)\s*WROTE:\d+/
const SCRIPT_IMPRESSORA_COM = join(tmpdir(), `pdv-impressora-com-${process.pid}.ps1`)
const SCRIPT_SPOOLER = join(tmpdir(), `pdv-impressora-spooler-${process.pid}.ps1`)

/** Falha antes de qualquer byte sair: reenviar nao duplica o cupom. */
const PREFIXO_FALHA_SEGURA = 'ABERTURA:'

let scriptComInicializado = false
let scriptSpoolerInicializado = false
let impressaoEmAndamento = false

export function impressoraEstaOcupada(): boolean {
  return impressaoEmAndamento
}

export function removerLockImpressoraLegado(
  caminho = CAMINHO_LOCK_LEGADO,
  remover = unlinkSync,
): void {
  try {
    remover(caminho)
  } catch {
    // lock legado inexistente ou ja removido
  }
}

export type DestinoImpressao =
  | { tipo: 'SIMULADO' }
  | { tipo: 'NAO_CONFIGURADO' }
  | { tipo: 'SPOOLER'; nome: string }
  | { tipo: 'COM'; porta: string; nomeImpressora: string }

export function deveSimularImpressora(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.NODE_ENV === 'test' || env.PDV_IMPRESSORA_MOCK === '1'
}

export function obterNomeImpressoraLocal(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return env.PDV_IMPRESSORA_NOME?.trim() || 'MP-4200 TH'
}

export function obterPortaImpressoraLocal(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return env.PDV_IMPRESSORA_PORTA?.trim() || 'COM10'
}

export function resolverDestinoImpressao(
  env: NodeJS.ProcessEnv = process.env,
): DestinoImpressao {
  if (deveSimularImpressora(env)) {
    return { tipo: 'SIMULADO' }
  }

  if (env.PDV_IMPRESSORA_COM === '1') {
    return {
      tipo: 'COM',
      porta: obterPortaImpressoraLocal(env),
      nomeImpressora: obterNomeImpressoraLocal(env),
    }
  }

  return { tipo: 'SPOOLER', nome: obterNomeImpressoraLocal(env) }
}

export function falhaPermiteReenvio(erro: unknown): boolean {
  const mensagem = erro instanceof Error ? erro.message : String(erro)
  return mensagem.startsWith(PREFIXO_FALHA_SEGURA)
}

export function enviarBufferImpressora(
  buffer: Buffer,
  destino = resolverDestinoImpressao(),
): void {
  if (destino.tipo === 'SIMULADO' || destino.tipo === 'NAO_CONFIGURADO') {
    return
  }

  executarComLockImpressora(() => {
    if (destino.tipo === 'COM') {
      enviarViaComWindows(buffer, destino.porta, destino.nomeImpressora)
      return
    }

    enviarViaSpoolerWindows(buffer, destino.nome)
  })
}

function executarComLockImpressora<T>(operacao: () => T): T {
  if (impressaoEmAndamento) {
    throw new Error('Impressora ocupada. Aguarde o cupom anterior terminar.')
  }

  impressaoEmAndamento = true
  removerLockImpressoraLegado()

  try {
    return operacao()
  } finally {
    impressaoEmAndamento = false
  }
}

function garantirScriptCom(): void {
  writeFileSync(SCRIPT_IMPRESSORA_COM, SCRIPT_ENVIAR_COM, 'utf8')
  scriptComInicializado = true
}

export function retomarImpressoraWindows(
  nomeImpressora: string,
  executarScript = executarScriptPowerShellArquivo,
): void {
  garantirScriptCom()
  executarScript(SCRIPT_IMPRESSORA_COM, {
    PrinterName: nomeImpressora,
    PortName: obterPortaImpressoraLocal(),
    FilePath: '',
    Modo: 'Retomar',
  })
}

export function limparFilaImpressora(
  nomeImpressora: string,
  executarScript = executarScriptPowerShellArquivo,
): void {
  garantirScriptCom()
  executarScript(SCRIPT_IMPRESSORA_COM, {
    PrinterName: nomeImpressora,
    PortName: obterPortaImpressoraLocal(),
    FilePath: '',
    Modo: 'Limpar',
  })
}

/** Tentativas de esvaziar a fila antes de desistir (job "Retained" demora). */
const TENTATIVAS_LIMPAR_FILA = 3

export function prepararImpressoraParaEnvio(
  nomeImpressora: string,
  limpar = limparFilaImpressora,
  retomar = retomarImpressoraWindows,
  consultarStatus = consultarStatusImpressoraWindows,
): void {
  try {
    retomar(nomeImpressora)
  } catch {
    // retomar e seguir
  }

  let status = consultarStatus(nomeImpressora)

  // Status "Error" sem job na fila e falso positivo comum na Bematech: o cupom
  // sai normalmente. O que realmente trava tudo e um job preso ("Retained") —
  // enfileirar outro em cima dele deixa a impressora inutilizavel ate limpar.
  for (
    let tentativa = 0;
    tentativa < TENTATIVAS_LIMPAR_FILA &&
    status &&
    (status.jobCount > 0 || status.printerStatus === 'Paused');
    tentativa += 1
  ) {
    try {
      limpar(nomeImpressora)
    } catch {
      // limpar e seguir
    }
    esperarMs(600)
    try {
      retomar(nomeImpressora)
    } catch {
      // retomar e seguir
    }
    status = consultarStatus(nomeImpressora)
  }

  if (status && status.jobCount > 0) {
    throw new Error(
      `A fila da impressora ${nomeImpressora} esta travada com ${status.jobCount} job(s) que o Windows nao libera. ` +
        'Desligue a impressora pelo botao de tras, aguarde 5 segundos e ligue de novo. ' +
        'Se nao resolver, rode scripts/recuperar-impressora.ps1 como Administrador (reinicia o Spooler de Impressao).',
    )
  }
}

export function recuperarImpressoraWindows(
  nomeImpressora: string,
  limpar = limparFilaImpressora,
  retomar = retomarImpressoraWindows,
  consultarStatus = consultarStatusImpressoraWindows,
): StatusImpressoraWindows | null {
  try {
    retomar(nomeImpressora)
  } catch {
    // retomar e seguir
  }

  try {
    limpar(nomeImpressora)
  } catch {
    // limpar e seguir
  }

  esperarMs(300)

  try {
    retomar(nomeImpressora)
  } catch {
    // retomar e seguir
  }

  return consultarStatus(nomeImpressora)
}

/** COM direto nao depende da fila do spooler; nao bloqueia em job Retained. */
export function prepararImpressoraParaEnvioCom(
  nomeImpressora: string,
  retomar = retomarImpressoraWindows,
): void {
  try {
    retomar(nomeImpressora)
  } catch {
    // retomar e seguir — envio serial e independente da fila virtual
  }
}

function enviarViaComWindows(
  buffer: Buffer,
  porta: string,
  nomeImpressora: string,
): void {
  prepararImpressoraParaEnvioCom(nomeImpressora)

  const portaAtual = resolverPortaComImpressora(nomeImpressora, porta)
  let ultimoErro: unknown

  const tentar = (portaAlvo: string): 'ok' | 'reenviar' | 'fatal' => {
    try {
      executarEnvioCom(buffer, portaAlvo, nomeImpressora)
      return 'ok'
    } catch (erro) {
      ultimoErro = erro
      return falhaPermiteReenvio(erro) ? 'reenviar' : 'fatal'
    }
  }

  const primeira = tentar(portaAtual)
  if (primeira === 'ok') {
    return
  }
  if (primeira === 'fatal') {
    throw new Error(
      obterMensagemErroImpressora(nomeImpressora, extrairDetalhe(ultimoErro)),
    )
  }

  try {
    limparFilaImpressora(nomeImpressora)
  } catch {
    // limpar a fila e tentar a COM de novo
  }

  const portaDepois = resolverPortaComImpressora(nomeImpressora, porta)
  const segunda = tentar(portaDepois)
  if (segunda === 'ok') {
    return
  }

  throw new Error(
    obterMensagemErroImpressora(nomeImpressora, extrairDetalhe(ultimoErro)),
  )
}

export function normalizarPortaCom(porta: string | null | undefined): string | null {
  if (!porta?.trim()) {
    return null
  }

  const limpa = porta.trim().replace(/:$/, '')
  return /^COM\d+$/i.test(limpa) ? limpa.toUpperCase() : null
}

/** Portas virtuais do driver (Bematech_USB etc.) nao entregam bytes ESC/POS de forma confiavel. */
export function portaImpressoraEhVirtual(portName: string | null | undefined): boolean {
  if (!portName?.trim()) {
    return false
  }

  return normalizarPortaCom(portName) === null
}

export function listarPortasComWindows(
  executarConsulta = executarConsultaPowerShell,
): string[] {
  try {
    const saida = executarConsulta(
      `@([System.IO.Ports.SerialPort]::GetPortNames() | Sort-Object | ForEach-Object { $_.ToUpper() }) -join '|'`,
    ).trim()

    if (!saida) {
      return []
    }

    return saida
      .split('|')
      .map((porta) => normalizarPortaCom(porta))
      .filter((porta): porta is string => Boolean(porta))
  } catch {
    return []
  }
}

function escolherPortaComDisponivel(
  preferencias: Array<string | null | undefined>,
  portasSistema: string[],
): string | null {
  for (const preferencia of preferencias) {
    const porta = normalizarPortaCom(preferencia)
    if (porta && portasSistema.includes(porta)) {
      return porta
    }
  }

  if (portasSistema.length === 1) {
    return portasSistema[0] ?? null
  }

  return null
}

/** PortName bruto do Windows (COM10, Bematech_USB, etc.). */
export function consultarPortNameImpressoraWindows(
  nomeImpressora: string,
  executarConsulta = executarConsultaPowerShell,
): string | null {
  try {
    const nomeEscapado = nomeImpressora.replace(/'/g, "''")
    const saida = executarConsulta(
      `$p = Get-Printer -Name '${nomeEscapado}' -ErrorAction SilentlyContinue | Select-Object -First 1; if ($null -eq $p) { '' } else { $p.PortName }`,
    ).trim()

    return saida || null
  } catch {
    return null
  }
}

/** Porta COM atual pelo nome exato da impressora no Windows (Get-Printer). */
export function detectarPortaComAtual(
  nomeImpressora: string,
  executarConsulta = executarConsultaPowerShell,
): string | null {
  return normalizarPortaCom(consultarPortNameImpressoraWindows(nomeImpressora, executarConsulta))
}

/** Prioriza a porta detectada agora (USB pode mudar COM apos reconectar). */
export function resolverPortaComImpressora(
  nomeImpressora: string,
  portaConfigurada?: string | null,
  env: NodeJS.ProcessEnv = process.env,
  detectar = detectarPortaComAtual,
  listarPortas = listarPortasComWindows,
): string {
  const detectada = detectar(nomeImpressora)
  if (detectada) {
    return detectada
  }

  const portasSistema = listarPortas()
  const escolhida = escolherPortaComDisponivel(
    [portaConfigurada, obterPortaImpressoraLocal(env)],
    portasSistema,
  )
  if (escolhida) {
    return escolhida
  }

  return normalizarPortaCom(portaConfigurada) ?? obterPortaImpressoraLocal(env)
}

function enviarViaSpoolerWindows(
  buffer: Buffer,
  nomeImpressora: string,
): void {
  prepararImpressoraParaEnvio(nomeImpressora)

  try {
    // WritePrinter OK = bytes entregues ao driver; nao checamos status Error
    // depois porque a MP-4200 via Bematech_USB imprime mesmo com Error no Windows.
    executarEnvioRawSpooler(buffer, nomeImpressora)
    return
  } catch (erroSpooler) {
    const detalheSpooler = extrairDetalhe(erroSpooler)
    const portaReal = detectarPortaComAtual(nomeImpressora)

    // Sem porta COM real (ex.: Bematech_USB), tentar uma porta inventada gera um
    // timeout de 45s que reporta falha depois do cupom ja ter saido.
    if (!portaReal) {
      throw new Error(
        obterMensagemErroImpressora(nomeImpressora, `Spooler: ${detalheSpooler}`),
      )
    }

    try {
      executarEnvioCom(buffer, portaReal, nomeImpressora)
    } catch (erroCom) {
      limparFilaImpressora(nomeImpressora)
      const detalheCom = extrairDetalhe(erroCom)
      throw new Error(
        obterMensagemErroImpressora(
          nomeImpressora,
          `Spooler: ${detalheSpooler}. COM: ${detalheCom}`,
        ),
      )
    }
  }
}

function extrairDetalhe(erro: unknown): string {
  const mensagem = erro instanceof Error ? erro.message : String(erro)
  return mensagem.startsWith(PREFIXO_FALHA_SEGURA)
    ? mensagem.slice(PREFIXO_FALHA_SEGURA.length).trim()
    : mensagem
}

function executarEnvioCom(
  buffer: Buffer,
  porta: string,
  nomeImpressora: string,
): void {
  garantirScriptCom()

  const arquivo = criarArquivoTemporario(buffer)

  try {
    executarScriptPowerShellArquivo(SCRIPT_IMPRESSORA_COM, {
      PrinterName: nomeImpressora,
      PortName: porta,
      FilePath: arquivo,
      Modo: 'Imprimir',
    })
    esperarMs(250)
  } finally {
    removerArquivoTemporario(arquivo)
  }
}

function executarEnvioRawSpooler(buffer: Buffer, nomeImpressora: string): void {
  if (!scriptSpoolerInicializado) {
    writeFileSync(SCRIPT_SPOOLER, SCRIPT_SPOOLER_RAW, 'utf8')
    scriptSpoolerInicializado = true
  }

  const arquivo = criarArquivoTemporario(buffer)

  try {
    executarScriptPowerShellArquivo(
      SCRIPT_SPOOLER,
      {
        PrinterName: nomeImpressora,
        FilePath: arquivo,
      },
      TIMEOUT_SPOOLER_MS,
    )
  } finally {
    removerArquivoTemporario(arquivo)
  }
}

function criarArquivoTemporario(buffer: Buffer): string {
  const arquivo = join(tmpdir(), `pdv-escpos-${process.pid}-${Date.now()}.bin`)
  writeFileSync(arquivo, buffer)
  return arquivo
}

function removerArquivoTemporario(arquivo: string): void {
  try {
    unlinkSync(arquivo)
  } catch {
    // arquivo temporario
  }
}

export function orientarFalhaPortaCom(detalhe: string): string {
  const texto = detalhe.toLowerCase()
  if (
    texto.includes('nao esta funcionando') ||
    texto.includes('não está funcionando') ||
    texto.includes('not functioning')
  ) {
    return 'O cabo USB da impressora travou. Desligue pelo botao de tras, desconecte o USB, espere 5 segundos, ligue e conecte de novo. A porta COM pode mudar depois disso.'
  }

  if (
    texto.includes('etimedout') ||
    texto.includes('timeout') ||
    texto.includes('121') ||
    texto.includes('1460')
  ) {
    return 'A impressora nao respondeu a tempo. Verifique se ela esta ligada e com papel; se persistir, desligue-a pelo botao de tras, desconecte o USB, espere 5 segundos, ligue e conecte de novo.'
  }

  if (texto.includes('acesso') || texto.includes('access denied')) {
    return 'A porta COM esta ocupada. Feche a fila da MP-4200 no Windows e qualquer outro programa usando a impressora.'
  }

  return detalhe
}

export function obterMensagemErroImpressora(
  nomeImpressora: string,
  detalhe: string,
  consultarStatus = consultarStatusImpressoraWindows,
  detectarPorta = detectarPortaComAtual,
): string {
  const orientacao = orientarFalhaPortaCom(detalhe)
  const portaAtual = detectarPorta(nomeImpressora)
  const orientacaoPorta = portaAtual
    ? ` Porta detectada agora: ${portaAtual}.`
    : ''
  const tecnico = orientacao === detalhe ? '' : ` [${detalhe}]`
  const status = consultarStatus(nomeImpressora)
  if (status?.printerStatus === 'Paused') {
    return `A impressora ${nomeImpressora} esta pausada no Windows. Abra a fila de impressao, desmarque "Pausar impressao" no menu Impressora, ou reinicie o PDV (ele retoma automaticamente). ${orientacao}${orientacaoPorta}${tecnico}`
  }

  if (status?.printerStatus === 'Error') {
    return `A impressora ${nomeImpressora} nao responde. Desligue-a (botao atras), aguarde 5 segundos, ligue de novo e tente outra vez. ${orientacao}${orientacaoPorta}${tecnico}`
  }

  if (status && status.jobCount > 0) {
    return `A fila da impressora ${nomeImpressora} ainda tem ${status.jobCount} job(s) preso(s). ${orientacao}${orientacaoPorta}${tecnico}`
  }

  return `Nao foi possivel enviar para a impressora ${nomeImpressora}. ${orientacao}${orientacaoPorta}${tecnico}`
}

export interface StatusImpressoraWindows {
  printerStatus: string
  jobCount: number
}

export function consultarStatusImpressoraWindows(
  nomeImpressora: string,
  executarConsulta = executarConsultaPowerShell,
): StatusImpressoraWindows | null {
  try {
    const nomeEscapado = nomeImpressora.replace(/'/g, "''")
    const saida = executarConsulta(
      `$p = Get-Printer -Name '${nomeEscapado}' -ErrorAction Stop; "$($p.PrinterStatus)|$($p.JobCount)"`,
    ).trim()

    const [printerStatus = 'Unknown', jobCountTexto = '0'] = saida.split('|')
    return {
      printerStatus,
      jobCount: Number(jobCountTexto) || 0,
    }
  } catch {
    return null
  }
}

function esperarMs(milissegundos: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milissegundos)
}

function executarConsultaPowerShell(comando: string): string {
  return execFileSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', comando],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true },
  )
}

function executarScriptPowerShellArquivo(
  script: string,
  parametros: Record<string, string>,
  timeoutMs = TIMEOUT_SCRIPT_MS,
): void {
  const argumentos = [
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    script,
  ]

  for (const [nome, valor] of Object.entries(parametros)) {
    argumentos.push(`-${nome}`, valor)
  }

  try {
    const saida = execFileSync('powershell.exe', argumentos, {
      timeout: timeoutMs,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })
    concluirScriptImpressora(saida)
  } catch (erro) {
    if (erro instanceof Error && !ehErroExecFile(erro)) {
      throw erro
    }

    concluirScriptImpressora(extrairSaidaExecFile(erro), erro)
  }
}

export function ehErroExecFile(erro: Error): boolean {
  return erro.message.startsWith('Command failed') || 'stdout' in erro
}

export function extrairSaidaExecFile(erro: unknown): string {
  if (!erro || typeof erro !== 'object') {
    return ''
  }

  const execucao = erro as { stdout?: unknown; stderr?: unknown }
  return [textoBufferOuString(execucao.stdout), textoBufferOuString(execucao.stderr)]
    .filter(Boolean)
    .join('\n')
    .trim()
}

function textoBufferOuString(valor: unknown): string {
  if (typeof valor === 'string') {
    return valor.trim()
  }

  if (Buffer.isBuffer(valor)) {
    return valor.toString('utf8').trim()
  }

  return ''
}

export function concluirScriptImpressora(saida: string, erroExecucao?: unknown): void {
  const texto = saida.trim()

  // Bytes ja entregues a impressora. O resto do script (EndDoc/CloseHandle) pode
  // travar com a MP-4200 em Error, mas o cupom sai — nao e falha de impressao.
  if (MARCADOR_BYTES_ENVIADOS.test(texto)) {
    return
  }

  if (texto === 'OK' || texto.endsWith('\nOK')) {
    return
  }

  if (texto.startsWith('FAIL:')) {
    throw new Error(texto.slice(5).trim())
  }

  if (texto) {
    throw new Error(texto)
  }

  throw new Error(
    erroExecucao instanceof Error
      ? erroExecucao.message
      : 'Falha desconhecida ao enviar para a impressora.',
  )
}

/**
 * Caminho rapido nao consulta WMI: cada Get-CimInstance custa segundos e ja
 * estourou o timeout do Node, o que reenviava um cupom ja impresso.
 */
const SCRIPT_ENVIAR_COM = `
param(
  [string]$PrinterName = '',
  [string]$PortName,
  [string]$FilePath = '',
  [ValidateSet('Imprimir', 'Limpar', 'Retomar')]
  [string]$Modo = 'Imprimir'
)

$ErrorActionPreference = 'Stop'

function Retomar-Impressora {
  param([string]$Nome)
  if ([string]::IsNullOrWhiteSpace($Nome)) { return }
  $nomeEscapado = $Nome.Replace("'", "''")
  $printer = Get-CimInstance Win32_Printer -Filter "Name='$nomeEscapado'" -ErrorAction SilentlyContinue
  if ($null -ne $printer) {
    [void](Invoke-CimMethod -InputObject $printer -MethodName Resume -ErrorAction SilentlyContinue)
  }
}

if ($Modo -eq 'Retomar') {
  try {
    Retomar-Impressora -Nome $PrinterName
    Write-Output 'OK'
    exit 0
  } catch {
    Write-Output ("FAIL:ABERTURA:" + $_.Exception.Message)
    exit 1
  }
}

if ($Modo -eq 'Limpar') {
  try {
    Retomar-Impressora -Nome $PrinterName
    # Job "Retained" nao sai no primeiro Remove-PrintJob: o driver ainda segura a
    # porta. Precisa de mais voltas e pausas maiores para a fila realmente zerar.
    for ($t = 0; $t -lt 6; $t++) {
      $jobs = @(Get-PrintJob -PrinterName $PrinterName -ErrorAction SilentlyContinue)
      if ($jobs.Count -eq 0) { break }
      foreach ($job in $jobs) {
        Remove-PrintJob -PrinterName $PrinterName -ID $job.Id -ErrorAction SilentlyContinue
      }
      Start-Sleep -Milliseconds 350
    }
    Retomar-Impressora -Nome $PrinterName
    Write-Output 'OK'
    exit 0
  } catch {
    Retomar-Impressora -Nome $PrinterName
    Write-Output ("FAIL:ABERTURA:" + $_.Exception.Message)
    exit 1
  }
}

# SerialPort.Open() na MP-4200 chama SetCommState e o USB responde
# "dispositivo nao esta funcionando". CreateFile + DTR/RTS via Win32 funciona.
try {
  $bytes = [IO.File]::ReadAllBytes($FilePath)
  if (-not ([System.Management.Automation.PSTypeName]'PdvComPort').Type) {
    Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class PdvComPort {
  [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
  public static extern IntPtr CreateFile(string name, uint acc, uint share, IntPtr sec, uint disp, uint flags, IntPtr tmpl);
  [DllImport("kernel32.dll", SetLastError = true)]
  public static extern bool WriteFile(IntPtr h, byte[] buf, int count, out int written, IntPtr overlapped);
  [DllImport("kernel32.dll", SetLastError = true)]
  public static extern bool CloseHandle(IntPtr h);
  [DllImport("kernel32.dll", SetLastError = true)]
  public static extern bool EscapeCommFunction(IntPtr h, uint fn);
  [StructLayout(LayoutKind.Sequential)]
  public struct COMMTIMEOUTS {
    public uint ReadIntervalTimeout;
    public uint ReadTotalTimeoutMultiplier;
    public uint ReadTotalTimeoutConstant;
    public uint WriteTotalTimeoutMultiplier;
    public uint WriteTotalTimeoutConstant;
  }
  [DllImport("kernel32.dll", SetLastError = true)]
  public static extern bool SetCommTimeouts(IntPtr h, ref COMMTIMEOUTS t);
  public static IntPtr OpenCom(string port) {
    string path = new string((char)92, 2) + "." + (char)92 + port;
    return CreateFile(path, 1073741824, 0, IntPtr.Zero, 3, 0, IntPtr.Zero);
  }
  // Sem timeout de escrita, uma impressora travada bloqueia o WriteFile no
  // kernel para sempre: o processo vira zumbi imortal segurando a COM e a
  // porta entra em colapso (erros 5/2/121). Com timeout, o WriteFile falha
  // com ERROR_TIMEOUT (1460) e o processo sai limpo, soltando a porta.
  public static void AplicarTimeoutEscrita(IntPtr h) {
    COMMTIMEOUTS t = new COMMTIMEOUTS();
    t.ReadIntervalTimeout = 0;
    t.ReadTotalTimeoutMultiplier = 0;
    t.ReadTotalTimeoutConstant = 0;
    t.WriteTotalTimeoutMultiplier = 5;
    t.WriteTotalTimeoutConstant = 8000;
    SetCommTimeouts(h, ref t);
  }
}
"@
  }
} catch {
  Write-Output ("FAIL:ABERTURA:" + $_.Exception.Message)
  exit 1
}

$handle = [IntPtr]::Zero
$saida = 'OK'
$codigo = 0
try {
  $handle = [PdvComPort]::OpenCom($PortName)
  if ($handle -eq [IntPtr]::Zero -or $handle -eq [IntPtr]::new(-1)) {
    throw "Nao foi possivel abrir $PortName (Win32 $([Runtime.InteropServices.Marshal]::GetLastWin32Error()))."
  }
  [PdvComPort]::AplicarTimeoutEscrita($handle)
  [void][PdvComPort]::EscapeCommFunction($handle, 5)
  [void][PdvComPort]::EscapeCommFunction($handle, 3)
  Start-Sleep -Milliseconds 400
  $escritos = 0
  $ok = [PdvComPort]::WriteFile($handle, $bytes, $bytes.Length, [ref]$escritos, [IntPtr]::Zero)
  if (-not $ok -or $escritos -le 0) {
    throw "A impressora nao aceitou os bytes em $PortName (Win32 $([Runtime.InteropServices.Marshal]::GetLastWin32Error()))."
  }
  [Console]::Out.WriteLine("WROTE:$escritos")
  [Console]::Out.Flush()
  Start-Sleep -Milliseconds 400
} catch {
  $prefixo = 'FAIL:'
  if ($handle -eq [IntPtr]::Zero -or $handle -eq [IntPtr]::new(-1)) {
    $prefixo = 'FAIL:ABERTURA:'
  }
  $saida = $prefixo + $_.Exception.Message
  $codigo = 1
} finally {
  try {
    if ($handle -ne [IntPtr]::Zero -and $handle -ne [IntPtr]::new(-1)) {
      [void][PdvComPort]::CloseHandle($handle)
    }
  } catch {}
}
Write-Output $saida
exit $codigo
`

const SCRIPT_SPOOLER_RAW = `
param([string]$PrinterName, [string]$FilePath)
$ErrorActionPreference = 'Stop'
try {
  Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class PdvRawPrinter {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
  public class DOCINFOA {
    [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
  }
  [DllImport("winspool.drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi)]
  public static extern bool OpenPrinter(string szPrinter, out IntPtr hPrinter, IntPtr pd);
  [DllImport("winspool.drv", EntryPoint = "ClosePrinter", SetLastError = true)]
  public static extern bool ClosePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi)]
  public static extern int StartDocPrinter(IntPtr hPrinter, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);
  [DllImport("winspool.drv", EntryPoint = "EndDocPrinter", SetLastError = true)]
  public static extern bool EndDocPrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", EntryPoint = "StartPagePrinter", SetLastError = true)]
  public static extern bool StartPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", EntryPoint = "EndPagePrinter", SetLastError = true)]
  public static extern bool EndPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", EntryPoint = "WritePrinter", SetLastError = true)]
  public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);
}
"@
  $bytes = [IO.File]::ReadAllBytes($FilePath)
  $handle = [IntPtr]::Zero
  if (-not [PdvRawPrinter]::OpenPrinter($PrinterName, [ref]$handle, [IntPtr]::Zero)) {
    throw "Impressora nao encontrada: $PrinterName"
  }
  try {
    $info = New-Object PdvRawPrinter+DOCINFOA
    $info.pDocName = 'PDV Jardins'
    $info.pDataType = 'RAW'
    if ([PdvRawPrinter]::StartDocPrinter($handle, 1, $info) -eq 0) {
      throw 'Falha ao iniciar documento na impressora.'
    }
    try {
      [void][PdvRawPrinter]::StartPagePrinter($handle)
      $ptr = [Runtime.InteropServices.Marshal]::AllocHGlobal($bytes.Length)
      try {
        [Runtime.InteropServices.Marshal]::Copy($bytes, 0, $ptr, $bytes.Length)
        $escritos = 0
        if (-not [PdvRawPrinter]::WritePrinter($handle, $ptr, $bytes.Length, [ref]$escritos)) {
          throw 'Falha ao escrever na impressora.'
        }
        [Console]::Out.WriteLine("WROTE:$escritos")
        [Console]::Out.Flush()
        Start-Sleep -Milliseconds 250
      } finally {
        [Runtime.InteropServices.Marshal]::FreeHGlobal($ptr)
      }
      [void][PdvRawPrinter]::EndPagePrinter($handle)
    } finally {
      [void][PdvRawPrinter]::EndDocPrinter($handle)
    }
  } finally {
    [void][PdvRawPrinter]::ClosePrinter($handle)
  }
  Write-Output 'OK'
  exit 0
} catch {
  Write-Output ("FAIL:" + $_.Exception.Message)
  exit 1
}
`
