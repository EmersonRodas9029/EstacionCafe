import { useEffect, useSyncExternalStore } from 'react'
import { create } from 'zustand'

export type Theme = 'system' | 'light' | 'dark'

/** Misma clave que lee public/theme-init.js antes de pintar. */
export const THEME_KEY = 'estacioncafe-theme'

const readSaved = (): Theme => {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  } catch {
    return 'system'
  }
}

type ThemeState = { theme: Theme; setTheme: (theme: Theme) => void }

/** Preferencia por dispositivo (cada tablet puede tener la suya). */
export const useThemeStore = create<ThemeState>()((set) => ({
  theme: readSaved(),
  setTheme: (theme) => {
    try {
      if (theme === 'system') localStorage.removeItem(THEME_KEY)
      else localStorage.setItem(THEME_KEY, theme)
    } catch {
      /* sin almacenamiento: dura hasta recargar */
    }
    set({ theme })
  },
}))

const media = () => window.matchMedia?.('(prefers-color-scheme: dark)')

const subscribeSystem = (onChange: () => void) => {
  const query = media()
  query?.addEventListener('change', onChange)
  return () => query?.removeEventListener('change', onChange)
}

/** Tema efectivo (resuelve "system" con la preferencia del sistema operativo). */
export function useResolvedTheme(): 'light' | 'dark' {
  const theme = useThemeStore((s) => s.theme)
  const systemDark = useSyncExternalStore(
    subscribeSystem,
    () => media()?.matches ?? false,
    () => false,
  )
  return theme === 'system' ? (systemDark ? 'dark' : 'light') : theme
}

/** Mantiene la clase `dark` de <html> sincronizada con la preferencia. */
export function useApplyTheme() {
  const resolved = useResolvedTheme()
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
  }, [resolved])
  return resolved
}
