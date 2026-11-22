import { useTranslation } from 'react-i18next'
import type { StageTimelineEntry } from '@/db/schema'
import { getStageLabel } from '@/db/schema'

interface Props {
  timeline: StageTimelineEntry[]
  lang: 'en' | 'pl'
}

export function Timeline({ timeline, lang }: Props) {
  const { t } = useTranslation()

  if (timeline.length === 0) return null

  const sorted = [...timeline].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-0">
      <h4 className="text-sm font-medium mb-3">{t('application.timeline')}</h4>
      <div className="relative space-y-0">
        {sorted.map((entry, i) => (
          <div key={i} className="relative flex gap-4 pb-4 last:pb-0">
            <div className="flex shrink-0 flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-background" />
              {i < sorted.length - 1 && (
                <div className="w-px flex-1 bg-border" />
              )}
            </div>
            <div className="min-w-0 flex-1 pt-0.5 [overflow-wrap:anywhere]">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-sm font-medium">{getStageLabel(entry.stage, lang)}</span>
                <span className="text-xs text-muted-foreground">{formatDate(entry.date)}</span>
              </div>
              {entry.note && (
                <p className="text-sm text-muted-foreground mt-0.5">{entry.note}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
