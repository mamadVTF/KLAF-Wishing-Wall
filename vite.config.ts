import { promises as fs } from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

function configSavePlugin(): Plugin {
  return {
    name: 'wishing-wall-config-save',
    configureServer(server) {
      server.middlewares.use('/config.json', (request, response, next) => {
        if (request.method !== 'PUT') {
          next()
          return
        }

        const chunks: Buffer[] = []
        request.on('data', (chunk: Buffer) => chunks.push(chunk))
        request.on('end', async () => {
          try {
            const config = JSON.parse(Buffer.concat(chunks).toString('utf8'))
            if (
              typeof config !== 'object' ||
              config === null ||
              typeof config.qrUrl !== 'string'
            ) {
              throw new Error('Invalid config')
            }

            const configPath = path.resolve(process.cwd(), 'public/config.json')
            await fs.writeFile(
              configPath,
              `${JSON.stringify(config, null, 2)}\n`,
              'utf8',
            )
            response.statusCode = 204
            response.end()
          } catch (error) {
            response.statusCode = 400
            response.setHeader('Content-Type', 'application/json')
            response.end(
              JSON.stringify({
                error: error instanceof Error ? error.message : 'Invalid config',
              }),
            )
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), configSavePlugin()],
})
