import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDirectory = join(projectRoot, 'dist')
const serviceWorkerPath = join(distDirectory, 'sw.js')

const listFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? listFiles(path) : path
  }))
  return files.flat()
}

const toAssetPath = (path) => relative(distDirectory, path).split(sep).join('/')
const isUnusedAudioSource = (path) => (
  path.startsWith('audio/characters/letras_y_numeros/')
  || path.split('/').at(-1)?.startsWith('All ')
)

const allFiles = await listFiles(distDirectory)
const precacheFiles = allFiles
  .map(toAssetPath)
  .filter((path) => path !== 'sw.js' && path !== 'favicon_backup.svg' && !isUnusedAudioSource(path))
  .sort()

const hash = createHash('sha256')
for (const path of precacheFiles) {
  hash.update(path)
  hash.update(await readFile(join(distDirectory, path)))
}

const buildId = hash.digest('hex').slice(0, 16)
const precacheUrls = precacheFiles.map((path) => encodeURI(`/${path}`))
const template = await readFile(serviceWorkerPath, 'utf8')
const output = template
  .replace('__TECLADITO_BUILD_ID__', buildId)
  .replace('__TECLADITO_PRECACHE_MANIFEST__', JSON.stringify(precacheUrls, null, 2))

if (output === template || output.includes('__TECLADITO_')) {
  throw new Error('No se pudieron reemplazar los marcadores del Service Worker')
}

await writeFile(serviceWorkerPath, output)
console.log(`Service Worker: ${precacheUrls.length} recursos incluidos en ${buildId}`)
