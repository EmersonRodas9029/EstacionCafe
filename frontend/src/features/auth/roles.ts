import { Role } from '@/api/generated/model/role'

/** Panel de operación: meseros y cajeros (el admin también puede entrar). */
export const OPERATION_ROLES: readonly Role[] = [Role.mesero, Role.cajero, Role.admin]
export const ADMIN_ROLES: readonly Role[] = [Role.admin]
/** Cobrar: cajero y admin. */
export const CASHIER_ROLES: readonly Role[] = [Role.cajero, Role.admin]

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  mesero: 'Mesero',
  cajero: 'Cajero',
}

export const homePathFor = (role: Role) => (role === Role.admin ? '/admin' : '/mesero/mesas')

/** Solo acepta destinos internos que el rol puede abrir. */
export const safeRedirect = (from: string | undefined, role: Role) => {
  if (!from?.startsWith('/') || from.startsWith('//') || from === '/login') return homePathFor(role)
  if (from.startsWith('/admin') && role !== Role.admin) return homePathFor(role)
  return from
}
