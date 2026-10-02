import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Preferencias del dispositivo (cada tablet suele estar junto a una caja). */
export const usePreferencesStore = create<{
  cashRegisterId: number | null
  setCashRegisterId: (id: number) => void
}>()(
  persist(
    (set) => ({
      cashRegisterId: null,
      setCashRegisterId: (cashRegisterId) => set({ cashRegisterId }),
    }),
    { name: 'estacioncafe-preferences', version: 1 },
  ),
)
