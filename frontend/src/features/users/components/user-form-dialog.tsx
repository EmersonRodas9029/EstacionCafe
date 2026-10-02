import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { ApiError } from '@/api/errors'
import type { User } from '@/api/generated/model/user'
import type { UserType } from '@/api/generated/model/userType'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ROLE_LABELS } from '@/features/auth/roles'
import { useAddUser, useEditUser } from '../hooks'
import {
  createUserSchema,
  editUserSchema,
  type UserFormInput,
  type UserFormValues,
} from '../schemas'

const createResolver = zodResolver(createUserSchema)
const editResolver = zodResolver(editUserSchema)

export function UserFormDialog({
  onClose,
  user,
  roles,
  isSelf,
}: {
  onClose: () => void
  user?: User
  roles: UserType[]
  /** El admin editándose a sí mismo no puede cambiarse a un rol sin acceso de admin. */
  isSelf: boolean
}) {
  const add = useAddUser()
  const edit = useEditUser()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UserFormInput, unknown, UserFormValues>({
    resolver: user ? editResolver : createResolver,
    defaultValues: {
      username: user?.username ?? '',
      email: user?.email ?? '',
      typeId: user?.userTypeId ?? '',
      password: '',
    },
  })

  const onError = (error: unknown) => {
    if (error instanceof ApiError && error.status === 409 && /ya existe/i.test(error.message))
      setError('username', { message: 'Ese usuario ya existe' })
  }

  const onSubmit = handleSubmit(({ password, ...values }) => {
    const onSuccess = () => {
      toast.success(user ? `${values.username} actualizado` : `${values.username} creado`)
      onClose()
    }
    if (user)
      edit.mutate(
        { id: user.userId, data: { ...values, ...(password && { password }) } },
        { onSuccess, onError },
      )
    else add.mutate({ data: { ...values, password } }, { onSuccess, onError })
  })

  return (
    <Dialog open onClose={onClose} title={user ? `Editar ${user.username}` : 'Nuevo usuario'}>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FormField
          label="Usuario"
          error={errors.username?.message}
          hint="Con este nombre inicia sesión."
        >
          {(control) => (
            <Input
              {...control}
              autoFocus
              autoComplete="off"
              autoCapitalize="none"
              {...register('username')}
            />
          )}
        </FormField>
        <FormField label="Correo" error={errors.email?.message}>
          {(control) => <Input {...control} type="email" {...register('email')} />}
        </FormField>
        <FormField
          label="Rol"
          error={errors.typeId?.message}
          hint={isSelf ? 'Tu usuario solo puede tener roles de administrador.' : undefined}
        >
          {(control) => (
            <Select {...control} {...register('typeId')}>
              <option value="">Elige un rol</option>
              {roles.map((role) => (
                <option
                  key={role.userTypeId}
                  value={role.userTypeId}
                  disabled={isSelf && role.role !== 'admin'}
                >
                  {role.name} · {ROLE_LABELS[role.role]}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        <FormField
          label={user ? 'Nueva contraseña' : 'Contraseña'}
          error={errors.password?.message}
          hint={user ? 'Déjala vacía para no cambiarla.' : 'Mínimo 6 caracteres.'}
        >
          {(control) => (
            <Input
              {...control}
              type="password"
              autoComplete="new-password"
              {...register('password')}
            />
          )}
        </FormField>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="accent" disabled={add.isPending || edit.isPending}>
            {user ? 'Guardar' : 'Crear usuario'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
