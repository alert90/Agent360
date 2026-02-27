// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Switch from '@mui/material/Switch'

// ** Type
interface User {
  id: number
  email: string
  full_name: string
  username: string
  role: string
  location?: string
  zone?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface NotificationsProps {
  user: User
}

const Notifications = ({ user }: NotificationsProps) => {
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
          Manage how you receive notifications for account activities.
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

export default Notifications
