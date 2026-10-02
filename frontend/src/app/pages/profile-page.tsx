import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/features/auth/hooks/use-logout'
import { ROLE_LABELS } from '@/features/auth/roles'
import { useSessionStore } from '@/features/auth/session-store'
import { ThemeSelector } from '@/features/theme/theme-toggle'

export function ProfilePage() {
  const user = useSessionStore((s) => s.user)
  const logout = useLogout()

  if (!user) return null

  return (
    <section className="max-w-lg space-y-6">
      <h1 className="font-display text-3xl font-semibold text-primary">Mi perfil</h1>
      <dl className="divide-y rounded-lg border bg-card">
        {[
          ['Usuario', user.username],
          ['Correo', user.email],
          ['Rol', ROLE_LABELS[user.role]],
        ].map(([term, value]) => (
          <div key={term} className="flex justify-between gap-4 px-5 py-4">
            <dt className="text-muted-foreground">{term}</dt>
            <dd className="font-semibold text-primary">{value}</dd>
          </div>
        ))}
      </dl>
      <section aria-labelledby="theme-title" className="space-y-3">
        <h2 id="theme-title" className="font-semibold text-primary">
          Apariencia
        </h2>
        <ThemeSelector />
        <p className="text-sm text-muted-foreground">
          Se guarda en este dispositivo. «Sistema» sigue la configuración del equipo.
        </p>
      </section>
      <p className="text-sm text-muted-foreground">
        Para cambiar tus datos o contraseña pide ayuda a un administrador.
      </p>
      <Button variant="outline" size="lg" onClick={logout}>
        <LogOut /> Cerrar sesión
      </Button>
    </section>
  )
}
