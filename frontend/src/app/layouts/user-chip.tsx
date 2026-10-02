import { ROLE_LABELS } from '@/features/auth/roles'
import { useSessionStore } from '@/features/auth/session-store'

export function UserChip() {
  const user = useSessionStore((s) => s.user)
  if (!user) return null

  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center rounded-full bg-accent font-bold text-accent-foreground uppercase"
      >
        {user.username.charAt(0)}
      </span>
      <span className="hidden text-left leading-tight sm:block">
        <span className="block text-sm font-semibold">{user.username}</span>
        <span className="block text-xs opacity-75">{ROLE_LABELS[user.role]}</span>
      </span>
    </span>
  )
}
