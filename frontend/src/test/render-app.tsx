import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { Toaster } from 'sonner'
import { routes } from '@/app/router'
import { useSessionStore, type SessionUser } from '@/features/auth/session-store'

const SESSIONS: Record<'admin' | 'mesero', { token: string; user: SessionUser }> = {
  admin: {
    token: 'mock-1',
    user: {
      userId: 1,
      username: 'admin.demo',
      email: 'admin.demo@estacioncafe.test',
      role: 'admin',
    },
  },
  mesero: {
    token: 'mock-2',
    user: {
      userId: 2,
      username: 'mesero.demo',
      email: 'mesero.demo@estacioncafe.test',
      role: 'mesero',
    },
  },
}

/** Renderiza la app completa (router real + MSW). Con `as` inicia sesión con ese rol. */
export function renderApp(path: string, as?: keyof typeof SESSIONS) {
  if (as) useSessionStore.setState(SESSIONS[as])
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>,
  )
  return router
}
