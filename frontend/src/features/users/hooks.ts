import { useCreateUser, useDeleteUser, useUpdateUser } from '@/api/generated/users/users'
import {
  useCreateUserType,
  useDeleteUserType,
  useUpdateUserType,
} from '@/api/generated/user-types/user-types'
import { useInvalidatingOptions } from '@/lib/mutation-options'

// /bills muestra el nombre del mesero
const PREFIXES = ['/users', '/user-types', '/bills']

const useOptions = () => useInvalidatingOptions(PREFIXES)

export const useAddUser = () => useCreateUser({ mutation: useOptions() })
export const useEditUser = () => useUpdateUser({ mutation: useOptions() })
export const useDeactivateUser = () => useDeleteUser({ mutation: useOptions() })
export const useAddRole = () => useCreateUserType({ mutation: useOptions() })
export const useEditRole = () => useUpdateUserType({ mutation: useOptions() })
export const useRemoveRole = () => useDeleteUserType({ mutation: useOptions() })
