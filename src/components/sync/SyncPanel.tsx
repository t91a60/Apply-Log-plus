import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { clearSyncConfig, loadGistId, MIN_NEW_PASSWORD_LENGTH, pullFromGist, pushToGist, SyncError } from '@/sync/syncManager'
import { isGistId } from '@/sync/gist'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSyncComplete: () => Promise<void>
}

export function SyncPanel({ open, onOpenChange, onSyncComplete }: Props) {
  const { t } = useTranslation()
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [gistId, setGistId] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)

  useEffect(() => {
    if (!open) return
    let active = true
    void loadGistId().then(id => {
      if (active) setGistId(id)
    }).catch(() => {
      if (active) setStatus('error')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [open])

  const id = gistId.trim()
  const invalidId = !!id && !isGistId(id)
  const locked = loading || busy
  const ready = !locked && !!token.trim() && !!password && !invalidId && (!id || confirm)

  async function run(action: 'push' | 'pull' | 'clear') {
    if (inFlight.current || locked || (action !== 'clear' && !ready) || (action === 'pull' && !id)) return
    inFlight.current = true
    setBusy(true)
    setStatus('syncing')
    try {
      if (action === 'clear') {
        await clearSyncConfig()
        setGistId('')
        setToken('')
        setPassword('')
        setStatus('configCleared')
      } else if (action === 'push') {
        setGistId(await pushToGist(token.trim(), password, id || undefined))
        setStatus('pushSuccess')
      } else {
        await pullFromGist(token.trim(), password, id)
        await onSyncComplete()
        setStatus('pullSuccess')
      }
    } catch (error) {
      setStatus(error instanceof SyncError ? error.reason : 'error')
    } finally {
      inFlight.current = false
      setConfirm(false)
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={next => { if (!inFlight.current) onOpenChange(next) }}>
      <DialogContent className="[overflow-wrap:anywhere]">
        <DialogHeader><DialogTitle>{t('sync.title')}</DialogTitle></DialogHeader>
        <p className="mb-4 text-sm text-muted-foreground">{t('sync.description')}</p>
        <form onSubmit={event => event.preventDefault()}>
          <fieldset disabled={locked} className="min-w-0 space-y-4">
            <div className="space-y-2">
              <label htmlFor="sync-token" className="text-sm font-medium">GitHub Personal Access Token</label>
              <Input id="sync-token" type="password" autoComplete="off" value={token} onChange={event => setToken(event.target.value)} />
              <p className="text-xs text-muted-foreground">{t('sync.tokenHint')}</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="sync-password" className="text-sm font-medium">{t('sync.password')}</label>
              <Input id="sync-password" type="password" autoComplete="off" value={password} onChange={event => setPassword(event.target.value)} />
              {!id && <p className="text-xs text-muted-foreground">{t('sync.shortPassword', { length: MIN_NEW_PASSWORD_LENGTH })}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="sync-gist-id" className="text-sm font-medium">Gist ID</label>
              <Input id="sync-gist-id" autoComplete="off" aria-invalid={invalidId} value={gistId}
                onChange={event => { setGistId(event.target.value); setConfirm(false) }} />
              <p className="text-xs text-muted-foreground">{t(invalidId ? 'sync.invalidId' : 'sync.gistHint')}</p>
            </div>
            {id && !invalidId && (
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1 shrink-0" checked={confirm} onChange={event => setConfirm(event.target.checked)} />
                {t('sync.confirmOverwrite')}
              </label>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => void run('push')} disabled={!ready}>{t('sync.push')}</Button>
              <Button type="button" variant="secondary" onClick={() => void run('pull')} disabled={!ready || !id}>{t('sync.pull')}</Button>
              <Button type="button" variant="outline" onClick={() => void run('clear')} disabled={locked}>{t('sync.clear')}</Button>
            </div>
          </fieldset>
        </form>
        {status && <p role="status" className="mt-4 border-t pt-3 text-sm [overflow-wrap:anywhere]">{t(`sync.${status}`, { length: MIN_NEW_PASSWORD_LENGTH })}</p>}
      </DialogContent>
    </Dialog>
  )
}
