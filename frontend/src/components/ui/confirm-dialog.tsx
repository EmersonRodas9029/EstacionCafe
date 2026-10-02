import type { ReactNode } from 'react'
import { Button } from './button'
import { Dialog } from './dialog'

/** Confirmación para acciones difíciles de revertir. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel,
  destructive = false,
  pending = false,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  children?: ReactNode
  confirmLabel: string
  destructive?: boolean
  pending?: boolean
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'accent'}
            onClick={onConfirm}
            disabled={pending}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children ? <div className="text-muted-foreground">{children}</div> : null}
    </Dialog>
  )
}
