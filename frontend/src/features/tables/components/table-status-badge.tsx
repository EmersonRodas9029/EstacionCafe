import type { TableStatus } from '@/api/generated/model/tableStatus'
import { Badge } from '@/components/ui/badge'
import { TABLE_STATUS } from '../table-status'

export function TableStatusBadge({ status }: { status: TableStatus }) {
  const { label, tone, icon: Icon } = TABLE_STATUS[status]
  return (
    <Badge tone={tone}>
      <Icon aria-hidden="true" /> {label}
    </Badge>
  )
}
