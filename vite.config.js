import { fileURLToPath } from 'url'
import path from 'path'
import { readdirSync, existsSync } from 'fs'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { htmlIncludes } from './vite-plugin-html-includes.js'

export function createConfig({ projectDir, pkgDir }) {
  return defineConfig({
    root: projectDir,
    base: './',
    publicDir: existsSync(path.join(projectDir, 'public'))
      ? path.join(projectDir, 'public')
      : path.join(pkgDir, 'public'),
    plugins: [
      htmlIncludes({ partialsDir: path.join(pkgDir, 'src', 'partials') }),
      tailwindcss(),
    ],
    build: {
      outDir: path.join(projectDir, 'dist'),
      emptyOutDir: true,
      rollupOptions: {
        input: buildInputs(projectDir),
      },
    },
  })
}

function buildInputs(projectDir) {
  const entries = { index: path.join(projectDir, 'index.html') }
  const pagesDir = path.join(projectDir, 'pages')
  if (existsSync(pagesDir)) {
    readdirSync(pagesDir)
      .filter(f => f.endsWith('.html'))
      .forEach(f => {
        entries[f.replace('.html', '')] = path.join(pagesDir, f)
      })
  }
  return entries
}

// Default export so the config can be used directly if needed
const _pkgDir = path.dirname(fileURLToPath(import.meta.url))
export default createConfig({ projectDir: process.cwd(), pkgDir: _pkgDir })
