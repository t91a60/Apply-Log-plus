import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Application } from '@/db/schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  applications: Application[]
}

export function StatsCards({ applications }: Props) {
  const { t, i18n } = useTranslation()
  const lang: 'en' | 'pl' = i18n.language === 'pl' ? 'pl' : 'en'

  const stats = useMemo(() => {
    const total = applications.length
    const active = applications.filter(
      a => !['Rejected', 'Ghosted', 'Declined', 'Accepted'].includes(a.currentStage)
    ).length
    const rejected = applications.filter(
      a => ['Rejected', 'Ghosted'].includes(a.currentStage)
    ).length
    const offers = applications.filter(a => a.currentStage === 'Offer').length
    const accepted = applications.filter(a => a.currentStage === 'Accepted').length

    const stageCounts = applications.reduce<Record<string, number>>((acc, app) => {
      acc[app.currentStage] = (acc[app.currentStage] ?? 0) + 1
      return acc
    }, {})

    const monthlyCounts = applications.reduce<Record<string, number>>((acc, app) => {
      const month = app.createdAt.slice(0, 7)
      acc[month] = (acc[month] ?? 0) + 1
      return acc
    }, {})

    const sortedMonths = Object.entries(monthlyCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)

    const responseTimes = applications
      .filter(a => a.timeline.length >= 2)
      .map(a => {
        const first = new Date(a.timeline[0]!.date).getTime()
        const last = new Date(a.timeline[a.timeline.length - 1]!.date).getTime()
        return (last - first) / (1000 * 60 * 60 * 24)
      })

    const avgResponseDays = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : null

    return {
      total, active, rejected, offers, accepted,
      stageCounts, sortedMonths, avgResponseDays,
    }
  }, [applications])

  function formatMonth(m: string) {
    const d = new Date(m + '-01')
    return d.toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-US', {
      month: 'short',
      year: '2-digit',
    })
  }

  return (
    <div className="space-y-4 tabular-nums">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
        {(['total', 'active', 'rejected', 'offers', 'accepted'] as const).map(key => (
          <div key={key} className="flex min-w-0 flex-wrap items-baseline gap-x-2">
            <dt className="text-sm text-muted-foreground">{t(`stats.${key}`)}</dt>
            <dd className="order-first text-xl font-semibold">{stats[key]}</dd>
          </div>
        ))}
      </dl>

      {stats.sortedMonths.length > 0 && (
        <details>
          <summary className="min-h-11 cursor-pointer rounded-md py-3 text-sm font-medium hover:bg-muted/50">{t('stats.details')}</summary>
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm">{t('stats.monthlyTrend')}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <dl className="space-y-2 text-sm">
                  {stats.sortedMonths.map(([month, count]) => (
                    <div key={month} className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">{formatMonth(month)}</dt>
                      <dd className="font-medium">{count}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>

            {stats.avgResponseDays !== null && (
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm">{t('stats.avgResponse')}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-3xl font-bold text-primary">{stats.avgResponseDays}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t('stats.days')}</div>
                </CardContent>
              </Card>
            )}
          </div>
        </details>
      )}
    </div>
  )
}
