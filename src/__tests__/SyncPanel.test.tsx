import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { SyncPanel } from '@/components/sync/SyncPanel'
import { renderWithProviders } from './test-utils'
import * as syncManager from '@/sync/syncManager'
import * as gist from '@/sync/gist'

vi.mock('@/sync/syncManager', () => ({
  loadSyncStorage: vi.fn(),
  saveSyncConfig: vi.fn(),
  clearSyncConfig: vi.fn(),
  pushToGist: vi.fn(),
  pullFromGist: vi.fn(),
}))

vi.mock('@/sync/gist', () => ({
  generatePairingCode: vi.fn(),
  decodePairingCode: vi.fn(),
}))

describe('SyncPanel', () => {
  const onOpenChange = vi.fn()
  const onSyncComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(syncManager.loadSyncStorage).mockResolvedValue({
      token: 'ghp_test',
      gistId: undefined,
    })
  })

  it('renders config tab when open', async () => {
    renderWithProviders(
      <SyncPanel open={true} onOpenChange={onOpenChange} onSyncComplete={onSyncComplete} />
    )
    await waitFor(() => {
      expect(screen.getByText('Configuration')).toBeInTheDocument()
    })
  })

  it('switches to pair tab', async () => {
    renderWithProviders(
      <SyncPanel open={true} onOpenChange={onOpenChange} onSyncComplete={onSyncComplete} />
    )
    await waitFor(() => {
      expect(screen.getByText('Configuration')).toBeInTheDocument()
    })

    const pairTab = screen.getByText('Pair Device')
    fireEvent.click(pairTab)
    expect(screen.getByText('Enter pairing code from another device')).toBeInTheDocument()
  })

  it('requires password for push', async () => {
    renderWithProviders(
      <SyncPanel open={true} onOpenChange={onOpenChange} onSyncComplete={onSyncComplete} />
    )

    await waitFor(() => {
      expect(screen.getByText('Save Config')).toBeInTheDocument()
    })

    const pushBtn = screen.getByText('Push to Gist')
    fireEvent.click(pushBtn)

    await waitFor(() => {
      expect(screen.getByText('Password is required for this operation.')).toBeInTheDocument()
    })
  })

  it('calls pushToGist with password', async () => {
    vi.mocked(syncManager.pushToGist).mockResolvedValueOnce(undefined)

    renderWithProviders(
      <SyncPanel open={true} onOpenChange={onOpenChange} onSyncComplete={onSyncComplete} />
    )

    await waitFor(() => {
      expect(screen.getByText('Save Config')).toBeInTheDocument()
    })

    const passwordInput = screen.getByLabelText('Encryption Password')
    fireEvent.change(passwordInput, { target: { value: 'mypassword' } })

    const pushBtn = screen.getByText('Push to Gist')
    fireEvent.click(pushBtn)

    await waitFor(() => {
      expect(syncManager.pushToGist).toHaveBeenCalledWith('mypassword')
    })
  })

  it('clears config', async () => {
    renderWithProviders(
      <SyncPanel open={true} onOpenChange={onOpenChange} onSyncComplete={onSyncComplete} />
    )

    await waitFor(() => {
      expect(screen.getByText('Save Config')).toBeInTheDocument()
    })

    const clearBtn = screen.getByText('Clear Config')
    fireEvent.click(clearBtn)

    await waitFor(() => {
      expect(syncManager.clearSyncConfig).toHaveBeenCalled()
    })
  })

  it('generates pairing code', async () => {
    vi.mocked(gist.generatePairingCode).mockReturnValue('pair-code-123')

    renderWithProviders(
      <SyncPanel open={true} onOpenChange={onOpenChange} onSyncComplete={onSyncComplete} />
    )

    await waitFor(() => {
      expect(screen.getByText('Save Config')).toBeInTheDocument()
    })

    const passwordInput = screen.getByLabelText('Encryption Password')
    fireEvent.change(passwordInput, { target: { value: 'mypassword' } })

    const generateBtn = screen.getByText('Generate Pairing Code')
    fireEvent.click(generateBtn)

    await waitFor(() => {
      const pairCodeInput = screen.getByDisplayValue('pair-code-123')
      expect(pairCodeInput).toBeInTheDocument()
    })
  })
})
