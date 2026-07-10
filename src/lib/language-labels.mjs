// Human-readable labels for language identifiers that don't just look good
// upper-cased (e.g. "php" -> "PHP", "js" -> "JavaScript").
export const LANGUAGE_LABELS = {
  js: 'JavaScript',
  jsx: 'JavaScript',
  ts: 'TypeScript',
  tsx: 'TypeScript',
  php: 'PHP',
  html: 'HTML',
  xml: 'XML',
  css: 'CSS',
  scss: 'SCSS',
  json: 'JSON',
  yml: 'YAML',
  yaml: 'YAML',
  sh: 'Shell',
  bash: 'Bash',
  sql: 'SQL',
  py: 'Python',
  md: 'Markdown',
}

export function languageLabel(lang) {
  return LANGUAGE_LABELS[lang] ?? (lang.charAt(0).toUpperCase() + lang.slice(1))
}
