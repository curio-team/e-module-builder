import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }
    return new editorWorker()
  },
}

/**
 * @param {HTMLElement} container
 * @param {string} initialValue
 * @param {(value: string) => void} [onChange]
 */
export function createCssEditor(container, initialValue = '', onChange) {
  const editor = monaco.editor.create(container, {
    value: initialValue,
    language: 'css',
    theme: 'vs-dark',
    fontSize: 14,
    fontFamily: "'Google Sans Code', ui-monospace, monospace",
    minimap: { enabled: false },
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    wordWrap: 'on',
    padding: { top: 12 },
  })

  if (onChange) {
    editor.onDidChangeModelContent(() => onChange(editor.getValue()))
  }

  return editor
}

export function setEditorValue(editor, value) {
  if (!editor) return
  editor.setValue(value)
}

export function getEditorValue(editor) {
  return editor?.getValue() ?? ''
}
