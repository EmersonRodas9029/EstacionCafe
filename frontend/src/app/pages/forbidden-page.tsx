import { ShieldX } from 'lucide-react'
import { Link } from 'react-router'
import { useRole } from '@/features/auth/session-store'
import { homePathFor } from '@/features/auth/roles'

export function ForbiddenPage() {
  const role = useRole()

  return (
    <main className="grid min-h-dvh place-items-center bg-surface-soft p-4 text-center">
      <div className="max-w-sm space-y-3">
        <ShieldX className="mx-auto size-12 text-accent" aria-hidden="true" />
        <p className="font-display text-3xl font-semibold text-primary">Sin acceso</p>
        <p className="text-muted-foreground">Tu rol no tiene permiso para ver esta sección.</p>
        <Link
          to={role ? homePathFor(role) : '/login'}
          className="inline-block font-semibold text-accent-strong underline"
        >
          Ir a mi panel
        </Link>
      </div>
    </main>
  )
}
