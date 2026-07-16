import { describe, it, expect, vi, beforeEach } from 'vitest'
import { downloadFile } from '@/lib/export'

describe('downloadFile', () => {
  let createObjectURL: any
  let revokeObjectURL: any

  beforeEach(() => {
    createObjectURL = vi.fn(() => 'blob:test')
    revokeObjectURL = vi.fn()
    window.URL.createObjectURL = createObjectURL
    window.URL.revokeObjectURL = revokeObjectURL
  })

  it('creates a blob and triggers download', () => {
    const clickSpy = vi.fn()
    const anchor = { href: '', download: '', click: clickSpy }
    vi.spyOn(document, 'createElement').mockReturnValue(anchor as any)

    downloadFile('test content', 'file.json', 'application/json')

    expect(createObjectURL).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalled()
  })
})
