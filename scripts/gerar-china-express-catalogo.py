"""Gera catálogo fiscal e dados de seed do cardápio China Express (PDF)."""
from __future__ import annotations

import re
import unicodedata
from collections import OrderedDict
from pathlib import Path

from pypdf import PdfReader

PDF_PATH = Path.home() / 'Downloads' / 'chinaexpress.pdf'
BASE = Path(__file__).resolve().parents[1]
OUT_FISCAL = BASE / 'src' / 'shared' / 'data' / 'china-express-catalogo-fiscal.ts'
OUT_SEED = BASE / 'src' / 'main' / 'database' / 'seeds' / 'dados-china-express.ts'
OUT_PIZZAS = BASE / 'src' / 'main' / 'database' / 'seeds' / 'dados-china-express-pizzas.ts'

CATEGORIAS_PIZZA_PDF = {
    'PIZZAS TRADICIONAIS',
    'PIZZAS ESPECIAIS',
    'PIZZAS DOCE',
}

MAPA_CATEGORIA_PIZZA = {
    'PIZZAS TRADICIONAIS': 'Tradicional',
    'PIZZAS ESPECIAIS': 'Especial',
    'PIZZAS DOCE': 'Doce',
}


def normalizar_nome(valor: str) -> str:
    texto = unicodedata.normalize('NFD', valor)
    texto = ''.join(c for c in texto if unicodedata.category(c) != 'Mn')
    return re.sub(r'\s+', ' ', texto.lower().strip())


def titulo_categoria(valor: str) -> str:
    palavras = valor.strip().split()
    return ' '.join(palavra.capitalize() for palavra in palavras)


def titulo_sabor(valor: str) -> str:
    texto = valor.strip().lower()
    substituicoes = {
        ' c ': ' c/ ',
        ' c/ ': ' c/ ',
        ' q/ ': ' q/ ',
        ' s/ ': ' s/ ',
        ' w/ ': ' w/ ',
        ' e c ': ' e c/ ',
    }
    for origem, destino in substituicoes.items():
        texto = texto.replace(origem, destino)
    palavras = []
    for palavra in texto.split():
        if palavra in {'c/', 'q/', 's/', 'w/'}:
            palavras.append(palavra)
        else:
            palavras.append(palavra.capitalize())
    return ' '.join(palavras)


def deve_permanecer_como_produto(categoria_pdf: str, nome: str) -> bool:
    nome_norm = nome.strip().upper()
    if nome_norm.startswith('BORDA'):
        return True
    if nome_norm == 'EMBALAGEM PIZZA':
        return True
    if nome_norm == 'PIZZA DELIVERY':
        return True
    if categoria_pdf.upper() in CATEGORIAS_PIZZA_PDF and parse_pizza(nome, categoria_pdf):
        return False
    return True


def parse_pizza(nome: str, categoria_pdf: str) -> tuple[str, str, str] | None:
    nome_norm = nome.strip().upper()

    match = re.match(r'^PIZZA\s+(KIT KAT|OREO)\s+(MINI|P|M|G)$', nome_norm)
    if match:
        return MAPA_CATEGORIA_PIZZA[categoria_pdf.upper()], match.group(2), match.group(1)

    match = re.match(r'^PIZZA\s+ESP\s+(.+?)\s+(MINI|P|M|G)$', nome_norm)
    if match:
        return 'Especial', match.group(2), match.group(1)

    match = re.match(r'^PIZZA\s+(?:ESP\s+)?(MINI|P|M|G)\s+(.+)$', nome_norm)
    if match:
        categoria = MAPA_CATEGORIA_PIZZA.get(categoria_pdf.upper())
        if not categoria:
            return None
        return categoria, match.group(1), match.group(2)

    return None


