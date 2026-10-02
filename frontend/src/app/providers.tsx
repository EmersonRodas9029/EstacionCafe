import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, type ReactNode } from 'react'
import { Toaster } from 'sonner'
import { useResolvedTheme } from '@/features/theme/theme-store'
import { createQueryClient } from './query-client'

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)
  const theme = useResolvedTheme()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-center" richColors closeButton theme={theme} />
      {import.meta.env.VITE_QUERY_DEVTOOLS === 'true' ? (
        <ReactQueryDevtools buttonPosition="top-right" />
      ) : null}
    </QueryClientProvider>
  )
}
