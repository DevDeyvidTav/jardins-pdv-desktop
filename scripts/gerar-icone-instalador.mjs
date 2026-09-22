import { existsSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { Jimp } from 'jimp'
import toIco from 'to-ico'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const origem = join(raiz, 'resources', 'logo-jardins.jpg')
const destino = join(raiz, 'resources', 'icon.ico')

if (!existsSync(origem)) {
  console.error(`Logo nao encontrado: ${origem}`)
  process.exit(1)
}

const tamanhos = [256, 128, 64, 48, 32, 16]
const imagem = await Jimp.read(origem)
const lado = Math.max(imagem.width, imagem.height)
const quadrada = new Jimp({ width: lado, height: lado, color: 0x000000ff })
quadrada.composite(
  imagem,
  Math.floor((lado - imagem.width) / 2),
  Math.floor((lado - imagem.height) / 2),
)

const pngs = await Promise.all(
  tamanhos.map((tamanho) =>
    quadrada.clone().resize({ w: tamanho, h: tamanho }).getBuffer('image/png'),
  ),
)

writeFileSync(destino, await toIco(pngs))
console.log(`Icone gerado: ${destino}`)
