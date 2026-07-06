import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Application } from '@/db/schema'
import { DefaultStages, defaultStageLabels } from '@/db/schema'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { StageBadge } from './StageBadge'
import { Timeline } from './Timeline'
import type { CustomStage } from '@/db/schema'

interface Props {
  applications: Application[]
  onEdit: (app: Application) => void
  onDelete: (id: string) => void
  customStages?: CustomStage[]
}

export function ApplicationTable({ applications, onEdit, onDelete, customStages = [] }: Props) {
  const { t, i18n } = useTranslation()
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const allStages = [...DefaultStages, ...customStages.map(s => s.name)]

  const filtered = useMemo(() => {
    return applications.filter(app => {
      const matchesSearch = !search
        || app.company.toLowerCase().includes(search.toLowerCase())
        || app.role.toLowerCase().includes(search.toLowerCase())
      const matchesStage = !stageFilter || app.currentStage === stageFilter
      return matchesSearch && matchesStage
    })
  }, [applications, search, stageFilter])

  const lang: 'en' | 'pl' = i18n.language === 'pl' ? 'pl' : 'en'

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function stageLabel(s: string) {
    if (s in defaultStageLabels) {
      return defaultStageLabels[s as keyof typeof defaultStageLabels][lang]
    }
    return s
  }

  function stageColor(s: string) {
    const c = customStages.find(cs => cs.name === s)
    return c?.color
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t('application.noApplications')}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder={t('application.search')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t('application.allStages')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('application.allStages')}</SelectItem>
              {allStages.map(s => (
                <SelectItem key={s} value={s}>
                  {stageLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-10 px-4 text-left text-sm font-medium">{t('application.company')}</th>
              <th className="h-10 px-4 text-left text-sm font-medium">{t('application.role')}</th>
              <th className="h-10 px-4 text-left text-sm font-medium">{t('application.stage')}</th>
              <th className="h-10 px-4 text-left text-sm font-medium">{t('application.date')}</th>
              <th className="h-10 px-4 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(app => (
              <tr key={app.id} className="border-b hover:bg-muted/50 transition-colors">
                <td className="p-4 text-sm font-medium">{app.company}</td>
                <td className="p-4 text-sm text-muted-foreground">{app.role}</td>
                <td className="p-4">
                  <StageBadge
                    stage={app.currentStage}
                    label={stageLabel(app.currentStage)}
                    customColor={stageColor(app.currentStage)}
                  />
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  {formatDate(app.createdAt)}
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(expandedId === app.id ? null : app.id!)}
                    >
                      {expandedId === app.id ? 'Hide' : 'Timeline'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onEdit(app)}>
                      {t('application.edit')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(app.id!)}>
                      {t('application.delete')}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {expandedId && (() => {
        const app = applications.find(a => a.id === expandedId)
        if (!app || app.timeline.length === 0) return null
        return (
          <div className="rounded-md border bg-muted/30 p-4">
            <Timeline timeline={app.timeline} lang={lang} />
          </div>
        )
      })()}
    </div>
  )
}
