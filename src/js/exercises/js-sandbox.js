const SETTLE_QUIET_MS = 400
const SETTLE_MAX_MS = 3000

function buildSandboxDoc(code) {
  // Embedded directly as inline script text (not via Function/eval) so the CSP
  // can allow 'unsafe-inline' without needing 'unsafe-eval'. Guard against the
  // learner's code containing a literal "</script" that would close the tag early.
  const safeCode = code.replace(/<\/script/gi, '<\\/script')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; connect-src *; style-src 'unsafe-inline'">
<style>body { margin: 0; font-family: ui-monospace, monospace; }</style>
</head>
<body>
<script>
(function () {
  function post(level, args) {
    parent.postMessage({ source: 'js-playground', type: 'console', level, args: args.map(String) }, '*')
  }

  ;['log', 'info', 'warn', 'error'].forEach(function (level) {
    console[level] = function () {
      post(level, Array.prototype.slice.call(arguments))
    }
  })

  window.addEventListener('error', function (e) {
    post('error', [e.message])
  })

  window.addEventListener('unhandledrejection', function (e) {
    post('error', [(e.reason && e.reason.message) || String(e.reason)])
  })
})()
</script>
<script>
try {
${safeCode}
} catch (err) {
  parent.postMessage({ source: 'js-playground', type: 'console', level: 'error', args: [String(err.message || err)] }, '*')
}
</script>
</body>
</html>`
}

/**
 * Runs `code` inside a freshly created sandboxed iframe (no allow-same-origin,
 * so it gets an opaque origin with no access to the parent page).
 *
 * @param {HTMLElement} container - element that will hold the sandbox iframe
 * @param {string} code
 * @param {{ onConsole?: (entry: {level: string, args: string[]}) => void, onSettled?: (lines: {level: string, args: string[]}[]) => void }} [options]
 * @returns {HTMLIFrameElement}
 */
export function runInSandbox(container, code, { onConsole, onSettled } = {}) {
  container.innerHTML = ''

  const iframe = document.createElement('iframe')
  iframe.sandbox = 'allow-scripts'
  iframe.className = 'sandbox-frame'
  iframe.title = 'JS sandbox'
  container.appendChild(iframe)

  const collected = []
  let quietTimer = null
  let maxTimer = null
  let settled = false

  function finishSettle() {
    if (settled) return
    settled = true
    clearTimeout(quietTimer)
    clearTimeout(maxTimer)
    window.removeEventListener('message', onMessage)
    onSettled?.(collected)
  }

  function onMessage(event) {
    if (event.source !== iframe.contentWindow) return
    if (event.data?.source !== 'js-playground' || event.data?.type !== 'console') return

    const entry = { level: event.data.level, args: event.data.args }
    collected.push(entry)
    onConsole?.(entry)

    clearTimeout(quietTimer)
    quietTimer = setTimeout(finishSettle, SETTLE_QUIET_MS)
  }

  window.addEventListener('message', onMessage)
  quietTimer = setTimeout(finishSettle, SETTLE_QUIET_MS)
  maxTimer = setTimeout(finishSettle, SETTLE_MAX_MS)

  iframe.srcdoc = buildSandboxDoc(code)

  return iframe
}
