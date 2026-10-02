import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

export function RouteErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} — ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Error inesperado'

  return (
    <main
      role="alert"
      className="grid min-h-dvh place-items-center bg-surface-soft p-4 text-center"
    >
      <div className="space-y-3">
        <p className="text-2xl font-bold text-primary">Algo salió mal</p>
        <p className="text-muted-foreground">{message}</p>
        <Link to="/" className="font-semibold text-accent-strong underline">
          Volver al inicio
        </Link>
      </div>
    </main>
  )
}
