import { Logo } from '@/components/logo'
import { LoginForm } from '@/features/auth/components/login-form'

const DEMO_USERS = ['admin.demo', 'mesero.demo', 'cajero.demo']

export function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <aside className="brand-panel relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <Logo className="text-primary-foreground" />
        <div className="relative z-10 max-w-md space-y-5">
          <p className="text-sm font-semibold tracking-[0.2em] text-accent uppercase">
            Próxima parada
          </p>
          <h1 className="font-display text-5xl leading-[1.05] font-semibold text-balance">
            Cada mesa es una estación. Cada cuenta, un viaje bien servido.
          </h1>
          <p className="text-lg text-surface/80">
            Mesas, cuentas y órdenes para llevar en un solo lugar.
          </p>
        </div>
        <p className="relative z-10 text-sm text-surface/60">© EstacionCafé</p>
      </aside>

      <main className="flex flex-col bg-surface-soft">
        <header className="bg-primary px-6 py-5 text-primary-foreground lg:hidden">
          <Logo />
        </header>
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-sm space-y-8">
            <div className="space-y-2">
              <h2 className="font-display text-3xl font-semibold text-primary">Bienvenido</h2>
              <p className="text-muted-foreground">
                Ingresa con tu usuario para comenzar el turno.
              </p>
            </div>
            <LoginForm />
            {import.meta.env.DEV ? (
              <p className="rounded-md border border-dashed border-primary/20 p-3 text-xs text-muted-foreground">
                Demo: {DEMO_USERS.join(' · ')} — contraseña <code>AdminDemo123!</code>
              </p>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}
