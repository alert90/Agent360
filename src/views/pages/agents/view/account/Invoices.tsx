// ** React Imports
import { useState } from 'react'

// ** MUI Components
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

interface Agent {
  id: number
  account_number: string
  name: string
  username?: string
  email?: string
  phone?: string
  contact?: string
  role: string
  type: string
  branch_code: string
  branch_name: string
  region?: string
  zone?: string
  parent_agent_id: number | null
  is_active: boolean
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  total_transaction_amount: number
  transaction_count: number
  commission_amount: number
  commission_eligible?: boolean
  payband: number
  created_at: string
  updated_at: string
  recent_transactions?: number
  recent_amount?: number
  parent_agent?: any
  child_agents?: any[]
  recent_transactions_data?: any[]
  transaction_summary?: any[]
  monthly_performance?: any[]
}

const AgentInvoices = ({ agent }: { agent: Agent }) => {
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString()
  }

  const handleViewInvoice = (transaction: any) => {
    setSelectedTransaction(transaction)
    setInvoiceDialogOpen(true)
  }

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant='h6' gutterBottom>
            Transaction Invoices
          </Typography>
          {agent.recent_transactions_data && agent.recent_transactions_data.length > 0 ? (
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Transaction ID</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Customer</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Commission</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agent.recent_transactions_data.map((transaction: any) => (
                    <tr key={transaction.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px', fontFamily: 'monospace' }}>{transaction.transaction_id}</td>
                      <td style={{ padding: '12px' }}>
                        <Box>
                          <Typography variant='body2' fontWeight='bold'>
                            {transaction.customer_name}
                          </Typography>
                          {transaction.customer_phone && (
                            <Typography variant='caption' color='text.secondary'>
                              {transaction.customer_phone}
                            </Typography>
                          )}
                        </Box>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Chip label={transaction.type} size='small' />
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <Typography variant='body2' fontWeight='bold'>
                          {formatCurrency(transaction.amount)}
                        </Typography>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <Typography variant='body2' color='success.main'>
                          {formatCurrency(transaction.commission_amount)}
                        </Typography>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Chip
                          label={transaction.status}
                          size='small'
                          color={transaction.status === 'COMPLETED' ? 'success' : 'warning'}
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Typography variant='body2'>{formatDate(transaction.timestamp)}</Typography>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <Button size='small' variant='outlined' onClick={() => handleViewInvoice(transaction)}>
                          View Invoice
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          ) : (
            <Typography variant='body2' color='text.secondary'>
              No transactions found
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Invoice Dialog */}
      <Dialog open={invoiceDialogOpen} onClose={() => setInvoiceDialogOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>Transaction Invoice</DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                  <Typography variant='h5'>Agent360</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Transaction Receipt
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant='body2'>Invoice #: {selectedTransaction.transaction_id}</Typography>
                  <Typography variant='body2'>Date: {formatDate(selectedTransaction.timestamp)}</Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant='h6' gutterBottom>
                  Agent Information
                </Typography>
                <Typography variant='body2'>Name: {agent.name}</Typography>
                <Typography variant='body2'>Account: {agent.account_number}</Typography>
                <Typography variant='body2'>Branch: {agent.branch_name}</Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant='h6' gutterBottom>
                  Customer Information
                </Typography>
                <Typography variant='body2'>Name: {selectedTransaction.customer_name}</Typography>
                <Typography variant='body2'>Phone: {selectedTransaction.customer_phone || 'N/A'}</Typography>
                {selectedTransaction.customer_account && (
                  <Typography variant='body2'>Account: {selectedTransaction.customer_account}</Typography>
                )}
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant='h6' gutterBottom>
                  Transaction Details
                </Typography>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Description</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '8px' }}>{selectedTransaction.type} Transaction</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        {formatCurrency(selectedTransaction.amount)}
                      </td>
                    </tr>
                    {selectedTransaction.fee && selectedTransaction.fee > 0 && (
                      <tr>
                        <td style={{ padding: '8px' }}>Transaction Fee</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          {formatCurrency(selectedTransaction.fee)}
                        </td>
                      </tr>
                    )}
                    <tr style={{ borderTop: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '8px', fontWeight: 'bold' }}>Net Amount</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
                        {formatCurrency(selectedTransaction.net_amount || selectedTransaction.amount)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px' }}>Commission Earned</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: 'success.main' }}>
                        {formatCurrency(selectedTransaction.commission_amount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant='body2'>Status: {selectedTransaction.status}</Typography>
                  <Typography variant='body2'>Channel: {selectedTransaction.channel || 'N/A'}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant='body2' color='text.secondary'>
                    Generated on {new Date().toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvoiceDialogOpen(false)}>Close</Button>
          <Button variant='contained' onClick={() => window.print()}>
            Print Invoice
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default AgentInvoices