def agregar_pizzas(itens: list[dict]) -> dict[str, list[dict]]:
    sabores: dict[tuple[str, str], dict] = OrderedDict()

    for item in itens:
        parsed = parse_pizza(item['nome'], item['categoria'])
        if not parsed:
            continue

        categoria, tamanho, sabor_bruto = parsed
        chave = (categoria, normalizar_nome(sabor_bruto))
        if chave not in sabores:
            sabores[chave] = {
                'categoria': categoria,
                'nome': titulo_sabor(sabor_bruto),
                'precos': {},
            }

        chave_tamanho = 'mini' if tamanho == 'MINI' else tamanho.lower()
        sabores[chave]['precos'][chave_tamanho] = item['precoCentavos']

    por_categoria: dict[str, list[dict]] = OrderedDict()
    ordem_categorias = ['Tradicional', 'Especial', 'Doce']
    for categoria in ordem_categorias:
        por_categoria[categoria] = []

    for indice, ((categoria, _sabor), dados) in enumerate(sabores.items(), start=1):
        precos = dados['precos']
        if not precos:
            raise SystemExit(f"Sabor sem preços ({dados['nome']} / {categoria})")
        por_categoria[categoria].append(
            {
                'nome': dados['nome'],
                'ordem': len(por_categoria[categoria]) + 1,
                'precos': precos,
            }
        )

    return por_categoria


def is_linha_ignorada(line: str) -> bool:
    if not line:
        return True
    if line.startswith('Produto') or line.startswith('ICMS') or line.startswith('CEST'):
        return True
    if line.startswith('CHINA') or line.startswith('CARD'):
        return True
    if re.match(r'Qua,', line):
        return True
    if re.match(r'^\(\d+\)$', line):
        return True
    return False


def is_cabecalho_categoria(line: str) -> bool:
    if ' - ' in line or ' UN ' in line:
        return False
    if re.match(r'^\d', line):
        return False
    return bool(re.match(r'^[A-ZÁÉÍÓÚÃÕÇ0-9 /]+$', line))


def parse_preco_centavos(parte_esquerda: str) -> int:
    partes = parte_esquerda.strip().split(',')
    if len(partes) < 2:
        return 0
    venda = partes[1]
    if venda.startswith('50') and len(venda) > 2:
        reais = int(venda[2:])
    else:
        reais = int(venda)
    return reais * 100


def parse_produto(line: str) -> dict | None:
    if ' - ' not in line or ' UN ' not in line:
        return None

    parte_esquerda, right = line.split(' - ', 1)
    com_csosn = re.match(r'^(?P<nome>.+?)\s+(?P<csosn>102|202)\s+UN\s+(?P<tail>.+)$', right)
    if com_csosn:
        nome = com_csosn.group('nome').strip()
        csosn = com_csosn.group('csosn')
        tail = com_csosn.group('tail')
    else:
        sem_csosn = re.match(r'^(?P<nome>.+)\s+UN\s+(?P<tail>.+)$', right)
        if not sem_csosn:
            return None
        nome = sem_csosn.group('nome').strip()
        csosn = '102'
        tail = sem_csosn.group('tail')

    tail_patterns = [
        re.compile(
            r'^T\s+0,00\s+0,00\s+(?P<cfop>\d{4})\s+(?P<ncm>\d+|0)(?:\s+(?P<cest>\d{7}))?\s*$'
        ),
        re.compile(
            r'^T\s+(?P<pis_cst>\d{2})\s+0,00\s+(?P<cofins_cst>\d{2})\s+0,00\s+(?P<cfop>\d{4})\s+(?P<ncm>\d+|0)(?:\s+(?P<cest>\d{7}))?\s*$'
        ),
        re.compile(
            r'^F\s+(?P<pis_cst>\d{2})\s+0,00\s+(?P<cofins_cst>\d{2})\s+0,00\s+(?P<cfop>\d{4})\s+(?P<ncm>\d+|0)(?:\s+(?P<cest>\d{7}))?\s*$'
        ),
        re.compile(
            r'^F\s+0,00\s+0,00\s+(?P<cfop>\d{4})\s+(?P<ncm>\d+|0)(?:\s+(?P<cest>\d{7}))?\s*$'
        ),
    ]

    for pattern in tail_patterns:
        match = pattern.match(tail)
        if not match:
            continue
        data = match.groupdict()
        ncm = data['ncm'] if data['ncm'] != '0' else None
        return {
            'nome': nome,
            'precoCentavos': parse_preco_centavos(parte_esquerda),
            'ncm': ncm,
            'cest': data.get('cest'),
            'cfop': data['cfop'],
            'csosn': csosn,
            'pis_cst': data.get('pis_cst') or '07',
            'cofins_cst': data.get('cofins_cst') or '07',
        }

    return None


