import { useTranslation } from 'react-i18next'
import type { Application } from '@/db/schema'
import { Card, CardContent } from '@/components/ui/card'

interface Props {
  applications: Application[]
}

export function StatsCards({ applications }: Props) {
  const { t } = useTranslation()

  const stageCounts = applications.reduce<Record<string, number>>((acc, app) => {
    acc[app.currentStage] = (acc[app.currentStage] ?? 0) + 1
    return acc
  }, {})

  const total = applications.length
  const active = applications.filter(
    a => !['Rejected', 'Ghosted', 'Declined', 'Accepted'].includes(a.currentStage)
  ).length
  const rejected = applications.filter(
    a => ['Rejected', 'Ghosted'].includes(a.currentStage)
  ).length

  const cards = [
    { label: t('stats.total'), value: total, color: 'bg-primary/10 text-primary' },
    { label: t('stats.active'), value: active, color: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    { label: t('stats.rejected'), value: rejected, color: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' },
    ...Object.entries(stageCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([stage, count]) => ({
        label: stage,
        value: count,
        color: 'bg-muted text-muted-foreground',
      })),
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(card => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">{card.label}</div>
            <div className={`text-2xl font-bold ${card.color} inline-block px-2 py-1 rounded-md`}>
              {card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
