import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import type { User } from '@/api/generated/model/user'
import type { UserType } from '@/api/generated/model/userType'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ROLE_LABELS } from '@/features/auth/roles'
import { useAddRole, useEditRole, useRemoveRole } from '../hooks'
import { roleFormSchema, type RoleFormInput, type RoleFormValues } from '../schemas'

const resolver = zodResolver(roleFormSchema)

const ACCESS_HINT: Record<UserType['role'], string> = {
  admin: 'Panel de administración y operación completa.',
  mesero: 'Mesas, órdenes y cobro.',
  cajero: 'Mismo panel que el mesero.',
}

function RoleForm({
  role,
  ownTypeId,
  onDone,
}: {
  role?: UserType
  ownTypeId?: number
  onDone: () => void
}) {
  const add = useAddRole()
  const edit = useEditRole()
  const own = role?.userTypeId === ownTypeId
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RoleFormInput, unknown, RoleFormValues>({
    resolver,
    defaultValues: {
      name: role?.name ?? '',
      permissionLevel: role?.permissionLevel ?? '',
      role: role?.role ?? 'mesero',
    },
  })
  const access = useWatch({ control, name: 'role' })

  const onSubmit = handleSubmit((data) => {
    const onSuccess = () => {
      toast.success(role ? `Rol ${data.name} actualizado` : `Rol ${data.name} creado`)
      onDone()
    }
    if (role) edit.mutate({ id: role.userTypeId, data }, { onSuccess })
    else add.mutate({ data }, { onSuccess })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <FormField label="Nombre" error={errors.name?.message} hint="Ej. Barista, Jefe de turno.">
        {(control) => <Input {...control} autoFocus {...register('name')} />}
      </FormField>
      <FormField
        label="Acceso"
        hint={
          own ? 'Es tu rol: no puedes quitarle el acceso de administrador.' : ACCESS_HINT[access]
        }
      >
        {(control) => (
          <Select {...control} disabled={own} {...register('role')}>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        )}
      </FormField>
      <FormField
        label="Nivel de permisos"
        error={errors.permissionLevel?.message}
        hint="De 0 a 10; informativo para ordenar los roles."
      >
        {(control) => (
          <Input
            {...control}
            type="number"
            inputMode="numeric"
            min={0}
            max={10}
            {...register('permissionLevel')}
          />
        )}
      </FormField>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" variant="accent" disabled={add.isPending || edit.isPending}>
          {role ? 'Guardar' : 'Crear rol'}
        </Button>
      </div>
    </form>
  )
}

export function RolesDialog({
  onClose,
  roles,
  users,
  ownTypeId,
}: {
  onClose: () => void
  roles: UserType[]
  users: User[]
  ownTypeId?: number
}) {
  // undefined = lista; null = nuevo; UserType = editar
  const [editing, setEditing] = useState<UserType | null | undefined>(undefined)
  const remove = useRemoveRole()
  const countOf = (id: number) => users.filter((u) => u.userTypeId === id).length

  const title =
    editing === undefined ? 'Roles' : editing === null ? 'Nuevo rol' : `Editar ${editing.name}`

  return (
    <Dialog
      open
      onClose={onClose}
      title={title}
      description={
        editing === undefined
          ? 'Cada rol da un tipo de acceso. Solo se eliminan los que no tienen usuarios.'
          : undefined
      }
    >
      {editing !== undefined ? (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="-mt-2 mb-3"
            onClick={() => setEditing(undefined)}
          >
            <ArrowLeft /> Roles
          </Button>
          <RoleForm
            role={editing ?? undefined}
            ownTypeId={ownTypeId}
            onDone={() => setEditing(undefined)}
          />
        </>
      ) : (
        <>
          <Button variant="accent" className="mb-4 w-full" onClick={() => setEditing(null)}>
            <Plus /> Nuevo rol
          </Button>
          <ul className="divide-y">
            {roles.map((role) => {
              const count = countOf(role.userTypeId)
              return (
                <li key={role.userTypeId} className="flex items-center gap-2 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-primary">
                      {role.name}
                      <Badge tone={role.role === 'admin' ? 'solid' : 'neutral'}>
                        {ROLE_LABELS[role.role]}
                      </Badge>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Nivel {role.permissionLevel} ·{' '}
                      {count === 1 ? '1 usuario' : `${count} usuarios`}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Editar rol ${role.name}`}
                    onClick={() => setEditing(role)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Eliminar rol ${role.name}`}
                    title={count > 0 ? 'Reasigna sus usuarios primero' : undefined}
                    disabled={count > 0 || remove.isPending}
                    onClick={() =>
                      remove.mutate(
                        { id: role.userTypeId },
                        { onSuccess: () => toast.success(`Rol ${role.name} eliminado`) },
                      )
                    }
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 />
                  </Button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </Dialog>
  )
}
