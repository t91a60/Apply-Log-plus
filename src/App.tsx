import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApplications, useCreateApplication, useUpdateApplication, useDeleteApplication } from '@/hooks/useApplications'
import { ApplicationTable } from '@/components/applications/ApplicationTable'
import { ApplicationDialog } from '@/components/applications/ApplicationDialog'
import { Button } from '@/components/ui/button'
import type { Application } from '@/db/schema'

function App() {
  const { t } = useTranslation()
  const { data: applications = [], isLoading } = useApplications()
  const createMutation = useCreateApplication()
  const updateMutation = useUpdateApplication()
  const deleteMutation = useDeleteApplication()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingApp, setEditingApp] = useState<Application | null>(null)

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

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">{t('app.title')}</h1>
          <Button onClick={handleAdd}>{t('application.add')}</Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <ApplicationTable
            applications={applications}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </main>
      <ApplicationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        initialData={editingApp}
      />
    </div>
  )
}

export default App
