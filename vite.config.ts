import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative, resolve, sep } from 'node:path'
import { defineConfig, type Plugin, type ResolvedConfig } from 'vite'

const BUILD_ID_MARKER = '__TECLADITO_BUILD_ID__'
const PRECACHE_MARKER = '/* __TECLADITO_PRECACHE_MANIFEST__ */ []'

const listFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? listFiles(path) : [path]
  }))
  return files.flat()
}

const generateServiceWorker = (): Plugin => {
  let config: ResolvedConfig

  return {
    name: 'tecladito-service-worker-manifest',
    apply: 'build',
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    async closeBundle() {
      const outputDirectory = resolve(config.root, config.build.outDir)
      const publicDirectory = typeof config.publicDir === 'string'
        ? config.publicDir
        : resolve(config.root, 'public')
      const template = await readFile(resolve(publicDirectory, 'sw.js'), 'utf8')
      const outputFiles = (await listFiles(outputDirectory))
        .filter((path) => !path.endsWith(`${sep}sw.js`) && !path.endsWith('.map'))
        .sort()

      const precacheUrls = outputFiles.map((path) => `/${relative(outputDirectory, path).split(sep).join('/')}`)
      const buildHash = createHash('sha256').update(template)
      for (const [index, path] of outputFiles.entries()) {
        buildHash.update(precacheUrls[index])
        buildHash.update(await readFile(path))
      }
      const buildId = buildHash.digest('hex').slice(0, 16)

      const serviceWorker = template
        .replace(BUILD_ID_MARKER, buildId)
        .replace(PRECACHE_MARKER, JSON.stringify(precacheUrls, null, 2))

      if (serviceWorker.includes(BUILD_ID_MARKER) || serviceWorker.includes(PRECACHE_MARKER)) {
        throw new Error('No se pudo generar el manifiesto de precaché del Service Worker.')
      }

      await writeFile(resolve(outputDirectory, 'sw.js'), serviceWorker)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), generateServiceWorker()],
})