def extrair_itens(text: str) -> list[dict]:
    categoria_atual = 'Outros'
    itens: list[dict] = []
    falhas: list[str] = []

    for raw in text.splitlines():
        line = raw.strip()
        if is_linha_ignorada(line):
            continue
        if is_cabecalho_categoria(line):
            categoria_atual = line.strip()
            continue
        if ' - ' not in line or ' UN ' not in line:
            continue

        parsed = parse_produto(line)
        if not parsed:
            falhas.append(line)
            continue

        parsed['categoria'] = categoria_atual
        itens.append(parsed)

    if falhas:
        raise SystemExit(f'Falha ao parsear {len(falhas)} linhas:\n' + '\n'.join(falhas[:5]))

    vistos: OrderedDict[str, dict] = OrderedDict()
    for item in itens:
        chave = normalizar_nome(item['nome'])
        if chave not in vistos:
            vistos[chave] = item

    return list(vistos.values())


def ts_string(valor: str) -> str:
    return valor.replace('\\', '\\\\').replace("'", "\\'")


def gerar_fiscal_ts(itens: list[dict]) -> str:
    linhas = [
        '/**',
        ' * Catálogo fiscal extraído do cardápio China Express (chinaexpress.pdf).',
        ' * Fonte: relatório JasperReports — NCM, CFOP, CEST, CSOSN, PIS/COFINS CST.',
        ' * Validar com o contador antes de produção.',
        ' * Gerado por scripts/gerar-china-express-catalogo.py — não editar manualmente.',
        ' */',
        '',
        'export interface DadosFiscaisChinaExpress {',
        '  nomeOriginal: string',
        '  ncm: string',
        '  cest?: string | null',
        '  fiscalCfop: string',
        '  fiscalIcmsCsosn: string',
        '  fiscalPisCst: string',
        '  fiscalCofinsCst: string',
        '  fonte: string',
        '}',
        '',
        'function normalizarNomeChinaExpress(valor: string): string {',
        '  return valor',
        "    .normalize('NFD')",
        "    .replace(/\\p{Diacritic}/gu, '')",
        '    .toLowerCase()',
        '    .trim()',
        "    .replace(/\\s+/g, ' ')",
        '}',
        '',
        'const ITENS: DadosFiscaisChinaExpress[] = [',
    ]

    for item in sorted(itens, key=lambda x: normalizar_nome(x['nome'])):
        if not item.get('ncm'):
            continue
        cest = f"'{item['cest']}'" if item.get('cest') else 'null'
        nome = ts_string(item['nome'])
        linhas.extend(
            [
                '  {',
                f"    nomeOriginal: '{nome}',",
                f"    ncm: '{item['ncm']}',",
                f'    cest: {cest},',
                f"    fiscalCfop: '{item['cfop']}',",
                f"    fiscalIcmsCsosn: '{item['csosn']}',",
                f"    fiscalPisCst: '{item['pis_cst']}',",
                f"    fiscalCofinsCst: '{item['cofins_cst']}',",
                "    fonte: 'China Express — cardápio fiscal (PDF)',",
                '  },',
            ]
        )

    linhas.extend(
        [
            ']',
            '',
            'const POR_NOME = new Map<string, DadosFiscaisChinaExpress>(',
            '  ITENS.map((item) => [normalizarNomeChinaExpress(item.nomeOriginal), item]),',
            ')',
            '',
            'export function resolverFiscalChinaExpress(nome: string): DadosFiscaisChinaExpress | null {',
            '  return POR_NOME.get(normalizarNomeChinaExpress(nome)) ?? null',
            '}',
            '',
            f'export const TOTAL_ITENS_CHINA_EXPRESS = {len([i for i in itens if i.get("ncm")])}',
            '',
        ]
    )

    return '\n'.join(linhas)


