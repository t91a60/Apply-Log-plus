import { type ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { I18nextProvider } from 'react-i18next'

const resources = {
  en: {
    translation: {
      app: { title: 'Apply Log+' },
      application: {
        add: 'Add Application',
        edit: 'Edit Application',
        delete: 'Delete',
        company: 'Company',
        role: 'Role',
        stage: 'Stage',
        date: 'Date',
        url: 'Link to offer',
        notes: 'Notes',
        location: 'Location',
        salary: 'Salary',
        save: 'Save',
        cancel: 'Cancel',
        confirmDelete: 'Are you sure you want to delete this application?',
        noApplications: 'No applications yet. Add your first one!',
        search: 'Search company or role...',
        filterStage: 'Filter by stage',
        allStages: 'All stages',
        timeline: 'Timeline',
        manageStages: 'Manage Stages',
        newStagePlaceholder: 'New stage name...',
        importMeta: 'Import',
        importError: 'Could not fetch preview from this URL',
        duplicateWarning: 'This company and role already exist in your list ({{company}} — {{role}}).',
        repostedWarning: 'Found {{count}} job postings that may be reposted.',
        staleWarning: '{{count}} application(s) have not been updated in over 14 days.',
        ghostedWarning: '{{count}} application(s) have not heard back in over 30 days.',
        exportJson: 'Export JSON',
        exportCsv: 'Export CSV',
      },
      stage: {
        Applied: 'Applied',
        'Phone Screen': 'Phone Screen',
        Interview: 'Interview',
        Technical: 'Technical',
        Offer: 'Offer',
        Rejected: 'Rejected',
        Ghosted: 'Ghosted',
        Accepted: 'Accepted',
        Declined: 'Declined',
      },
      stats: {
        total: 'Total',
        active: 'Active',
        rejected: 'Rejected',
        offers: 'Offers',
        accepted: 'Accepted',
        monthlyTrend: 'Monthly Trend',
        avgResponse: 'Avg. Response Time',
        days: 'days',
      },
      sync: {
        title: 'Sync',
        config: 'Configuration',
        pair: 'Pair Device',
        password: 'Encryption Password',
        passwordHint: 'Enter a strong password',
        passwordSessionHint: 'Not saved',
        passwordRequired: 'Password is required for this operation.',
        tokenHint: 'Minimal scope: gist',
        optional: 'optional',
        saveConfig: 'Save Config',
        push: 'Push to Gist',
        pull: 'Pull from Gist',
        clear: 'Clear Config',
        show: 'Show',
        hide: 'Hide',
        generateCode: 'Generate Pairing Code',
        pairCode: 'Pairing code',
        enterCode: 'Enter pairing code from another device',
        codePlaceholder: 'Paste pairing code here...',
        connect: 'Connect',
        configSaved: 'Configuration saved',
        configCleared: 'Configuration cleared',
        syncing: 'Syncing...',
        pushSuccess: 'Data pushed to Gist successfully',
        pullSuccess: 'Data pulled from Gist successfully',
        pairSuccess: 'Device paired successfully',
        invalidCode: 'Invalid pairing code',
        error: 'Sync error',
      },
    },
  },
}

const testI18n = i18n.createInstance()
testI18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

interface WrapperOptions {
  queryClient?: QueryClient
}

export function renderWithProviders(
  ui: ReactNode,
  options?: RenderOptions & WrapperOptions,
) {
  const queryClient = options?.queryClient ?? createTestQueryClient()

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={testI18n}>
          {children}
        </I18nextProvider>
      </QueryClientProvider>
    )
  }

  return { ...render(ui, { wrapper: Wrapper, ...options }), queryClient }
}

export { testI18n, createTestQueryClient }
