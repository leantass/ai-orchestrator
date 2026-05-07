const targetUrl = 'http://127.0.0.1:5173/'
const timeoutMs = 20000
const pollDelayMs = 400
const requiredMarkers = [
  'name="jefe-app"',
  'content="ai-orchestrator"',
  '/src/main.tsx',
]

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

const hasRequiredMarkers = (html) =>
  requiredMarkers.every((marker) => typeof html === 'string' && html.includes(marker))

async function waitForExpectedViteServer() {
  const startedAt = Date.now()
  let lastError = ''

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(targetUrl, {
        headers: {
          Accept: 'text/html',
          'Cache-Control': 'no-cache',
        },
      })

      const html = await response.text()
      if (response.ok && hasRequiredMarkers(html)) {
        return
      }

      if (response.ok) {
        throw new Error(
          'El puerto 5173 esta respondiendo, pero no parece ser el servidor de JEFE.',
        )
      }

      throw new Error(`El servidor respondio ${response.status} en ${targetUrl}.`)
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
      await sleep(pollDelayMs)
    }
  }

  throw new Error(
    [
      'No se encontro el servidor de desarrollo correcto de JEFE en http://127.0.0.1:5173.',
      'Verifica que el puerto 5173 este libre y que Vite haya arrancado en este repo.',
      lastError ? `Ultimo detalle: ${lastError}` : '',
    ]
      .filter(Boolean)
      .join(' '),
  )
}

waitForExpectedViteServer().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exitCode = 1
})
