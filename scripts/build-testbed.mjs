import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const child = spawn(process.execPath, [path.join(root, 'bin', 'cli.js'), 'build'], {
  cwd: path.join(root, 'testbed'),
  stdio: 'inherit',
  env: process.env,
})
child.on('close', code => process.exit(code ?? 0))
