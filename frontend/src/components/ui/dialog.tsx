import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type DialogProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

/**
 * Modal sobre <dialog> nativo: foco atrapado, Escape y fondo inerte
 * sin dependencias. En móvil se ancla abajo (sheet).
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose() // clic en el fondo
      }}
      aria-labelledby={titleId}
      className={cn(
        'm-0 mt-auto w-full max-w-none rounded-t-xl bg-card p-0 text-foreground shadow-xl backdrop:bg-black/60',
        'sm:m-auto sm:max-w-md sm:rounded-xl',
        className,
      )}
    >
      {open ? (
        <div className="flex max-h-[85dvh] flex-col">
          <header className="flex items-start justify-between gap-4 border-b px-5 py-4">
            <div>
              <h2 id={titleId} className="font-display text-xl font-semibold text-primary">
                {title}
              </h2>
              {description ? (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="-m-2 grid size-11 place-items-center rounded-md text-muted-foreground hover:bg-muted"
            >
              <X className="size-5" />
            </button>
          </header>
          <div className="overflow-y-auto px-5 py-5">{children}</div>
          {footer ? (
            <footer className="flex flex-col-reverse gap-2 border-t px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">
              {footer}
            </footer>
          ) : null}
        </div>
      ) : null}
    </dialog>
  )
}
