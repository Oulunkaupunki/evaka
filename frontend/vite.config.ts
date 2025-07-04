// SPDX-FileCopyrightText: 2017-2025 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

/* eslint-disable no-console */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

import { sentryVitePlugin } from '@sentry/vite-plugin'
import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { build, defineConfig } from 'vite'
import type { Plugin, UserConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = 'dist/bundle'

function resolveCustomizationsPath() {
  const customizations = process.env.EVAKA_CUSTOMIZATIONS || 'espoo'
  const customizationsPath = `src/lib-customizations/${customizations}`
  console.log(`Using customizations from ${customizationsPath}`)
  fs.copyFileSync(
    `${customizationsPath}/assets/favicon.ico`,
    'public/favicon.ico'
  )
  return customizationsPath
}

async function resolveIcons() {
  switch (process.env.ICONS) {
    case 'pro':
      console.info('Using pro icons (forced)')
      return 'pro'
    case 'free':
      console.info('Using free icons (forced)')
      return 'free'
    case undefined:
      break
    default:
      throw new Error(`Invalid environment variable ICONS=${process.env.ICONS}`)
  }
  try {
    /* eslint-disable @typescript-eslint/ban-ts-comment */
    // @ts-ignore
    await import('@fortawesome/pro-light-svg-icons')
    // @ts-ignore
    await import('@fortawesome/pro-regular-svg-icons')
    // @ts-ignore
    await import('@fortawesome/pro-solid-svg-icons')
    /* eslint-enable @typescript-eslint/ban-ts-comment */
    console.info('Using pro icons (auto-detected)')
    return 'pro'
  } catch (e) {
    console.info('Using free icons (fallback)')
    return 'free'
  }
}

function serveIndexHtml(): Plugin {
  return {
    name: 'serve-index-html',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Skip api, source code and vite internal paths
        if (
          req.originalUrl?.startsWith('/api/') ||
          req.originalUrl?.startsWith('/src/') ||
          req.originalUrl?.startsWith('/node_modules/') ||
          req.originalUrl?.startsWith('/@')
        ) {
          return next()
        }

        // Skip files in public folder
        try {
          const stat = fs.statSync(
            path.resolve(__dirname, `public${req.originalUrl}`)
          )
          if (stat.isFile()) {
            return next()
          }
        } catch (_e) {
          // Ignore errors
        }

        // Add trailing slash
        if (
          req.originalUrl === '/employee' ||
          req.originalUrl === '/employee/mobile'
        ) {
          res.statusCode = 301
          res.setHeader('Location', req.originalUrl + '/')
          return res.end()
        }

        // Serve the correct index.html file
        if (req.originalUrl?.startsWith('/employee/mobile/')) {
          req.url = '/src/employee-mobile-frontend/index.html'
        } else if (req.originalUrl?.startsWith('/employee/')) {
          req.url = '/src/employee-frontend/index.html'
        } else {
          req.url = '/src/citizen-frontend/index.html'
        }
        next()
      })
    }
  }
}

function serviceWorker(): Plugin {
  const urlPath = '/employee/mobile/service-worker.js'
  const sourcePath = 'src/employee-mobile-frontend/service-worker.js'
  return {
    name: 'build-service-worker-prod',
    configureServer(server) {
      server.middlewares.use(urlPath, async (_req, res, next) => {
        try {
          const code = await server.transformRequest(sourcePath)
          res.setHeader('Content-Type', 'text/javascript')
          res.end(code?.code ?? '')
        } catch (err) {
          next(err)
        }
      })
    },
    async generateBundle() {
      const dirName = path.dirname(urlPath)
      const fileName = path.basename(urlPath)
      await build({
        configFile: false,
        build: {
          outDir: `${outDir}/${dirName}`,
          emptyOutDir: false,
          lib: {
            entry: path.resolve(__dirname, sourcePath),
            formats: ['es'],
            fileName: () => fileName
          },
          rollupOptions: {
            output: {
              entryFileNames: fileName
            }
          },
          minify: true
        }
      })
    }
  }
}

export default defineConfig(async (): Promise<UserConfig> => {
  const customizationsPath = resolveCustomizationsPath()
  const icons = await resolveIcons()
  const { browserslist } = JSON.parse(
    fs.readFileSync('package.json', 'utf-8')
  ) as {
    browserslist: string[]
  }

  return {
    plugins: [
      react(),
      legacy({
        // Vite considers browsers without ES module support to be legacy. We don't support them either.
        renderLegacyChunks: false,
        renderModernChunks: true,

        // Include polyfills for our list of supported browsers. Vite runs @babel/preset-env on transpiled chunks with
        // `useBuiltIns: 'usage'` to find out which polyfills to add. For more information, see:
        // https://github.com/vitejs/vite/tree/main/packages/plugin-legacy
        modernPolyfills: true,
        modernTargets: browserslist
      }),
      serviceWorker(),
      sentryVitePlugin({
        disable: process.env.SENTRY_PUBLISH_ENABLED !== 'true',
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT || 'evaka',
        authToken: process.env.SENTRY_AUTH_TOKEN,
        release: {
          name: process.env.APP_COMMIT,
          setCommits: {
            repo: 'espoon-voltti/evaka',
            commit: process.env.APP_COMMIT || 'unknown',
            auto: false
          }
        }
      }),
      serveIndexHtml()
    ],
    build: {
      outDir,
      assetsInlineLimit: (filePath, content) => {
        // Avoid inlining service-worker.js
        if (filePath.endsWith('/service-worker.js')) return false

        // Otherwise, inline files up to 4 KB (this is the default)
        return content.length <= 4096
      },
      sourcemap: true, // required by sentry
      rollupOptions: {
        input: {
          citizen: path.resolve(__dirname, 'src/citizen-frontend/index.html'),
          employee: path.resolve(__dirname, 'src/employee-frontend/index.html'),
          employeeMobile: path.resolve(
            __dirname,
            'src/employee-mobile-frontend/index.html'
          )
        }
      }
    },
    server: {
      port: 9099,
      warmup: {
        clientFiles: ['src/**/index.html']
      },
      proxy: {
        '/api': 'http://localhost:3000'
      }
    },
    resolve: {
      alias: {
        'lib-common': path.resolve(__dirname, 'src/lib-common'),
        'lib-components': path.resolve(__dirname, 'src/lib-components'),
        'lib-customizations': path.resolve(__dirname, 'src/lib-customizations'),
        'lib-icons': path.resolve(__dirname, 'src/lib-icons'),
        '@evaka/customizations': path.resolve(__dirname, customizationsPath),
        Icons: path.resolve(__dirname, `src/lib-icons/${icons}-icons.ts`)
      }
    },
    define: {
      __APP_COMMIT__: JSON.stringify(process.env.APP_COMMIT || 'UNDEFINED')
    }
  }
})