def gerar_seed_ts(itens: list[dict]) -> str:
    categorias: OrderedDict[str, list[dict]] = OrderedDict()
    for item in itens:
        if not item.get('ncm'):
            continue
        if not deve_permanecer_como_produto(item['categoria'], item['nome']):
            continue
        nome_cat = titulo_categoria(item['categoria'])
        categorias.setdefault(nome_cat, []).append(item)

    linhas = [
        '/**',
        ' * Cardápio China Express — categorias, produtos, preços e dados fiscais.',
        ' * Gerado por scripts/gerar-china-express-catalogo.py — não editar manualmente.',
        ' */',
        '',
        'export interface ProdutoChinaExpressSeed {',
        '  nome: string',
        '  precoCentavos: number',
        '  fiscalNcm: string',
        '  fiscalCest: string | null',
        '  fiscalCfop: string',
        '  fiscalIcmsCsosn: string',
        '  fiscalPisCst: string',
        '  fiscalCofinsCst: string',
        '}',
        '',
        'export interface CategoriaChinaExpressSeed {',
        '  nome: string',
        '  produtos: ProdutoChinaExpressSeed[]',
        '}',
        '',
        'export const CHAVE_METADATA_SEED_CHINA_EXPRESS = ' "'seed_china_express_v1'" '',
        '',
        'export const CATEGORIAS_CHINA_EXPRESS: CategoriaChinaExpressSeed[] = [',
    ]

    for nome_cat, produtos in categorias.items():
        linhas.append('  {')
        linhas.append(f"    nome: '{ts_string(nome_cat)}',")
        linhas.append('    produtos: [')
        for produto in produtos:
            cest = 'null' if not produto.get('cest') else f"'{produto['cest']}'"
            nome = ts_string(produto['nome'])
            linhas.extend(
                [
                    '      {',
                    f"        nome: '{nome}',",
                    f"        precoCentavos: {produto['precoCentavos']},",
                    f"        fiscalNcm: '{produto['ncm']}',",
                    f'        fiscalCest: {cest},',
                    f"        fiscalCfop: '{produto['cfop']}',",
                    f"        fiscalIcmsCsosn: '{produto['csosn']}',",
                    f"        fiscalPisCst: '{produto['pis_cst']}',",
                    f"        fiscalCofinsCst: '{produto['cofins_cst']}',",
                    '      },',
                ]
            )
        linhas.append('    ],')
        linhas.append('  },')

    total_produtos = sum(len(p) for p in categorias.values())
    linhas.extend(
        [
            ']',
            '',
            f'export const TOTAL_PRODUTOS_CHINA_EXPRESS = {total_produtos}',
            f'export const TOTAL_CATEGORIAS_CHINA_EXPRESS = {len(categorias)}',
            '',
        ]
    )

    return '\n'.join(linhas)


def formatar_precos_ts(precos: dict) -> str:
    ordem = ['mini', 'p', 'm', 'g']
    partes = [f"{tamanho}: {precos[tamanho]}" for tamanho in ordem if tamanho in precos]
    return '{ ' + ', '.join(partes) + ' }'


