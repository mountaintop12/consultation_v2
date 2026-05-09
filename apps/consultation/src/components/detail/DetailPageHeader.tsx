import { Calendar, ExternalLink, LinkIcon, User } from 'lucide-react'
import type { ReactNode } from 'react'
import { AddressLink } from '@/components/AddressLink'
import { formatDateTime } from '@/lib/utils'
import type { ItemStatus } from '@/routes/-index/components/StatusBadge'
import { StatusBadge } from '@/routes/-index/components/StatusBadge'

type DetailPageHeaderProps = {
  status: ItemStatus
  typeBadge: string
  id: number
  title: string
  start: Date
  deadline: Date
  author: string
  links: readonly string[]
  quorumBadge?: ReactNode
  originBadge?: ReactNode
}

export function DetailPageHeader({
  status,
  typeBadge,
  id,
  title,
  start,
  deadline,
  author,
  links,
  quorumBadge,
  originBadge
}: DetailPageHeaderProps) {
  return (
    <div className="min-w-0 overflow-hidden pb-2 lg:border-b lg:border-border lg:pb-6">
      <div className="mb-4 flex min-w-0 items-center gap-2">
        <StatusBadge status={status} />
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
          {typeBadge}
        </span>
        {quorumBadge && <div className="ml-auto">{quorumBadge}</div>}
      </div>
      {/* Title group */}
      <h1 className="break-words text-3xl font-light leading-tight text-foreground md:text-4xl">
        {title}
      </h1>
      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <span>
          {typeBadge} #{id}
        </span>
        {originBadge}
      </div>

      {/* Metadata rows - consistent styling */}
      <div className="mt-6 flex min-w-0 items-start gap-2 text-sm text-muted-foreground">
        <span className="flex w-4 shrink-0 justify-center">
          <Calendar className="size-4" />
        </span>
        <span className="min-w-0 break-words">
          {formatDateTime(start)} – {formatDateTime(deadline)}
        </span>
      </div>
      {author && (
        <div className="mt-2 flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <span className="flex w-4 shrink-0 justify-center">
            <User className="size-4" />
          </span>
          <AddressLink
            address={author}
            className="min-w-0 text-sm text-muted-foreground"
          />
        </div>
      )}
      {links.length > 0 && (
        <div className="mt-2 flex min-w-0 items-start gap-2 text-sm text-muted-foreground">
          <span className="flex w-4 shrink-0 justify-center">
            <LinkIcon className="size-4" />
          </span>
          <div className="flex min-w-0 flex-wrap items-center gap-4">
            {links
              .filter((link) => /^https?:\/\//i.test(link))
              .map((link) => (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 max-w-full items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline"
                >
                  <span className="min-w-0 break-all">{link}</span>
                  <ExternalLink className="size-3 shrink-0" />
                </a>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
