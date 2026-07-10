/**
 * Single source of truth for interactive x-component metadata.
 * Used by build.mjs, build-pdf.mjs, and runtime hydration — every module gets the same labels.
 */
export const COMPONENTS = [
  {
    tag: 'x-keuzevraag',
    slug: 'keuzevraag',
    label: 'Meerkeuzevraag',
  },
  {
    tag: 'x-koppelvraag',
    slug: 'koppelvraag',
    label: 'Koppelvraag',
  },
  {
    tag: 'x-vind-de-fout',
    slug: 'vind-de-fout',
    label: 'Vind de fout',
  },
  {
    tag: 'x-woordzoeker',
    slug: 'woordzoeker',
    label: 'Woordzoeker',
  },
  {
    tag: 'x-invul',
    slug: 'invul',
    label: 'Invuloefening',
  },
]

export const INTERACTIVE_TAGS = new Set(COMPONENTS.map((c) => c.tag))

export function getComponentMeta(tag) {
  return COMPONENTS.find((c) => c.tag === tag) ?? null
}
