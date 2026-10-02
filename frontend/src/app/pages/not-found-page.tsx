import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-surface-soft p-4 text-center">
      <div className="space-y-3">
        <p className="text-6xl font-bold text-primary">404</p>
        <p className="text-muted-foreground">La página que buscas no existe.</p>
        <Link to="/" className="font-semibold text-accent-strong underline">
          Volver al inicio
        </Link>
      </div>
    </main>
  )
}
