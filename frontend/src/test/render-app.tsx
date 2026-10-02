import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { Toaster } from 'sonner'
import { routes } from '@/app/router'
import { useSessionStore, type SessionUser } from '@/features/auth/session-store'
import { db } from '@/mocks/db'

const USERS: Record<'admin' | 'mesero' | 'cajero', SessionUser> = {
  admin: {
    userId: 1,
    username: 'admin.demo',
    email: 'admin.demo@estacioncafe.test',
    role: 'admin',
  },
  mesero: {
    userId: 2,
    username: 'mesero.demo',
    email: 'mesero.demo@estacioncafe.test',
    role: 'mesero',
  },
  cajero: {
    userId: 3,
    username: 'cajero.demo',
    email: 'cajero.demo@estacioncafe.test',
    role: 'cajero',
  },
}

/**
 * Renderiza la app completa (router real + MSW). Con `as` inicia sesión con ese rol:
 * el usuario en el store y la sesión simulada en la API (la cookie en la app real).
 */
export function renderApp(path: string, as?: keyof typeof USERS) {
  if (as) {
    useSessionStore.setState({ user: USERS[as], loggedOut: false })
    db.sessionUserId = USERS[as].userId
  }
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
