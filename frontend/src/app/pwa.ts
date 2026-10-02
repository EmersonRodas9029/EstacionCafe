import { toast } from 'sonner'
import { registerSW } from 'virtual:pwa-register'

/**
 * Service worker de la PWA (solo en build). La app se instala en tabletas y
 * carga su shell sin red; la API nunca se cachea. Las versiones nuevas se
 * aplican cuando el usuario lo decide, para no recargar a media orden.
 */
export function registerPwa() {
  const update = registerSW({
    onNeedRefresh() {
      toast('Hay una versión nueva de EstaciónCafé', {
        description: 'Actualiza cuando no estés tomando una orden.',
        duration: Infinity,
        action: { label: 'Actualizar', onClick: () => void update(true) },
      })
    },
  })
}
