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
 * Console output is forwarded to `onConsole` for as long as the iframe lives —
 * that includes anything logged from a setTimeout/setInterval/promise callback,
 * no matter how late it fires. There's no "is it done yet" detection here; the
 * listener is only torn down when the caller starts a new run (see the
 * returned `dispose` function).
 *
 * @param {HTMLElement} container - element that will hold the sandbox iframe
 * @param {string} code
 * @param {{ onConsole?: (entry: {level: string, args: string[]}) => void }} [options]
 * @returns {() => void} dispose - call before starting another run in the same container
 */
export function runInSandbox(container, code, { onConsole } = {}) {
  container.innerHTML = ''

  const iframe = document.createElement('iframe')
  iframe.sandbox = 'allow-scripts'
  iframe.className = 'sandbox-frame'
  iframe.title = 'JS sandbox'
  container.appendChild(iframe)

  let disposed = false

  function dispose() {
    if (disposed) return
    disposed = true
    window.removeEventListener('message', onMessage)
  }

  function onMessage(event) {
    if (event.source !== iframe.contentWindow) return
    if (event.data?.source !== 'js-playground' || event.data?.type !== 'console') return

    onConsole?.({ level: event.data.level, args: event.data.args })
  }

  window.addEventListener('message', onMessage)

  iframe.srcdoc = buildSandboxDoc(code)

  return dispose
}
