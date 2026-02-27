// ** React Imports
import { createContext, useContext, useState, ReactNode } from 'react'

// ** Types
import {
  MailStore,
  UpdateMailParamsType,
  UpdateMailLabelType,
  FetchMailParamsType,
  MailType
} from 'src/types/apps/emailTypes'

interface EmailStore extends MailStore {
  mails: MailType[]
  selectedMails: number[]
}

interface EmailContextType {
  emails: EmailStore
  fetchMails: (params: FetchMailParamsType) => void
  updateMail: (data: UpdateMailParamsType) => void
  selectMail: (id: number) => void
  selectAllMail: () => void
  deselectAllMail: () => void
  getCurrentMail: (id: number) => void
  updateMailLabel: (data: UpdateMailLabelType) => void
  handleSelectAllMail: (value: boolean) => void
}

const EmailContext = createContext<EmailContextType | undefined>(undefined)

type Props = {
  children: ReactNode
}

const EmailProvider = ({ children }: Props) => {
  const [emails, setEmails] = useState<EmailStore>({
    mails: [],
    selectedMails: [],
    currentMail: null,
    mailMeta: null,
    filter: { q: '', label: '', folder: '' }
  })

  const fetchMails = async (params: FetchMailParamsType) => {
    try {
      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })

      if (response.ok) {
        const data = await response.json()
        setEmails(prev => ({
          ...prev,
          mails: data.mails || [],
          filter: { q: params.q, label: params.label, folder: params.folder }
        }))
      }
    } catch (error) {
      console.error('Failed to fetch mails:', error)
    }
  }

  const updateMail = (data: UpdateMailParamsType) => {
    setEmails(prev => ({
      ...prev,
      mails:
        prev.mails?.map(mail =>
          Array.isArray(data.emailIds)
            ? data.emailIds.includes(mail.id)
              ? { ...mail, ...data.dataToUpdate }
              : mail
            : mail.id === data.emailIds
            ? { ...mail, ...data.dataToUpdate }
            : mail
        ) || [],
      currentMail:
        prev.currentMail &&
        (Array.isArray(data.emailIds)
          ? data.emailIds.includes(prev.currentMail.id)
          : prev.currentMail.id === data.emailIds)
          ? { ...prev.currentMail, ...data.dataToUpdate }
          : prev.currentMail
    }))
  }

  const selectMail = (id: number) => {
    setEmails(prev => ({
      ...prev,
      selectedMails: prev.selectedMails.includes(id)
        ? prev.selectedMails.filter(mailId => mailId !== id)
        : [...prev.selectedMails, id]
    }))
  }

  const selectAllMail = () => {
    setEmails(prev => ({
      ...prev,
      selectedMails: prev.mails ? prev.mails.map(mail => mail.id) : []
    }))
  }

  const deselectAllMail = () => {
    setEmails(prev => ({ ...prev, selectedMails: [] }))
  }

  const getCurrentMail = (id: number) => {
    const mail = emails.mails?.find(m => m.id === id)
    setEmails(prev => ({ ...prev, currentMail: mail || null }))
  }

  const updateMailLabel = (data: UpdateMailLabelType) => {
    setEmails(prev => ({
      ...prev,
      mails:
        prev.mails?.map(mail =>
          Array.isArray(data.emailIds)
            ? data.emailIds.includes(mail.id)
              ? { ...mail, labels: [...mail.labels, data.label] }
              : mail
            : mail.id === data.emailIds
            ? { ...mail, labels: [...mail.labels, data.label] }
            : mail
        ) || []
    }))
  }

  const handleSelectAllMail = (value: boolean) => {
    setEmails(prev => ({
      ...prev,
      selectedMails: value && prev.mails ? prev.mails.map(mail => mail.id) : []
    }))
  }

  return (
    <EmailContext.Provider
      value={{
        emails,
        fetchMails,
        updateMail,
        selectMail,
        selectAllMail,
        deselectAllMail,
        getCurrentMail,
        updateMailLabel,
        handleSelectAllMail
      }}
    >
      {children}
    </EmailContext.Provider>
  )
}

export const useEmail = () => {
  const context = useContext(EmailContext)
  if (!context) {
    throw new Error('useEmail must be used within an EmailProvider')
  }

  return context
}

export { EmailProvider, EmailContext }
