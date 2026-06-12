import fs from 'fs'
import { resolve } from 'path'

/**
 * Vervangt <!-- include:naam --> door src/partials/naam.html (dev + build).
 */
export function htmlIncludes({ partialsDir }) {
  return {
    name: 'html-includes',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace(/<!-- include:(\w+) -->/g, (_, name) => {
          const file = resolve(partialsDir, `${name}.html`)
          if (!fs.existsSync(file)) {
            throw new Error(`HTML partial ontbreekt: ${file}`)
          }
          return fs.readFileSync(file, 'utf8').trim()
        })
      },
    },
  }
}
