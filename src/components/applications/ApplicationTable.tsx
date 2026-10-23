import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Application } from '@/db/schema'
import { DefaultStages, defaultStageLabels } from '@/db/schema'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
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
      <div role="status" className="rounded-lg border border-dashed px-4 py-12 text-center text-muted-foreground">
        {t('application.noApplications')}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-2">
          <label htmlFor="search-applications" className="text-sm font-medium">{t('application.searchLabel')}</label>
          <Input
            type="search"
            id="search-applications"
            name="search"
            autoComplete="off"
            placeholder={t('application.search')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full space-y-2 sm:w-52">
          <label htmlFor="filter-stage" className="text-sm font-medium">{t('application.filterStage')}</label>
          <Select id="filter-stage" value={stageFilter} onValueChange={setStageFilter}>
            <option value="">{t('application.allStages')}</option>
            {allStages.map(s => (
              <option key={s} value={s}>{stageLabel(s)}</option>
            ))}
          </Select>
        </div>
      </div>

      <p role="status" className="text-sm text-muted-foreground">{t('application.results', { count: filtered.length })}</p>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-8 text-center space-y-3">
          <p className="text-sm text-muted-foreground">{t('application.noResults')}</p>
          <Button variant="outline" onClick={() => { setSearch(''); setStageFilter('') }}>
            {t('application.clearFilters')}
          </Button>
        </div>
      ) : (
      <div className="rounded-lg border">
        <table role="table" className="block w-full lg:table lg:table-fixed">
          <caption className="sr-only">{t('application.listTitle')}</caption>
          <thead role="rowgroup" className="sr-only lg:not-sr-only lg:table-header-group">
            <tr role="row" className="border-b bg-muted/50">
              <th scope="col" className="h-11 px-4 text-left text-sm font-medium lg:w-[17%]">{t('application.company')}</th>
              <th scope="col" className="h-11 px-4 text-left text-sm font-medium lg:w-[18%]">{t('application.role')}</th>
              <th scope="col" className="h-11 px-4 text-left text-sm font-medium lg:w-[15%]">{t('application.stage')}</th>
              <th scope="col" className="h-11 px-4 text-left text-sm font-medium lg:w-[15%]">{t('application.date')}</th>
              <th scope="col" className="h-11 px-4 text-right text-sm font-medium lg:w-[35%]">{t('application.actions')}</th>
            </tr>
          </thead>
          <tbody role="rowgroup" className="block lg:table-row-group">
            {filtered.map(app => (
              <tr role="row" key={app.id} className="grid grid-cols-2 gap-3 border-b p-4 last:border-b-0 hover:bg-muted/50 transition-colors lg:table-row lg:p-0">
                <th role="rowheader" scope="row" className="col-span-2 min-w-0 text-left text-base font-semibold [overflow-wrap:anywhere] lg:p-4 lg:text-sm">
                  {app.company}
                </th>
                <td role="cell" className="col-span-2 min-w-0 text-sm text-muted-foreground [overflow-wrap:anywhere] lg:p-4">{app.role}</td>
                <td role="cell" className="min-w-0 lg:p-4">
                  <span aria-hidden="true" className="mb-1 block text-xs text-muted-foreground lg:hidden">{t('application.stage')}</span>
                  <StageBadge
                    stage={app.currentStage}
                    label={stageLabel(app.currentStage)}
                    customColor={stageColor(app.currentStage)}
                  />
                </td>
                <td role="cell" className="min-w-0 text-sm text-muted-foreground lg:p-4">
                  <span aria-hidden="true" className="mb-1 block text-xs lg:hidden">{t('application.date')}</span>
                  {formatDate(app.createdAt)}
                </td>
                <td role="cell" className="col-span-2 min-w-0 lg:p-3">
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-expanded={expandedId === app.id}
                      aria-controls={expandedId === app.id ? 'application-timeline' : undefined}
                      onClick={() => setExpandedId(expandedId === app.id ? null : app.id!)}
                    >
                      {expandedId === app.id ? t('application.hideTimeline') : t('application.timeline')}
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
      )}

      {expandedId && (() => {
        const app = applications.find(a => a.id === expandedId)
        if (!app || app.timeline.length === 0) return null
        return (
          <div id="application-timeline" className="rounded-md border bg-muted/30 p-4">
            <Timeline timeline={app.timeline} lang={lang} />
          </div>
        )
      })()}
    </div>
  )
}
