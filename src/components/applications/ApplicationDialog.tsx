import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { DefaultStages, getStageLabel, type Application, type CustomStage } from '@/db/schema'
import { useDuplicateDetection } from '@/hooks/useDuplicateDetection'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Timeline } from './Timeline'
import { getOfferHref } from '@/lib/offerUrl'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Application) => void | Promise<unknown>
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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const duplicate = useDuplicateDetection(
    allApplications,
    company,
    role,
    initialData?.id,
  )

  const allStages = [...new Set([...DefaultStages, ...customStages.map(s => s.name), stage])]

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
    setError('')
  }, [initialData, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving || !company.trim() || !role.trim()) return
    const link = url.trim()
    if (link && !getOfferHref(link) && link !== initialData?.url) {
      setError('urlError')
      return
    }

    const now = new Date().toISOString()
    const data: Application = {
      id: initialData?.id,
      company: company.trim(),
      role: role.trim(),
      url: link,
      currentStage: stage,
      notes: notes.trim(),
      location: location.trim(),
      salary: salary.trim(),
      updatedAt: now,
      createdAt: initialData?.createdAt ?? now,
      timeline: initialData?.timeline ?? [],
    }

    if (!initialData || stage !== initialData.currentStage) {
      data.timeline = [...data.timeline, { stage, date: now }]
    }

    setSaving(true)
    setError('')
    try {
      await onSubmit(data)
      onOpenChange(false)
    } catch {
      setError('saveError')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={next => { if (!saving) onOpenChange(next) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? t('application.edit') : t('application.add')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={event => void handleSubmit(event)}>
          <fieldset disabled={saving} className="min-w-0 space-y-4 [overflow-wrap:anywhere]">
          {duplicate && !isEditing && (
            <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
              {t('application.duplicateWarning', { company: duplicate.company, role: duplicate.role })}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="add-company" className="text-sm font-medium">{t('application.company')}</label>
              <Input id="add-company" name="company" autoComplete="organization" value={company} onChange={e => setCompany(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="add-role" className="text-sm font-medium">{t('application.role')}</label>
              <Input id="add-role" name="role" autoComplete="organization-title" value={role} onChange={e => setRole(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <label htmlFor="add-url" className="text-sm font-medium">{t('application.url')}</label>
              <Input id="add-url" name="url" autoComplete="url" value={url} onChange={e => setUrl(e.target.value)} type="url" />
            </div>
            <div className="space-y-2">
              <label htmlFor="add-stage" className="text-sm font-medium">{t('application.stage')}</label>
              <Select id="add-stage" name="stage" value={stage} onValueChange={setStage}>
                {allStages.map(s => (
                  <option key={s} value={s}>{getStageLabel(s, lang)}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {isEditing && initialData && initialData.timeline.length > 0 && (
            <Timeline timeline={initialData.timeline} lang={lang} />
          )}

          {error && <p role="alert" className="text-sm text-destructive">{t(`application.${error}`)}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('application.cancel')}
            </Button>
            <Button type="submit">{t('application.save')}</Button>
          </div>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  )
}
