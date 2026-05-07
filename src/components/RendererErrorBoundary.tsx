import { Component, type ErrorInfo, type ReactNode } from 'react'

type RendererErrorBoundaryProps = {
  children: ReactNode
}

type RendererErrorBoundaryState = {
  error: Error | null
}

export default class RendererErrorBoundary extends Component<
  RendererErrorBoundaryProps,
  RendererErrorBoundaryState
> {
  state: RendererErrorBoundaryState = {
    error: null,
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RendererErrorBoundary capturo un error grave del renderer.', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    const { error } = this.state

    if (!error) {
      return this.props.children
    }

    const showDevDetail =
      typeof import.meta !== 'undefined' &&
      Boolean(import.meta.env?.DEV) &&
      typeof error.message === 'string' &&
      error.message.trim() !== ''

    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
        <div className="mx-auto flex max-w-3xl flex-col gap-5 rounded-3xl border border-rose-300/20 bg-rose-300/10 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-100/80">
              Renderer protegido
            </div>
            <h1 className="mt-3 text-2xl font-semibold text-white">
              JEFE encontro un error grave y evito una pantalla blanca muda.
            </h1>
            <p className="mt-3 text-sm leading-7 text-rose-50">
              La app no pudo terminar de renderizar esta vista. Podes recargar la ventana,
              abrir DevTools o revisar la consola tecnica para ver mas detalle antes de
              seguir.
            </p>
          </div>

          <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-200">
            <div>1. Intenta recargar JEFE con el boton de abajo.</div>
            <div>2. Si vuelve a pasar, abri DevTools y mirá el primer error del renderer.</div>
            <div>3. Si estabas materializando algo, revisa tambien la consola tecnica.</div>
          </div>

          {showDevDetail ? (
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Detalle de desarrollo
              </div>
              <pre className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-100">
                {error.message}
              </pre>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="rounded-xl border border-rose-300/25 bg-rose-300/15 px-4 py-3 text-sm font-medium text-rose-50 transition hover:bg-rose-300/20"
            >
              Recargar renderer
            </button>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              Si el error persiste, reinicia `npm run desktop:dev` y revisa el primer stack.
            </div>
          </div>
        </div>
      </main>
    )
  }
}
