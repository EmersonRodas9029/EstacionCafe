import { toast } from 'sonner'
import type { Product } from '@/api/generated/model/product'
import { Button } from '@/components/ui/button'
import { useEditProduct } from '../hooks/use-catalog'

/** Activa o desactiva un producto en el menú (la API hace baja lógica). */
export function ActiveToggle({
  product,
  variant = 'ghost',
  className,
}: {
  product: Product
  variant?: 'ghost' | 'outline'
  className?: string
}) {
  const edit = useEditProduct()
  const next = !product.active

  return (
    <Button
      size="sm"
      variant={variant}
      className={className}
      disabled={edit.isPending}
      onClick={() =>
        edit.mutate(
          { id: product.productId, data: { active: next } },
          {
            onSuccess: () =>
              toast.success(`${product.name} ${next ? 'activado' : 'desactivado'}`, {
                description: next ? 'Vuelve a aparecer en el menú.' : 'Ya no aparece en el menú.',
              }),
          },
        )
      }
      aria-label={`${next ? 'Activar' : 'Desactivar'} ${product.name}`}
    >
      {next ? 'Activar' : 'Desactivar'}
    </Button>
  )
}
