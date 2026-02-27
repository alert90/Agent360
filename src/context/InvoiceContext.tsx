// ** React Imports
import { createContext, useContext, useState, ReactNode } from 'react'

// ** Types
import { InvoiceType } from 'src/types/apps/invoiceTypes'

interface InvoiceState {
  data: InvoiceType[]
  total: number
  params: {
    q: string
    role: string
    status: string
  }
  allData: InvoiceType[]
}

interface InvoiceContextType {
  invoice: InvoiceState
  fetchData: (params: any) => void
  deleteInvoice: (id: number) => void
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined)

type Props = {
  children: ReactNode
}

const InvoiceProvider = ({ children }: Props) => {
  const [invoice, setInvoice] = useState<InvoiceState>({
    data: [],
    total: 0,
    params: {
      q: '',
      role: '',
      status: ''
    },
    allData: []
  })

  const fetchData = async (params: any) => {
    try {
      // Mock API call - replace with actual API
      const mockData: InvoiceType[] = [
        {
          id: 1,
          name: 'Oliver Queen',
          companyEmail: 'oliver@queen.com',
          avatar: '',
          avatarColor: 'primary',
          invoiceStatus: 'Paid',
          total: 1200,
          issuedDate: '2023-01-15',
          balance: 0,
          dueDate: '2023-02-15',
          service: 'Web Development',
          address: '123 Queen Street',
          company: 'Queen Industries',
          country: 'USA',
          contact: 'Oliver Queen'
        }
      ]

      setInvoice(prev => ({
        ...prev,
        data: mockData,
        params,
        allData: mockData,
        total: mockData.length
      }))
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    }
  }

  const deleteInvoice = (id: number) => {
    setInvoice(prev => ({
      ...prev,
      data: prev.data.filter(item => item.id !== id),
      allData: prev.allData.filter(item => item.id !== id),
      total: prev.total - 1
    }))
  }

  return (
    <InvoiceContext.Provider
      value={{
        invoice,
        fetchData,
        deleteInvoice
      }}
    >
      {children}
    </InvoiceContext.Provider>
  )
}

export const useInvoice = () => {
  const context = useContext(InvoiceContext)
  if (!context) {
    throw new Error('useInvoice must be used within an InvoiceProvider')
  }

  return context
}

export { InvoiceProvider, InvoiceContext }
