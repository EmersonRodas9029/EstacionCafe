import { useId, type ReactNode } from 'react'
import { Label } from './label'

export type FieldControlProps = {
  id: string
  'aria-invalid': true | undefined
  'aria-describedby': string | undefined
}

type FormFieldProps = {
  label: string
  error?: string
  hint?: string
  /** Recibe id y atributos aria para el control real (input, select…). */
  children: (control: FieldControlProps) => ReactNode
}

/** Etiqueta + control + mensaje, con aria-invalid/aria-describedby enlazados. */
export function FormField({ label, error, hint, children }: FormFieldProps) {
  const id = useId()
  const messageId = `${id}-message`
  const message = error ?? hint

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': message ? messageId : undefined,
      })}
      {message ? (
        <p
          id={messageId}
          className={error ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}
        >
          {message}
        </p>
      ) : null}
    </div>
  )
}
