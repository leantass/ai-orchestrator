import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import RendererErrorBoundary from './components/RendererErrorBoundary.tsx'

const rootElement = document.getElementById('root')

const renderBootstrapFailure = (message: string, detail?: string) => {
  const target = rootElement || document.body
  target.innerHTML = `
    <main style="min-height:100vh;padding:40px;background:#020617;color:#f8fafc;font-family:Segoe UI,Arial,sans-serif;">
      <section style="max-width:840px;margin:0 auto;border:1px solid rgba(248,113,113,.28);background:rgba(127,29,29,.16);border-radius:24px;padding:24px;">
        <div style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#fecaca;font-weight:700;">Bootstrap protegido</div>
        <h1 style="margin:16px 0 12px;font-size:28px;line-height:1.2;">JEFE no pudo montar el renderer.</h1>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.8;">La app mostro este fallback para evitar una pantalla blanca muda. Reinicia la ventana o revisa DevTools antes de seguir.</p>
        <div style="padding:16px;border-radius:18px;border:1px solid rgba(255,255,255,.1);background:rgba(2,6,23,.68);font-size:14px;line-height:1.7;">
          <strong>${message}</strong>
          ${detail ? `<pre style="white-space:pre-wrap;margin:12px 0 0;color:#e2e8f0;">${detail}</pre>` : ''}
        </div>
      </section>
    </main>
  `
}

try {
  if (!rootElement) {
    throw new Error('No se encontro el nodo #root para montar la app.')
  }

  createRoot(rootElement).render(
    <StrictMode>
      <RendererErrorBoundary>
        <App />
      </RendererErrorBoundary>
    </StrictMode>,
  )
} catch (error) {
  const message = error instanceof Error ? error.message : 'Error desconocido al montar JEFE.'
  console.error('Fallo el bootstrap del renderer de JEFE.', error)
  renderBootstrapFailure('No se pudo inicializar la interfaz principal.', message)
}
