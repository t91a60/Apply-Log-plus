import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApplications, useCreateApplication, useUpdateApplication, useDeleteApplication } from '@/hooks/useApplications'
import { useCustomStages, useAddCustomStage, useRemoveCustomStage } from '@/hooks/useCustomStages'
import { ApplicationTable } from '@/components/applications/ApplicationTable'
import { ApplicationDialog } from '@/components/applications/ApplicationDialog'
import { StatsCards } from '@/components/applications/StatsCards'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import type { Application } from '@/db/schema'

function App() {
  const { t } = useTranslation()
  const { data: applications = [], isLoading } = useApplications()
  const { data: customStages = [] } = useCustomStages()
  const createMutation = useCreateApplication()
  const updateMutation = useUpdateApplication()
  const deleteMutation = useDeleteApplication()
  const addStageMutation = useAddCustomStage()
  const removeStageMutation = useRemoveCustomStage()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingApp, setEditingApp] = useState<Application | null>(null)
  const [stageDialogOpen, setStageDialogOpen] = useState(false)
  const [newStageName, setNewStageName] = useState('')

  function handleAdd() {
    setEditingApp(null)
    setDialogOpen(true)
  }

  function handleEdit(app: Application) {
    setEditingApp(app)
    setDialogOpen(true)
  }

  function handleSubmit(data: Partial<Application>) {
    if (editingApp) {
      updateMutation.mutate(data as Application)
    } else {
      createMutation.mutate(data as Omit<Application, 'id' | 'createdAt' | 'updatedAt'>)
    }
  }

  function handleDelete(id: string) {
    if (window.confirm(t('application.confirmDelete'))) {
      deleteMutation.mutate(id)
    }
  }

  function handleAddStage() {
    if (!newStageName.trim()) return
    addStageMutation.mutate({ name: newStageName.trim() })
    setNewStageName('')
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">{t('app.title')}</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStageDialogOpen(true)}>
              {t('application.manageStages')}
            </Button>
            <Button onClick={handleAdd}>{t('application.add')}</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        {applications.length > 0 && <StatsCards applications={applications} />}

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <ApplicationTable
            applications={applications}
            onEdit={handleEdit}
            onDelete={handleDelete}
            customStages={customStages}
          />
        )}
      </main>

      <ApplicationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        initialData={editingApp}
        customStages={customStages}
      />

      <Dialog open={stageDialogOpen} onOpenChange={setStageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('application.manageStages')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newStageName}
                onChange={e => setNewStageName(e.target.value)}
                placeholder={t('application.newStagePlaceholder')}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddStage())}
              />
              <Button onClick={handleAddStage}>{t('application.add')}</Button>
            </div>
            {customStages.length > 0 && (
              <div className="space-y-2">
                {customStages.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-2 rounded-md border">
                    <span className="text-sm">{s.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStageMutation.mutate(s.id!)}
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
    </div>
  )
}

export default App
