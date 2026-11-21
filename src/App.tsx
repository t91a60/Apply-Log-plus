import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useApplications, useCreateApplication, useUpdateApplication, useDeleteApplication } from '@/hooks/useApplications'
import { useCustomStages, useAddCustomStage, useRemoveCustomStage } from '@/hooks/useCustomStages'
import { useStaleApplications, useGhostedApplications } from '@/hooks/useStaleApplications'
import { useRepostedOffers } from '@/hooks/useDuplicateDetection'
import { ApplicationTable } from '@/components/applications/ApplicationTable'
import { ApplicationDialog } from '@/components/applications/ApplicationDialog'
import { StatsCards } from '@/components/applications/StatsCards'
import { SyncPanel } from '@/components/sync/SyncPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { exportToJson, exportToCsv, downloadFile } from '@/lib/export'
import { MAX_BACKUP_BYTES, parseSnapshot, readLocalSnapshot, replaceLocalSnapshot, type Snapshot } from '@/db/snapshot'
import { setLanguage } from '@/i18n'
import type { Application, RecordId } from '@/db/schema'

function App() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const { data: applications = [], isLoading, isError, refetch } = useApplications()
  const { data: customStages = [] } = useCustomStages()
  const createMutation = useCreateApplication()
  const updateMutation = useUpdateApplication()
  const deleteMutation = useDeleteApplication()
  const addStageMutation = useAddCustomStage()
  const removeStageMutation = useRemoveCustomStage()

  const staleApps = useStaleApplications(applications)
  const ghostedApps = useGhostedApplications(applications)
  const reposted = useRepostedOffers(applications)
  const lang: 'en' | 'pl' = i18n.language === 'pl' ? 'pl' : 'en'

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingApp, setEditingApp] = useState<Application | null>(null)
  const [stageDialogOpen, setStageDialogOpen] = useState(false)
  const [newStageName, setNewStageName] = useState('')
  const [syncPanelOpen, setSyncPanelOpen] = useState(false)
  const [writeError, setWriteError] = useState('')
  const [stageError, setStageError] = useState('')
  const [backup, setBackup] = useState<{ data: Snapshot; expected: string } | null>(null)
  const [backupBusy, setBackupBusy] = useState(false)
  const [backupStatus, setBackupStatus] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  function handleAdd() {
    setEditingApp(null)
    setDialogOpen(true)
  }

  function handleEdit(app: Application) {
    setEditingApp(app)
    setDialogOpen(true)
  }

  function handleSubmit(data: Application) {
    return editingApp ? updateMutation.mutateAsync(data) : createMutation.mutateAsync(data)
  }

  function handleDelete(id: RecordId) {
    setWriteError('')
    if (window.confirm(t('application.confirmDelete'))) {
      deleteMutation.mutate(id, { onError: () => setWriteError('deleteError') })
    }
  }

  function handleAddStage() {
    if (!newStageName.trim() || addStageMutation.isPending) return
    setStageError('')
    addStageMutation.mutate({ name: newStageName }, {
      onSuccess: () => setNewStageName(''),
      onError: () => setStageError('stageError'),
    })
  }

  async function refreshLocalData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['applications'] }),
      queryClient.invalidateQueries({ queryKey: ['customStages'] }),
    ])
  }

  async function handleExport(format: 'json' | 'csv') {
    setBackupStatus('')
    try {
      const data = await readLocalSnapshot()
      if (format === 'json') {
        downloadFile(exportToJson(data.applications, data.customStages), 'apply-log-plus-export.json', 'application/json')
      } else {
        downloadFile(exportToCsv(data.applications, lang), 'apply-log-plus-export.csv', 'text/csv')
      }
    } catch {
      setBackupStatus('exportError')
    }
  }

  async function readBackup(file: File) {
    setBackupBusy(true)
    setBackupStatus('')
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error('Backup too large')
      const data = parseSnapshot(await file.text())
      const expected = JSON.stringify(await readLocalSnapshot())
      setBackup({ data, expected })
    } catch {
      setBackupStatus('invalid')
    } finally {
      setBackupBusy(false)
    }
  }

  async function restoreBackup() {
    if (!backup || backupBusy) return
    setBackupBusy(true)
    try {
      await replaceLocalSnapshot(backup.data, backup.expected)
      await refreshLocalData()
      setBackupStatus('restored')
    } catch {
      setBackupStatus('restoreError')
    } finally {
      setBackup(null)
      setBackupBusy(false)
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-xl font-semibold tracking-tight">{t('app.title')}</h1>
          <div className="flex flex-wrap gap-2">
            <Select className="lg:w-auto" aria-label={t('app.language')} value={lang} onValueChange={value => {
              if (value === 'pl' || value === 'en') setLanguage(i18n, value)
            }}>
              <option value="pl">Polski</option>
              <option value="en">English</option>
            </Select>
            <Button variant="outline" onClick={() => setSyncPanelOpen(true)}>
              {t('sync.title')}
            </Button>
            <Button variant="outline" onClick={() => setStageDialogOpen(true)}>
              {t('application.manageStages')}
            </Button>
            <Button onClick={handleAdd}>{t('application.add')}</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6 sm:py-8 sm:space-y-8">
        {writeError && <p role="alert" className="text-sm text-destructive">{t(`application.${writeError}`)}</p>}
        {backupStatus && <p role={backupStatus === 'restored' ? 'status' : 'alert'} className="text-sm">{t(`backup.${backupStatus}`)}</p>}
        {reposted.length > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 px-4 py-3">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {t('application.repostedWarning', { count: reposted.length })}
            </p>
          </div>
        )}

        {staleApps.length > 0 && (
          <div className="rounded-md border border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800 px-4 py-3">
            <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
              {t('application.staleWarning', { count: staleApps.length })}
            </p>
          </div>
        )}

        {ghostedApps.length > 0 && (
          <div className="rounded-md border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 px-4 py-3">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {t('application.ghostedWarning', { count: ghostedApps.length })}
            </p>
          </div>
        )}

        {!isError && applications.length > 0 && <StatsCards applications={applications} />}

        {isLoading ? (
          <div role="status" className="text-center py-12 text-muted-foreground">{t('application.loading')}</div>
        ) : isError ? (
          <div role="alert" className="rounded-lg border px-4 py-8 text-center space-y-4">
            <p className="font-medium">{t('application.loadError')}</p>
            <p className="text-sm text-muted-foreground">{t('application.loadErrorHint')}</p>
            <Button variant="outline" onClick={() => void refetch()}>{t('common.retry')}</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => void handleExport('json')}>
                {t('application.exportJson')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => void handleExport('csv')}>
                {t('application.exportCsv')}
              </Button>
              <Button variant="outline" size="sm" disabled={backupBusy} onClick={() => fileInput.current?.click()}>
                {t('backup.open')}
              </Button>
              <input ref={fileInput} type="file" accept=".json,application/json" hidden aria-label={t('backup.open')}
                onChange={event => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (file) void readBackup(file)
                }} />
            </div>
            <ApplicationTable
              applications={applications}
              onEdit={handleEdit}
              onDelete={handleDelete}
              customStages={customStages}
            />
          </div>
        )}
      </main>

      <ApplicationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        initialData={editingApp}
        customStages={customStages}
        allApplications={applications}
      />

      <Dialog open={stageDialogOpen} onOpenChange={setStageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('application.manageStages')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="new-stage-name" className="text-sm font-medium">{t('application.newStageName')}</label>
              <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="new-stage-name"
                name="new-stage-name"
                autoComplete="off"
                value={newStageName}
                onChange={e => setNewStageName(e.target.value)}
                placeholder={t('application.newStagePlaceholder')}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddStage())}
              />
              <Button onClick={handleAddStage} disabled={!newStageName.trim() || addStageMutation.isPending}>{t('application.addStage')}</Button>
              </div>
            </div>
            {stageError && <p role="alert" className="text-sm text-destructive">{t(`application.${stageError}`)}</p>}
            {customStages.length > 0 && (
              <div className="space-y-2">
                {customStages.map(s => (
                  <div key={`${typeof s.id}:${s.id}`} className="flex items-center justify-between p-2 rounded-md border">
                    <span className="min-w-0 text-sm [overflow-wrap:anywhere]">{s.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (s.id === undefined) return
                        setStageError('')
                        removeStageMutation.mutate(s.id, { onError: () => setStageError('deleteError') })
                      }}
                    >
                      {t('application.delete')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={backup !== null} onOpenChange={open => { if (!open && !backupBusy) setBackup(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('backup.open')}</DialogTitle></DialogHeader>
          {backup && <p className="text-sm">{t('backup.confirm', {
            applications: backup.data.applications.length, stages: backup.data.customStages.length,
          })}</p>}
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button variant="outline" disabled={backupBusy} onClick={() => setBackup(null)}>{t('application.cancel')}</Button>
            <Button variant="destructive" disabled={backupBusy} onClick={() => void restoreBackup()}>{t('backup.apply')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {syncPanelOpen && <SyncPanel open onOpenChange={setSyncPanelOpen} onSyncComplete={refreshLocalData} />}
    </div>
  )
}

export default App
