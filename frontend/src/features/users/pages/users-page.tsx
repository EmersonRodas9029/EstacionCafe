import { KeyRound, Pencil, Plus, Search, ShieldCheck, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { User } from '@/api/generated/model/user'
import { useListUserTypes } from '@/api/generated/user-types/user-types'
import { useListUsers } from '@/api/generated/users/users'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChipGroup } from '@/components/ui/chip-group'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/ui/state'
import { ROLE_LABELS } from '@/features/auth/roles'
import { useSessionStore } from '@/features/auth/session-store'
import { cn } from '@/lib/utils'
import { PinDialog } from '../components/pin-dialog'
import { RolesDialog } from '../components/roles-dialog'
import { UserFormDialog } from '../components/user-form-dialog'
import { useDeactivateUser, useEditUser } from '../hooks'

type StatusFilter = 'active' | 'inactive' | 'all'

/** Solo meseros y cajeros entran con PIN; el listado trae `hasPin`. */
const usesPin = (user: User) => user.userType?.role === 'mesero' || user.userType?.role === 'cajero'
const hasPin = (user: User) => Boolean(user.hasPin)

function ActiveToggle({ user, isSelf }: { user: User; isSelf: boolean }) {
  const deactivate = useDeactivateUser()
  const edit = useEditUser()
  const pending = deactivate.isPending || edit.isPending

  if (isSelf)
    return (
      <span
        className="px-2 text-sm whitespace-nowrap text-muted-foreground"
        title="No puedes desactivar tu propio usuario"
      >
        Tu usuario
      </span>
    )

  const onClick = () =>
    user.active
      ? deactivate.mutate(
          { id: user.userId },
          {
            onSuccess: () =>
              toast.success(`${user.username} desactivado`, {
                description: 'Ya no puede iniciar sesión.',
              }),
          },
        )
      : edit.mutate(
          { id: user.userId, data: { active: true } },
          { onSuccess: () => toast.success(`${user.username} reactivado`) },
        )

  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={onClick}
      aria-label={`${user.active ? 'Desactivar' : 'Activar'} ${user.username}`}
    >
      {user.active ? 'Desactivar' : 'Activar'}
    </Button>
  )
}

export function UsersPage() {
  const me = useSessionStore((s) => s.user)
  const users = useListUsers({ query: { select: (r) => r.data } })
  const roles = useListUserTypes({ query: { select: (r) => r.data } })
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [status, setStatus] = useState<StatusFilter>('active')
  const [dialog, setDialog] = useState<
    { kind: 'user'; user?: User } | { kind: 'roles' } | { kind: 'pin'; user: User } | null
  >(null)
  const close = () => setDialog(null)

  const all = useMemo(() => users.data ?? [], [users.data])
  const myTypeId = all.find((u) => u.userId === me?.userId)?.userTypeId
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    return all.filter(
      (u) =>
        (status === 'all' || u.active === (status === 'active')) &&
        (roleFilter === 'all' || u.userTypeId === Number(roleFilter)) &&
        (!query || `${u.username} ${u.email}`.toLowerCase().includes(query)),
    )
  }, [all, search, roleFilter, status])
  const activeCount = all.filter((u) => u.active).length

  return (
    <>
      <PageHeader
        title="Usuarios y roles"
        subtitle={users.data ? `${activeCount} activos de ${all.length}` : undefined}
        actions={
          <>
            <Button variant="outline" onClick={() => setDialog({ kind: 'roles' })}>
              <ShieldCheck /> Roles
            </Button>
            <Button variant="accent" onClick={() => setDialog({ kind: 'user' })}>
              <Plus /> Nuevo usuario
            </Button>
          </>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:w-80">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            aria-label="Buscar usuario"
            placeholder="Buscar usuario o correo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="lg:w-56">
          <Select
            aria-label="Rol"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">Todos los roles</option>
            {(roles.data ?? []).map((r) => (
              <option key={r.userTypeId} value={r.userTypeId}>
                {r.name}
              </option>
            ))}
          </Select>
        </div>
        <ChipGroup
          label="Estado"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'active', label: 'Activos', count: activeCount },
            { value: 'inactive', label: 'Inactivos', count: all.length - activeCount },
            { value: 'all', label: 'Todos', count: all.length },
          ]}
        />
      </div>

      {users.isPending ? (
        <Skeleton className="h-64" />
      ) : users.isError ? (
        <ErrorState message="No pudimos cargar los usuarios." onRetry={() => users.refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState icon={Users} title="Sin resultados" description="Prueba con otro filtro." />
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-surface-soft text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th scope="col" className="w-full px-4 py-3 font-semibold">
                  Usuario
                </th>
                <th scope="col" className="hidden px-4 py-3 font-semibold sm:table-cell">
                  Rol
                </th>
                <th scope="col" className="hidden px-4 py-3 font-semibold md:table-cell">
                  Estado
                </th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visible.map((user) => {
                const isSelf = user.userId === me?.userId
                return (
                  <tr key={user.userId} className={cn(!user.active && 'bg-muted/40')}>
                    <td className="max-w-0 px-4 py-3">
                      <p className="truncate font-semibold text-primary">
                        {user.username}
                        {isSelf ? (
                          <span className="font-normal text-muted-foreground"> (tú)</span>
                        ) : null}
                      </p>
                      <p className="truncate text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground sm:hidden">
                        {user.userType?.name}
                        {user.active ? '' : ' · Inactivo'}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 whitespace-nowrap sm:table-cell">
                      {user.userType ? (
                        <>
                          <p className="font-semibold text-primary">{user.userType.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {ROLE_LABELS[user.userType.role]}
                          </p>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <Badge tone={user.active ? 'available' : 'neutral'}>
                        {user.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <ActiveToggle user={user} isSelf={isSelf} />
                        {usesPin(user) ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`PIN de ${user.username}`}
                            title={hasPin(user) ? 'Tiene PIN' : 'Sin PIN'}
                            onClick={() => setDialog({ kind: 'pin', user })}
                            className={
                              hasPin(user) ? 'text-status-available' : 'text-muted-foreground'
                            }
                          >
                            <KeyRound />
                          </Button>
                        ) : null}
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Editar ${user.username}`}
                          onClick={() => setDialog({ kind: 'user', user })}
                        >
                          <Pencil />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {dialog?.kind === 'user' ? (
        <UserFormDialog
          onClose={close}
          user={dialog.user}
          roles={roles.data ?? []}
          isSelf={dialog.user?.userId === me?.userId}
        />
      ) : null}
      {dialog?.kind === 'pin' ? <PinDialog user={dialog.user} onClose={close} /> : null}
      {dialog?.kind === 'roles' ? (
        <RolesDialog onClose={close} roles={roles.data ?? []} users={all} ownTypeId={myTypeId} />
      ) : null}
    </>
  )
}
