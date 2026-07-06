import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { DefaultStages, defaultStageLabels, type Application, type CustomStage } from '@/db/schema'
import { useDuplicateDetection } from '@/hooks/useDuplicateDetection'
import { fetchUrlMetadata } from '@/lib/urlMetadata'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Timeline } from './Timeline'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Partial<Application>) => void
  initialData?: Application | null
  customStages?: CustomStage[]
  allApplications?: Application[]
}

export function ApplicationDialog({ open, onOpenChange, onSubmit, initialData, customStages = [], allApplications = [] }: Props) {
  const { t, i18n } = useTranslation()
  const isEditing = !!initialData
  const lang: 'en' | 'pl' = i18n.language === 'pl' ? 'pl' : 'en'

  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [url, setUrl] = useState('')
  const [stage, setStage] = useState('Applied')
  const [notes, setNotes] = useState('')
  const [location, setLocation] = useState('')
  const [salary, setSalary] = useState('')
  const [importingUrl, setImportingUrl] = useState(false)
  const [importError, setImportError] = useState(false)

  const duplicate = useDuplicateDetection(
    allApplications,
    company,
    role,
    initialData?.id,
  )

  const allStages = [...DefaultStages, ...customStages.map(s => s.name)]

  function stageLabel(s: string) {
    if (s in defaultStageLabels) {
      return defaultStageLabels[s as keyof typeof defaultStageLabels][lang]
    }
    return s
  }

  useEffect(() => {
    if (initialData) {
      setCompany(initialData.company)
      setRole(initialData.role)
      setUrl(initialData.url ?? '')
      setStage(initialData.currentStage)
      setNotes(initialData.notes ?? '')
      setLocation(initialData.location ?? '')
      setSalary(initialData.salary ?? '')
    } else {
      setCompany('')
      setRole('')
      setUrl('')
      setStage('Applied')
      setNotes('')
      setLocation('')
      setSalary('')
    }
  }, [initialData, open])

  const handleImportUrl = useCallback(async () => {
    if (!url.trim()) return
    setImportError(false)
    setImportingUrl(true)
    try {
      const result = await fetchUrlMetadata(url.trim())
      if (!result.success || (!result.data.title && !result.data.siteName)) {
        setImportError(true)
        return
      }
      const meta = result.data
      if (meta.title && !role) {
        setRole(meta.title.replace(/ - .*| \| .*| – .*/g, '').trim())
      }
      if (meta.siteName && !company) {
        setCompany(meta.siteName)
      }
      if (meta.description && !notes) {
        setNotes(meta.description)
      }
    } finally {
      setImportingUrl(false)
    }
  }, [url, role, company, notes])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!company.trim() || !role.trim()) return

    const now = new Date().toISOString()
    const data: Partial<Application> = {
      company: company.trim(),
      role: role.trim(),
      url: url.trim(),
      currentStage: stage,
      notes: notes.trim(),
      location: location.trim(),
      salary: salary.trim(),
      updatedAt: now,
    }

    if (isEditing && initialData?.id) {
      data.id = initialData.id
      data.createdAt = initialData.createdAt
      data.timeline = initialData.timeline

      if (stage !== initialData.currentStage) {
        data.timeline = [
          ...initialData.timeline,
          { stage, date: now },
        ]
      }
    }

    if (!isEditing) {
      data.timeline = [{ stage, date: now }]
      data.createdAt = now
    }

    onSubmit(data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? t('application.edit') : t('application.add')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {duplicate && !isEditing && (
            <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
              {t('application.duplicateWarning', { company: duplicate.company, role: duplicate.role })}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="add-company" className="text-sm font-medium">{t('application.company')}</label>
              <Input id="add-company" name="company" autoComplete="organization" value={company} onChange={e => setCompany(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="add-role" className="text-sm font-medium">{t('application.role')}</label>
              <Input id="add-role" name="role" autoComplete="organization-title" value={role} onChange={e => setRole(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="add-url" className="text-sm font-medium">{t('application.url')}</label>
              <div className="flex gap-2">
                <Input id="add-url" name="url" autoComplete="url" value={url} onChange={e => setUrl(e.target.value)} type="url" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleImportUrl}
                  disabled={importingUrl || !url.trim()}
                >
                  {importingUrl ? '...' : t('application.importMeta')}
                </Button>
              </div>
              {importError && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {t('application.importError')}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="add-stage" className="text-sm font-medium">{t('application.stage')}</label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger id="add-stage" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allStages.map(s => (
                    <SelectItem key={s} value={s}>
                      {stageLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="add-location" className="text-sm font-medium">{t('application.location')}</label>
              <Input id="add-location" name="location" autoComplete="address-level2" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label htmlFor="add-salary" className="text-sm font-medium">{t('application.salary')}</label>
              <Input id="add-salary" name="salary" autoComplete="off" value={salary} onChange={e => setSalary(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="add-notes" className="text-sm font-medium">{t('application.notes')}</label>
            <textarea
              id="add-notes"
              name="notes"
              autoComplete="off"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {isEditing && initialData && initialData.timeline.length > 0 && (
            <Timeline timeline={initialData.timeline} lang={lang} />
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('application.cancel')}
            </Button>
            <Button type="submit">{t('application.save')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
