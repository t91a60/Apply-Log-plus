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
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-xs text-muted-foreground mt-1">{t('stats.total')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.active}</div>
            <div className="text-xs text-muted-foreground mt-1">{t('stats.active')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</div>
            <div className="text-xs text-muted-foreground mt-1">{t('stats.rejected')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.offers}</div>
            <div className="text-xs text-muted-foreground mt-1">{t('stats.offers')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.accepted}</div>
            <div className="text-xs text-muted-foreground mt-1">{t('stats.accepted')}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.sortedMonths.length > 0 && (
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm">{t('stats.monthlyTrend')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-end gap-2 h-24">
                {stats.sortedMonths.map(([month, count]) => {
                  const max = Math.max(...stats.sortedMonths.map(([, c]) => c))
                  const height = max > 0 ? (count / max) * 100 : 0
                  return (
                    <div key={month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-muted-foreground">{count}</span>
                      <div
                        className="w-full rounded-sm bg-primary/20 dark:bg-primary/30"
                        style={{ height: `${height}%`, minHeight: '4px' }}
                      />
                      <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                        {formatMonth(month)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

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
    </div>
  )
}
