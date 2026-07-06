import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  loadSyncStorage, saveSyncConfig, clearSyncConfig,
  pushToGist, pullFromGist,
} from '@/sync/syncManager'
import { generatePairingCode, decodePairingCode } from '@/sync/gist'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSyncComplete: () => void
}

export function SyncPanel({ open, onOpenChange, onSyncComplete }: Props) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<'config' | 'pair'>('config')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [gistId, setGistId] = useState('')
  const [pairCode, setPairCode] = useState('')
  const [showPairCode, setShowPairCode] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [isConfigured, setIsConfigured] = useState(false)

  useEffect(() => {
    if (open) {
      setPassword('')
      setPairCode('')
      setStatus(null)
      loadSyncStorage().then(storage => {
        if (storage) {
          setToken(storage.token)
          setGistId(storage.gistId ?? '')
          setIsConfigured(true)
        }
      })
    }
  }, [open])

  async function handleSave() {
    if (!token.trim()) return
    await saveSyncConfig({
      token: token.trim(),
      gistId: gistId.trim() || undefined,
    })
    setIsConfigured(true)
    setStatus(t('sync.configSaved'))
  }

  async function handlePush() {
    if (!password) {
      setStatus(t('sync.passwordRequired'))
      return
    }
    setStatus(t('sync.syncing'))
    try {
      await pushToGist(password)
      setStatus(t('sync.pushSuccess'))
      onSyncComplete()
    } catch (e) {
      setStatus(`${t('sync.error')}: ${(e as Error).message}`)
    }
  }

  async function handlePull() {
    if (!password) {
      setStatus(t('sync.passwordRequired'))
      return
    }
    setStatus(t('sync.syncing'))
    try {
      await pullFromGist(password)
      setStatus(t('sync.pullSuccess'))
      onSyncComplete()
    } catch (e) {
      setStatus(`${t('sync.error')}: ${(e as Error).message}`)
    }
  }

  async function handleClear() {
    await clearSyncConfig()
    setToken('')
    setPassword('')
    setGistId('')
    setIsConfigured(false)
    setStatus(t('sync.configCleared'))
  }

  function handleGenerateCode() {
    if (!password) {
      setStatus(t('sync.passwordRequired'))
      return
    }
    const code = generatePairingCode({
      token,
      password,
      gistId: gistId || undefined,
    })
    setPairCode(code)
  }

  async function handleDecodeCode() {
    try {
      const config = decodePairingCode(pairCode)
      setToken(config.token)
      setPassword(config.password)
      setGistId(config.gistId ?? '')
      await saveSyncConfig({ token: config.token, gistId: config.gistId })
      setIsConfigured(true)
      setStatus(t('sync.pairSuccess'))
    } catch {
      setStatus(t('sync.invalidCode'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('sync.title')}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            variant={tab === 'config' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('config')}
          >
            {t('sync.config')}
          </Button>
          <Button
            variant={tab === 'pair' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('pair')}
          >
            {t('sync.pair')}
          </Button>
        </div>

        {tab === 'config' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="sync-token" className="text-sm font-medium">GitHub Personal Access Token</label>
              <Input
                id="sync-token"
                name="sync-token"
                type="password"
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="ghp_..."
              />
              <p className="text-xs text-muted-foreground">{t('sync.tokenHint')}</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="sync-password" className="text-sm font-medium">{t('sync.password')}</label>
              <Input
                id="sync-password"
                name="sync-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t('sync.passwordHint')}
              />
              <p className="text-xs text-muted-foreground">{t('sync.passwordSessionHint')}</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="sync-gist-id" className="text-sm font-medium">Gist ID ({t('sync.optional')})</label>
              <Input
                id="sync-gist-id"
                name="sync-gist-id"
                value={gistId}
                onChange={e => setGistId(e.target.value)}
                placeholder={t('sync.gistHint')}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={!token.trim()}>
                {t('sync.saveConfig')}
              </Button>
              {isConfigured && (
                <>
                  <Button variant="secondary" onClick={handlePush}>
                    {t('sync.push')}
                  </Button>
                  <Button variant="secondary" onClick={handlePull}>
                    {t('sync.pull')}
                  </Button>
                  <Button variant="destructive" onClick={handleClear} size="sm">
                    {t('sync.clear')}
                  </Button>
                </>
              )}
            </div>

            {isConfigured && (
              <div className="pt-2">
                <Button variant="outline" size="sm" onClick={handleGenerateCode}>
                  {t('sync.generateCode')}
                </Button>
                {pairCode && (
                  <div className="mt-2 space-y-1">
                    <label htmlFor="sync-pair-code" className="text-xs text-muted-foreground">{t('sync.pairCode')}</label>
                    <div className="flex gap-2">
                      <Input
                        id="sync-pair-code"
                        name="sync-pair-code"
                        type={showPairCode ? 'text' : 'password'}
                        value={pairCode}
                        readOnly
                        className="text-xs font-mono flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPairCode(!showPairCode)}
                      >
                        {showPairCode ? t('sync.hide') : t('sync.show')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'pair' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="sync-enter-code" className="text-sm font-medium">{t('sync.enterCode')}</label>
              <textarea
                id="sync-enter-code"
                name="sync-enter-code"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={pairCode}
                onChange={e => setPairCode(e.target.value)}
                placeholder={t('sync.codePlaceholder')}
              />
            </div>
            <Button onClick={handleDecodeCode} disabled={!pairCode}>
              {t('sync.connect')}
            </Button>
          </div>
        )}

        {status && (
          <div className="mt-4 text-sm text-muted-foreground border-t pt-3">
            {status}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
