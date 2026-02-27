// ** React Imports
import { useState } from 'react'

// ** MUI Components
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Switch from '@mui/material/Switch'

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

const AgentNotifications = ({ agent }: { agent: Agent }) => {
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    sms: false,
    whatsapp: true
  })

  const handleNotificationChange = (type: string, value: boolean) => {
    setNotificationSettings({ ...notificationSettings, [type]: value })
  }

  return (
    <Card>
      <CardContent>
        <Typography variant='h6' gutterBottom>
          Notification Preferences
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
          Manage how you receive notifications for transactions and account activities.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant='body1'>Email Notifications</Typography>
              <Typography variant='body2' color='text.secondary'>
                Receive notifications via email
              </Typography>
            </Box>
            <Switch
              checked={notificationSettings.email}
              onChange={e => handleNotificationChange('email', e.target.checked)}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant='body1'>SMS Notifications</Typography>
              <Typography variant='body2' color='text.secondary'>
                Receive notifications via SMS
              </Typography>
            </Box>
            <Switch
              checked={notificationSettings.sms}
              onChange={e => handleNotificationChange('sms', e.target.checked)}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant='body1'>WhatsApp Notifications</Typography>
              <Typography variant='body2' color='text.secondary'>
                Receive notifications via WhatsApp
              </Typography>
            </Box>
            <Switch
              checked={notificationSettings.whatsapp}
              onChange={e => handleNotificationChange('whatsapp', e.target.checked)}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default AgentNotifications
