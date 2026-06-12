#!/usr/bin/env node
import { fileURLToPath, pathToFileURL } from 'url'
import path from 'path'
import { cpSync, existsSync } from 'fs'
import { spawnSync } from 'child_process'

const PKG_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const PROJECT_DIR = process.cwd()
const command = process.argv[2]

if (!command || !['build', 'dev', 'preview'].includes(command)) {
  console.error('Usage: e-module-builder <build|dev|preview>')
  process.exit(1)
}

function copyAssets() {
  for (const dir of ['js', 'css', 'partials']) {
    const src = path.join(PKG_DIR, 'src', dir)
    if (existsSync(src)) {
      cpSync(src, path.join(PROJECT_DIR, 'src', dir), { recursive: true })
    }
  }
}

function runContentPipeline() {
  const result = spawnSync(process.execPath, [path.join(PKG_DIR, 'build.mjs')], {
    cwd: PROJECT_DIR,
    stdio: 'inherit',
    env: {
      ...process.env,
      E_MODULE_PROJECT_DIR: PROJECT_DIR,
      E_MODULE_PKG_DIR: PKG_DIR,
    },
  })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

async function main() {
  if (command === 'preview') {
    const { preview } = await import('vite')
    const server = await preview({
      root: PROJECT_DIR,
      build: { outDir: path.join(PROJECT_DIR, 'dist') },
    })
    server.printUrls()
    return
  }

  copyAssets()
  runContentPipeline()

  const { createConfig } = await import(pathToFileURL(path.join(PKG_DIR, 'vite.config.js')).href)
  const cfg = createConfig({ projectDir: PROJECT_DIR, pkgDir: PKG_DIR })

  if (command === 'build') {
    const { build } = await import('vite')
    await build(cfg)
  } else {
    const { createServer } = await import('vite')
    const server = await createServer(cfg)
    await server.listen()
    server.printUrls()
  }
}

main().catch(e => { console.error(e); process.exit(1) })
