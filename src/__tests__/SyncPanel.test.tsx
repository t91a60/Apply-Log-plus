import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { SyncPanel } from '@/components/sync/SyncPanel'
import { clearSyncConfig, loadGistId, pullFromGist, pushToGist, SyncError } from '@/sync/syncManager'
import { renderWithProviders } from './test-utils'

vi.mock('@/sync/syncManager', async importOriginal => ({
  ...await importOriginal<typeof import('@/sync/syncManager')>(),
  loadGistId: vi.fn(), clearSyncConfig: vi.fn(), pullFromGist: vi.fn(), pushToGist: vi.fn(),
}))

const gistId = 'abc123'
const token = 'test token'
const password = 'test password only'

async function open() {
  const onSyncComplete = vi.fn(async () => {})
  renderWithProviders(<SyncPanel open onOpenChange={vi.fn()} onSyncComplete={onSyncComplete} />)
  const tokenInput = screen.getByLabelText('GitHub Personal Access Token')
  await waitFor(() => expect(tokenInput).toBeEnabled())
  const passwordInput = screen.getByLabelText('Encryption Password')
  fireEvent.change(tokenInput, { target: { value: token } })
  fireEvent.change(passwordInput, { target: { value: password } })
  return { onSyncComplete, tokenInput, passwordInput }
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(loadGistId).mockResolvedValue('')
})

describe('SyncPanel', () => {
  it('creates a snapshot only when requested and shows the returned ID', async () => {
    vi.mocked(pushToGist).mockResolvedValue(gistId)
    await open()
    expect(pushToGist).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Pull from Gist' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Push to Gist' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Data pushed to Gist successfully'))
    expect(pushToGist).toHaveBeenCalledWith(token, password, undefined)
    expect(screen.getByLabelText('Gist ID')).toHaveValue(gistId)
  })

  it('requires confirmation for a pull and refreshes data after success', async () => {
    vi.mocked(loadGistId).mockResolvedValue(gistId)
    const { onSyncComplete } = await open()
    const pull = screen.getByRole('button', { name: 'Pull from Gist' })
    expect(pull).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(pull)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Data pulled from Gist successfully'))
    expect(pullFromGist).toHaveBeenCalledWith(token, password, gistId)
    expect(onSyncComplete).toHaveBeenCalledTimes(1)
    expect(pull).toBeDisabled()
  })

  it('blocks non-IDs and clears the remembered ID and both inputs', async () => {
    const { tokenInput, passwordInput } = await open()
    const input = screen.getByLabelText('Gist ID')
    fireEvent.change(input, { target: { value: 'https://gist.github.com/example' } })
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('button', { name: 'Push to Gist' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Clear Config' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Configuration cleared'))
    expect(clearSyncConfig).toHaveBeenCalledTimes(1)
    expect(input).toHaveValue('')
    expect(tokenInput).toHaveValue('')
    expect(passwordInput).toHaveValue('')
  })

  it('reports a rejected pull without refreshing the UI', async () => {
    vi.mocked(loadGistId).mockResolvedValue(gistId)
    vi.mocked(pullFromGist).mockRejectedValue(new SyncError('localChanged'))
    const { onSyncComplete } = await open()
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Pull from Gist' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Nothing was replaced'))
    expect(onSyncComplete).not.toHaveBeenCalled()
  })
})
