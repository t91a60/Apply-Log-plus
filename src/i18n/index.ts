import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

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
      },
    },
  },
  pl: {
    translation: {
      app: { title: 'Apply Log+' },
      application: {
        add: 'Dodaj aplikację',
        edit: 'Edytuj aplikację',
        delete: 'Usuń',
        company: 'Firma',
        role: 'Stanowisko',
        stage: 'Etap',
        date: 'Data',
        url: 'Link do oferty',
        notes: 'Notatki',
        location: 'Lokalizacja',
        salary: 'Wynagrodzenie',
        save: 'Zapisz',
        cancel: 'Anuluj',
        confirmDelete: 'Na pewno chcesz usunąć tę aplikację?',
        noApplications: 'Brak aplikacji. Dodaj pierwszą!',
        search: 'Szukaj firmy lub stanowiska...',
        filterStage: 'Filtruj po etapie',
        allStages: 'Wszystkie etapy',
        timeline: 'Historia',
        manageStages: 'Zarządzaj etapami',
        newStagePlaceholder: 'Nazwa nowego etapu...',
      },
      stage: {
        Applied: 'Aplikowano',
        'Phone Screen': 'Rozmowa tel.',
        Interview: 'Rozmowa',
        Technical: 'Techniczne',
        Offer: 'Oferta',
        Rejected: 'Odrzucono',
        Ghosted: 'Ghosted',
        Accepted: 'Przyjęto',
        Declined: 'Odrzucono przez Ciebie',
      },
      stats: {
        total: 'Wszystkie',
        active: 'Aktywne',
        rejected: 'Odrzucone',
      },
    },
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'pl',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