def gerar_pizzas_ts(por_categoria: dict[str, list[dict]]) -> str:
    total_sabores = sum(len(sabores) for sabores in por_categoria.values())
    linhas = [
        '/**',
        ' * Pizzas China Express — sabores e preços por tamanho.',
        ' * Gerado por scripts/gerar-china-express-catalogo.py — não editar manualmente.',
        ' */',
        "import { REGRA_PRECIFICACAO_PIZZA } from '@shared/types/pizza'",
        '',
        'export interface PrecosPizzaChinaExpressSeed {',
        '  mini?: number',
        '  p?: number',
        '  m?: number',
        '  g?: number',
        '}',
        '',
        'export interface SaborPizzaChinaExpressSeed {',
        '  nome: string',
        '  ordem: number',
        '  precos: PrecosPizzaChinaExpressSeed',
        '}',
        '',
        'export interface CategoriaPizzaChinaExpressSeed {',
        '  nome: string',
        '  descricao?: string',
        '  regraPrecificacao: (typeof REGRA_PRECIFICACAO_PIZZA)[keyof typeof REGRA_PRECIFICACAO_PIZZA]',
        '  ordem: number',
        '  sabores: SaborPizzaChinaExpressSeed[]',
        '}',
        '',
        'export const CATEGORIAS_PIZZA_CHINA_EXPRESS: CategoriaPizzaChinaExpressSeed[] = [',
    ]

    descricoes = {
        'Tradicional': 'Sabores clássicos do cardápio China Express',
        'Especial': 'Sabores especiais do cardápio China Express',
        'Doce': 'Pizzas doces do cardápio China Express',
    }

    for indice, (categoria, sabores) in enumerate(por_categoria.items(), start=1):
        if not sabores:
            continue
        linhas.extend(
            [
                '  {',
                f"    nome: '{ts_string(categoria)}',",
                f"    descricao: '{ts_string(descricoes[categoria])}',",
                '    regraPrecificacao: REGRA_PRECIFICACAO_PIZZA.MAIOR_SABOR,',
                f'    ordem: {indice},',
                '    sabores: [',
            ]
        )
        for sabor in sabores:
            linhas.extend(
                [
                    '      {',
                    f"        nome: '{ts_string(sabor['nome'])}',",
                    f"        ordem: {sabor['ordem']},",
                    f"        precos: {formatar_precos_ts(sabor['precos'])},",
                    '      },',
                ]
            )
        linhas.extend(['    ],', '  },'])

    linhas.extend(
        [
            ']',
            '',
            f'export const TOTAL_CATEGORIAS_PIZZA_CHINA_EXPRESS = {len([c for c in por_categoria.values() if c])}',
            f'export const TOTAL_SABORES_PIZZA_CHINA_EXPRESS = {total_sabores}',
            '',
        ]
    )

    return '\n'.join(linhas)


def main() -> None:
    reader = PdfReader(str(PDF_PATH))
    text = '\n'.join((page.extract_text() or '') for page in reader.pages)
    itens = extrair_itens(text)

    por_categoria_pizza = agregar_pizzas(itens)

    OUT_FISCAL.write_text(gerar_fiscal_ts(itens), encoding='utf-8')
    OUT_SEED.write_text(gerar_seed_ts(itens), encoding='utf-8')
    OUT_PIZZAS.write_text(gerar_pizzas_ts(por_categoria_pizza), encoding='utf-8')

    total_produtos = sum(
        1
        for item in itens
        if item.get('ncm') and deve_permanecer_como_produto(item['categoria'], item['nome'])
    )
    total_sabores = sum(len(sabores) for sabores in por_categoria_pizza.values())

    print(f'Gerado {OUT_FISCAL.name} — {len([i for i in itens if i.get("ncm")])} itens fiscais')
    print(f'Gerado {OUT_SEED.name} — {total_produtos} produtos')
    print(f'Gerado {OUT_PIZZAS.name} — {total_sabores} sabores de pizza')


if __name__ == '__main__':
    main()
