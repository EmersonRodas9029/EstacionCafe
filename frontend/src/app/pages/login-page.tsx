import { useState } from 'react'
import { useGetDeviceStatus } from '@/api/generated/auth/auth'
import { Logo } from '@/components/logo'
import { Spinner } from '@/components/ui/spinner'
import { LoginForm } from '@/features/auth/components/login-form'
import { PinPad } from '@/features/auth/components/pin-pad'

const DEMO_USERS = ['admin.demo', 'mesero.demo', 'cajero.demo']

export function LoginPage() {
  // En un dispositivo autorizado se entra con PIN; si no, con usuario y contraseña
  const device = useGetDeviceStatus({ query: { select: (r) => r.data, retry: false } })
  const [usePassword, setUsePassword] = useState(false)
  const pinMode = device.data?.authorized === true && !usePassword

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <aside className="brand-panel relative hidden overflow-hidden bg-chrome p-12 text-chrome-foreground lg:flex lg:flex-col lg:justify-between">
        <Logo className="text-chrome-foreground" />
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
        <header className="bg-chrome px-6 py-5 text-chrome-foreground lg:hidden">
          <Logo />
        </header>
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-sm space-y-8">
            <div className="space-y-2">
              <h2 className="font-display text-3xl font-semibold text-primary">
                {pinMode ? 'Ingresa tu PIN' : 'Bienvenido'}
              </h2>
              <p className="text-muted-foreground">
                {pinMode
                  ? `Equipo: ${device.data?.name ?? ''}`
                  : 'Ingresa con tu usuario para comenzar el turno.'}
              </p>
            </div>
            {device.isPending ? (
              <div className="grid place-items-center py-10">
                <Spinner label="Revisando el equipo" />
              </div>
            ) : pinMode ? (
              <PinPad />
            ) : (
              <LoginForm />
            )}
            {device.data?.authorized ? (
              <button
                type="button"
                onClick={() => setUsePassword((v) => !v)}
                className="block min-h-11 w-full text-center text-sm font-semibold text-accent-strong hover:underline"
              >
                {pinMode ? 'Entrar con usuario y contraseña' : 'Entrar con PIN'}
              </button>
            ) : null}
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
