import type {
  AutenticarOperadorEntrada,
  OperadorConfig,
  OperadorEntradaResumo,
  OperadorResumo,
  SalvarOperadorEntrada,
} from '@shared/types/operador'
import { PERFIL_OPERADOR } from '@shared/types/operador'
import { OPERADORES_PADRAO } from '@shared/constants/operador-padrao'
import type { ConexaoSqlite } from '../../../database/conexao-sqlite'
import { obterConexaoBancoLocal } from '../../../database/inicializar-banco'
import {
  CODIGOS_ERRO_CONFIGURACOES,
  ErroConfiguracoes,
} from '../errors/erros-configuracoes'
import {
  criarOperadorUsuarioRepository,
  type OperadorUsuarioRepository,
} from '../repositories/operador-usuario.repository'
import {
  definirSessaoOperador,
  assertPermissaoOperador,
} from '../services/contexto-sessao-operador'
import { PERMISSAO_PDV } from '@shared/types/operador'
import {
  hashPinOperador,
  pinEstaHasheado,
  verificarPinOperador,
} from '../util/hash-pin-operador'

const PINS_LEGADOS_3_DIGITOS: Record<string, string> = {
  '00000000-0000-4000-8000-000000000001': '147',
  '00000000-0000-4000-8000-000000000002': '258',
  '00000000-0000-4000-8000-000000000003': '369',
}

const OPERADOR_TESTE: OperadorConfig = {
  operadorId: 'operador-teste',
  operadorNome: 'Operador Teste',
  perfil: PERFIL_OPERADOR.ADMIN,
}

function paraOperadorConfig(registro: OperadorResumo): OperadorConfig {
  return {
    operadorId: registro.operadorId,
    operadorNome: registro.operadorNome,
    perfil: registro.perfil,
  }
}

/** Cria usuarios padrao se o terminal ainda nao tiver nenhum. */
export function garantirOperadorPadrao(conexao: ConexaoSqlite): void {
  if (process.env.NODE_ENV === 'test') {
    return
  }

  const repositorio = criarOperadorUsuarioRepository(conexao)
  if (repositorio.contarAtivos() > 0) {
    return
  }

  for (const operador of OPERADORES_PADRAO) {
    repositorio.inserir({
      id: operador.id,
      nome: operador.nome,
      pinHash: hashPinOperador(operador.pin),
      perfil: operador.perfil,
    })
  }
}

/** Atualiza PINs padrao que ainda usam o formato legado de 3 digitos. */
export function garantirPinsOperadoresLegado(conexao: ConexaoSqlite): void {
  if (process.env.NODE_ENV === 'test') {
    return
  }

  const repositorio = criarOperadorUsuarioRepository(conexao)

  for (const operador of OPERADORES_PADRAO) {
    const registro = repositorio.buscarPorId(operador.id)
    if (!registro?.ativo) {
      continue
    }

    const pinLegado = PINS_LEGADOS_3_DIGITOS[operador.id]
    if (!pinLegado) {
      continue
    }

    const aindaUsaPinLegado = pinEstaHasheado(registro.pinHash)
      ? verificarPinOperador(pinLegado, registro.pinHash)
      : registro.pinHash === pinLegado

    if (aindaUsaPinLegado) {
      repositorio.atualizarPin(operador.id, hashPinOperador(operador.pin))
    }
  }
}

export function existemOperadores(): boolean {
  if (process.env.NODE_ENV === 'test') {
    return true
  }

  return criarOperadorUsuarioRepository(obterConexaoBancoLocal()).contarAtivos() > 0
}

export function listarOperadores(): OperadorResumo[] {
  if (process.env.NODE_ENV === 'test') {
    return [OPERADOR_TESTE]
  }

  return criarOperadorUsuarioRepository(obterConexaoBancoLocal()).listarAtivos()
}

export function listarOperadoresEntrada(): OperadorEntradaResumo[] {
  return listarOperadores().map(({ operadorId, operadorNome }) => ({
    operadorId,
    operadorNome,
  }))
}

export function obterOperadorConfigurado(): OperadorConfig | null {
  if (process.env.NODE_ENV === 'test') {
    return OPERADOR_TESTE
  }

  return null
}

export function criarSalvarOperador(repositorio?: OperadorUsuarioRepository) {
  return function salvarOperador(entrada: SalvarOperadorEntrada): OperadorConfig {
    assertPermissaoOperador(PERMISSAO_PDV.CONFIGURACOES)

    const repo = repositorio ?? criarOperadorUsuarioRepository(obterConexaoBancoLocal())
    const operadorId = entrada.operadorId.trim()
    const existente = repo.buscarPorId(operadorId)

    if (!existente?.ativo) {
      throw new ErroConfiguracoes(
        CODIGOS_ERRO_CONFIGURACOES.OPERADOR_NAO_CONFIGURADO,
        'Operador nao encontrado.',
      )
    }

    const atualizado = repo.atualizarPin(operadorId, hashPinOperador(entrada.pin.trim()))
    const config = paraOperadorConfig(atualizado)
    definirSessaoOperador(config)
    return config
  }
}

export function criarAutenticarOperador(repositorio?: OperadorUsuarioRepository) {
  return function autenticarOperador(entrada: AutenticarOperadorEntrada): OperadorConfig {
    if (process.env.NODE_ENV === 'test') {
      definirSessaoOperador(OPERADOR_TESTE)
      return OPERADOR_TESTE
    }

    const repo = repositorio ?? criarOperadorUsuarioRepository(obterConexaoBancoLocal())

    if (repo.contarAtivos() === 0) {
      throw new ErroConfiguracoes(
        CODIGOS_ERRO_CONFIGURACOES.OPERADOR_NAO_CONFIGURADO,
        'Nenhum operador configurado.',
      )
    }

    const operadorId = entrada.operadorId.trim()
    const registro = repo.buscarPorId(operadorId)

    if (!registro?.ativo) {
      throw new ErroConfiguracoes(
        CODIGOS_ERRO_CONFIGURACOES.OPERADOR_NAO_CONFIGURADO,
        'Operador nao encontrado.',
      )
    }

    const pin = entrada.pin.trim()
    const pinValido = pinEstaHasheado(registro.pinHash)
      ? verificarPinOperador(pin, registro.pinHash)
      : pin === registro.pinHash

    if (!pinValido) {
      throw new ErroConfiguracoes(
        CODIGOS_ERRO_CONFIGURACOES.PIN_INVALIDO,
        'PIN invalido.',
      )
    }

    if (!pinEstaHasheado(registro.pinHash)) {
      repo.atualizarPin(registro.operadorId, hashPinOperador(pin))
    }

    const config = paraOperadorConfig(registro)
    definirSessaoOperador(config)
    return config
  }
}

export const salvarOperador = criarSalvarOperador()
export const autenticarOperador = criarAutenticarOperador()
