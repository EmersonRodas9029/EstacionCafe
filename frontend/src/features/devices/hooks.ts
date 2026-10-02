import { useForgetThisDevice } from '@/api/generated/auth/auth'
import {
  useRegisterDevice,
  useRevokeDevice,
  useUpdateDevice,
} from '@/api/generated/devices/devices'
import { useInvalidatingOptions } from '@/lib/mutation-options'

const PREFIXES = ['/devices', '/auth/device']
const useOptions = () => useInvalidatingOptions(PREFIXES)

export const useAuthorizeThisDevice = () => useRegisterDevice({ mutation: useOptions() })
export const useRenameDevice = () => useUpdateDevice({ mutation: useOptions() })
export const useRevoke = () => useRevokeDevice({ mutation: useOptions() })
export const useForgetDevice = () => useForgetThisDevice({ mutation: useOptions() })
