import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StageEnum, stageLabels, type Application, type Stage } from '@/db/schema'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Partial<Application>) => void
  initialData?: Application | null
}

export function ApplicationDialog({ open, onOpenChange, onSubmit, initialData }: Props) {
  const { t } = useTranslation()
  const isEditing = !!initialData

  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [url, setUrl] = useState('')
  const [stage, setStage] = useState<Stage>('Applied')
  const [notes, setNotes] = useState('')
  const [location, setLocation] = useState('')
  const [salary, setSalary] = useState('')

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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('application.company')}</label>
              <Input value={company} onChange={e => setCompany(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('application.role')}</label>
              <Input value={role} onChange={e => setRole(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('application.url')}</label>
              <Input value={url} onChange={e => setUrl(e.target.value)} type="url" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('application.stage')}</label>
              <Select value={stage} onValueChange={v => setStage(v as Stage)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {StageEnum.options.map(s => (
                    <SelectItem key={s} value={s}>
                      {stageLabels[s as Stage][t('app.title') === 'Apply Log+' ? 'en' : 'pl'] ?? s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('application.location')}</label>
              <Input value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('application.salary')}</label>
              <Input value={salary} onChange={e => setSalary(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('application.notes')}</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
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
