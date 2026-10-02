import { toast } from 'sonner'
import type { Supplier } from '@/api/generated/model/supplier'
import { Button } from '@/components/ui/button'
import { useDeactivateSupplier, useEditSupplier } from '../hooks'

/** DELETE desactiva; reactivar es un PUT con active: true. */
export function SupplierActiveToggle({
  supplier,
  variant = 'ghost',
  className,
}: {
  supplier: Supplier
  variant?: 'ghost' | 'outline'
  className?: string
}) {
  const deactivate = useDeactivateSupplier()
  const edit = useEditSupplier()
  const onClick = () =>
    supplier.active
      ? deactivate.mutate(
          { id: supplier.supplierId },
          { onSuccess: () => toast.success(`${supplier.name} desactivado`) },
        )
      : edit.mutate(
          { id: supplier.supplierId, data: { active: true } },
          { onSuccess: () => toast.success(`${supplier.name} activado`) },
        )
  return (
    <Button
      size="sm"
      variant={variant}
      className={className}
      disabled={deactivate.isPending || edit.isPending}
      onClick={onClick}
      aria-label={`${supplier.active ? 'Desactivar' : 'Activar'} ${supplier.name}`}
    >
      {supplier.active ? 'Desactivar' : 'Activar'}
    </Button>
  )
}
