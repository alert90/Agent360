// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Box,
  Alert,
  Switch,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material'

// ** Custom Components Imports
import FAQManagement from './FAQManagement'

// ** Third Party Imports
import axios from 'axios'
import toast from 'react-hot-toast'

interface GeneralSetting {
  id: number
  settingKey: string
  settingValue: string | null
  settingType: string
  category: string
  label: string
  description: string | null
  isRequired: boolean
  validationRules: string | null
}

interface NotificationSetting {
  id: number
  name: string
  label: string
  description: string | null
  emailEnabled: boolean
  smsEnabled: boolean
  pushEnabled: boolean
  emailTemplate: string | null
  smsTemplate: string | null
  isActive: boolean
}

const GeneralSettings = () => {
  // ** States
  const [activeTab, setActiveTab] = useState<string>('branding')
  const [generalSettings, setGeneralSettings] = useState<Record<string, GeneralSetting[]>>({})
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const [generalRes, notificationsRes] = await Promise.all([
        axios.get('/api/admin/settings/general'),
        axios.get('/api/admin/settings/notifications')
      ])

      setGeneralSettings(generalRes.data)
      setNotificationSettings(notificationsRes.data)
    } catch (error) {
      console.error('Error fetching settings:', error)
      setAlert({ type: 'error', message: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveGeneralSettings = async () => {
    try {
      setSaving(true)
      const settingsToUpdate = []

      // Flatten all settings for update
      for (const category of Object.values(generalSettings)) {
        settingsToUpdate.push(...category)
      }

      const settings = settingsToUpdate.map(setting => ({
        key: setting.settingKey,
        value: setting.settingValue || ''
      }))

      await axios.put('/api/admin/settings/general', { settings })

      setAlert({ type: 'success', message: 'General settings saved successfully' })
      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      setAlert({ type: 'error', message: 'Failed to save settings' })
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotificationSettings = async () => {
    try {
      setSaving(true)

      const settings = notificationSettings.map(setting => ({
        name: setting.name,
        emailEnabled: setting.emailEnabled,
        smsEnabled: setting.smsEnabled,
        pushEnabled: setting.pushEnabled
      }))

      await axios.put('/api/admin/settings/notifications', { settings })

      setAlert({ type: 'success', message: 'Notification settings saved successfully' })
      toast.success('Notification settings saved successfully')
    } catch (error) {
      console.error('Error saving notification settings:', error)
      setAlert({ type: 'error', message: 'Failed to save notification settings' })
      toast.error('Failed to save notification settings')
    } finally {
      setSaving(false)
    }
  }

  const handleGeneralSettingChange = (category: string, key: string, value: string) => {
    setGeneralSettings(prev => ({
      ...prev,
      [category]: prev[category].map(setting =>
        setting.settingKey === key ? { ...setting, settingValue: value } : setting
      )
    }))
  }

  const handleNotificationSettingChange = (name: string, field: string, value: boolean) => {
    setNotificationSettings(prev =>
      prev.map(setting => (setting.name === name ? { ...setting, [field]: value } : setting))
    )
  }

  const renderGeneralSettingsTab = (category: string, settings: GeneralSetting[]) => (
    <Grid container spacing={4}>
      {settings.map(setting => (
        <Grid item xs={12} sm={6} key={setting.settingKey}>
          <TextField
            fullWidth
            label={setting.label}
            value={setting.settingValue || ''}
            onChange={e => handleGeneralSettingChange(category, setting.settingKey, e.target.value)}
            helperText={setting.description}
            required={setting.isRequired}
            type={setting.settingType === 'number' ? 'number' : 'text'}
          />
        </Grid>
      ))}
    </Grid>
  )

  const renderNotificationSettingsTab = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Notification Type</TableCell>
            <TableCell>Description</TableCell>
            <TableCell align='center'>Email</TableCell>
            <TableCell align='center'>SMS</TableCell>
            <TableCell align='center'>Push</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {notificationSettings.map(setting => (
            <TableRow key={setting.name}>
              <TableCell>
                <Typography variant='subtitle2'>{setting.label}</Typography>
              </TableCell>
              <TableCell>{setting.description}</TableCell>
              <TableCell align='center'>
                <Switch
                  checked={setting.emailEnabled}
                  onChange={e => handleNotificationSettingChange(setting.name, 'emailEnabled', e.target.checked)}
                />
              </TableCell>
              <TableCell align='center'>
                <Switch
                  checked={setting.smsEnabled}
                  onChange={e => handleNotificationSettingChange(setting.name, 'smsEnabled', e.target.checked)}
                />
              </TableCell>
              <TableCell align='center'>
                <Switch
                  checked={setting.pushEnabled}
                  onChange={e => handleNotificationSettingChange(setting.name, 'pushEnabled', e.target.checked)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>
            Loading settings...
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Typography variant='h5' sx={{ mb: 4 }}>
          General Settings
        </Typography>

        {alert && (
          <Alert severity={alert.type} sx={{ mb: 4 }} onClose={() => setAlert(null)}>
            {alert.message}
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
            <Button
              variant={activeTab === 'branding' ? 'contained' : 'outlined'}
              onClick={() => setActiveTab('branding')}
            >
              Branding & Logo
            </Button>
            <Button
              variant={activeTab === 'contact' ? 'contained' : 'outlined'}
              onClick={() => setActiveTab('contact')}
            >
              Contact Information
            </Button>
            <Button
              variant={activeTab === 'notifications' ? 'contained' : 'outlined'}
              onClick={() => setActiveTab('notifications')}
            >
              Notifications
            </Button>
            <Button variant={activeTab === 'system' ? 'contained' : 'outlined'} onClick={() => setActiveTab('system')}>
              System Settings
            </Button>
            <Button variant={activeTab === 'faq' ? 'contained' : 'outlined'} onClick={() => setActiveTab('faq')}>
              FAQ Management
            </Button>
          </Box>

          {activeTab === 'branding' && (
            <Box>
              <Typography variant='h6' sx={{ mb: 3 }}>
                Branding Settings
              </Typography>
              {generalSettings.branding ? (
                renderGeneralSettingsTab('branding', generalSettings.branding)
              ) : (
                <Typography>No branding settings configured</Typography>
              )}
            </Box>
          )}

          {activeTab === 'contact' && (
            <Box>
              <Typography variant='h6' sx={{ mb: 3 }}>
                Contact Information
              </Typography>
              {generalSettings.contact ? (
                renderGeneralSettingsTab('contact', generalSettings.contact)
              ) : (
                <Typography>No contact settings configured</Typography>
              )}
            </Box>
          )}

          {activeTab === 'notifications' && (
            <Box>
              <Typography variant='h6' sx={{ mb: 3 }}>
                Notification Settings
              </Typography>
              {renderNotificationSettingsTab()}
            </Box>
          )}

          {activeTab === 'system' && (
            <Box>
              <Typography variant='h6' sx={{ mb: 3 }}>
                System Settings
              </Typography>
              {generalSettings.system ? (
                renderGeneralSettingsTab('system', generalSettings.system)
              ) : (
                <Typography>No system settings configured</Typography>
              )}
            </Box>
          )}

          {activeTab === 'faq' && (
            <Box>
              <FAQManagement />
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant='outlined' onClick={fetchSettings}>
            Reset Changes
          </Button>
          <Button
            variant='contained'
            onClick={activeTab === 'notifications' ? handleSaveNotificationSettings : handleSaveGeneralSettings}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  )
}

export default GeneralSettings
