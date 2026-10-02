import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { AppProviders } from '@/app/providers'
import { router } from '@/app/router'
import { env } from '@/lib/env'
// Fuentes empaquetadas: sin CSS bloqueante de terceros y disponibles sin red (PWA)
import '@fontsource-variable/figtree'
import '@fontsource-variable/fraunces/opsz.css'
import '@/styles/index.css'

async function enableMocks() {
  if (!env.enableMocks) {
    // MSW y la PWA usan service workers en el mismo scope: solo uno a la vez
    if (import.meta.env.PROD) void import('@/app/pwa').then(({ registerPwa }) => registerPwa())
    return
  }
  const { worker } = await import('@/mocks/browser')
  await worker.start({ onUnhandledFrame: 'bypass' })
}

enableMocks().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>,
  )
})
