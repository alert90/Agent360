// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid
} from '@mui/material'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Imports
import axios from 'axios'
import toast from 'react-hot-toast'

interface NotificationEvent {
  id: number
  eventType: string
  eventName: string
  description: string | null
  isActive: boolean
  recipients: NotificationRecipient[]
}

interface NotificationRecipient {
  id: number
  recipientType: string
  recipientValue: string | null
}

interface NotificationLog {
  id: number
  event_type: string
  event_name: string
  message: string
  recipient_username: string | null
  status: string
  created_at: string
}

const NotificationManagement = () => {
  // ** States
  const [activeTab, setActiveTab] = useState<string>('events')
  const [events, setEvents] = useState<NotificationEvent[]>([])
  const [logs, setLogs] = useState<NotificationLog[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Dialog states
  const [eventDialog, setEventDialog] = useState(false)
  const [editingEvent, setEditingEvent] = useState<NotificationEvent | null>(null)

  // Form states
  const [eventForm, setEventForm] = useState({
    eventType: '',
    eventName: '',
    description: '',
    isActive: true
  })

  const [recipientForm, setRecipientForm] = useState({
    recipientType: 'role',
    recipientValue: 'admin'
  })

  // Fetch data on component mount
  useEffect(() => {
    fetchEvents()
    fetchLogs()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await axios.get('/api/admin/notifications?type=events')
      setEvents(response.data.events)
    } catch (error) {
      console.error('Error fetching notification events:', error)
    }
  }

  const fetchLogs = async () => {
    try {
      const response = await axios.get('/api/admin/notifications?type=logs')
      setLogs(response.data.logs)
    } catch (error) {
      console.error('Error fetching notification logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEvent = async () => {
    try {
      if (editingEvent) {
        // Update existing event
        await axios.put('/api/admin/notifications', {
          type: 'event',
          id: editingEvent.id,
          data: eventForm
        })
        toast.success('Event updated successfully')
      } else {
        // Create new event
        await axios.post('/api/admin/notifications', {
          type: 'event',
          data: eventForm
        })
        toast.success('Event created successfully')
      }

      setEventDialog(false)
      resetEventForm()
      fetchEvents()
    } catch (error) {
      console.error('Error saving event:', error)
      toast.error('Failed to save event')
    }
  }

  const handleAddRecipient = async (eventId: number) => {
    try {
      await axios.post('/api/admin/notifications', {
        type: 'recipient',
        data: {
          eventId,
          recipientType: recipientForm.recipientType,
          recipientValue: recipientForm.recipientValue || null
        }
      })
      toast.success('Recipient added successfully')
      fetchEvents()
    } catch (error) {
      console.error('Error adding recipient:', error)
      toast.error('Failed to add recipient')
    }
  }

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Are you sure you want to delete this event and all its recipients?')) {
      return
    }

    try {
      await axios.delete('/api/admin/notifications', {
        data: { type: 'event', id: eventId }
      })
      toast.success('Event deleted successfully')
      fetchEvents()
    } catch (error) {
      console.error('Error deleting event:', error)
      toast.error('Failed to delete event')
    }
  }

  const handleDeleteRecipient = async (recipientId: number) => {
    try {
      await axios.delete('/api/admin/notifications', {
        data: { type: 'recipient', id: recipientId }
      })
      toast.success('Recipient removed successfully')
      fetchEvents()
    } catch (error) {
      console.error('Error deleting recipient:', error)
      toast.error('Failed to remove recipient')
    }
  }

  const resetEventForm = () => {
    setEventForm({
      eventType: '',
      eventName: '',
      description: '',
      isActive: true
    })
    setEditingEvent(null)
  }

  const openEventDialog = (event?: NotificationEvent) => {
    if (event) {
      setEditingEvent(event)
      setEventForm({
        eventType: event.eventType,
        eventName: event.eventName,
        description: event.description || '',
        isActive: event.isActive
      })
    } else {
      resetEventForm()
    }
    setEventDialog(true)
  }

  const getRecipientTypeLabel = (type: string, value: string | null) => {
    switch (type) {
      case 'all':
        return 'All Users'
      case 'role':
        return `Role: ${value}`
      case 'user':
        return `User: ${value}`
      case 'zone':
        return `Zone: ${value}`
      case 'region':
        return `Region: ${value}`
      default:
        return `${type}: ${value || 'N/A'}`
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>
            Loading notifications...
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant='h5'>Notification Management</Typography>
          <Button variant='contained' startIcon={<Icon icon='tabler:plus' />} onClick={() => openEventDialog()}>
            Add Event
          </Button>
        </Box>

        {alert && (
          <Alert severity={alert.type} sx={{ mb: 4 }} onClose={() => setAlert(null)}>
            {alert.message}
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            <Button variant={activeTab === 'events' ? 'contained' : 'outlined'} onClick={() => setActiveTab('events')}>
              Events & Recipients
            </Button>
            <Button variant={activeTab === 'logs' ? 'contained' : 'outlined'} onClick={() => setActiveTab('logs')}>
              Notification Logs
            </Button>
          </Box>

          {activeTab === 'events' && (
            <Box>
              {events.length === 0 ? (
                <Typography>No notification events configured. Create your first event to get started.</Typography>
              ) : (
                events.map(event => (
                  <Accordion key={event.id} sx={{ mb: 2 }}>
                    <AccordionSummary expandIcon={<Icon icon='tabler:chevron-down' />}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant='h6'>{event.eventName}</Typography>
                          <Chip
                            label={event.isActive ? 'Active' : 'Inactive'}
                            color={event.isActive ? 'success' : 'default'}
                            size='small'
                            sx={{ ml: 2 }}
                          />
                        </Box>
                        <Box>
                          <IconButton
                            size='small'
                            onClick={e => {
                              e.stopPropagation()
                              openEventDialog(event)
                            }}
                          >
                            <Icon icon='tabler:edit' />
                          </IconButton>
                          <IconButton
                            size='small'
                            color='error'
                            onClick={e => {
                              e.stopPropagation()
                              handleDeleteEvent(event.id)
                            }}
                          >
                            <Icon icon='tabler:trash' />
                          </IconButton>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                        {event.description || 'No description provided.'}
                      </Typography>

                      <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 600 }}>
                        Recipients ({event.recipients.length})
                      </Typography>

                      {event.recipients.length === 0 ? (
                        <Typography variant='body2' color='text.secondary'>
                          No recipients configured.
                        </Typography>
                      ) : (
                        <Box sx={{ mb: 2 }}>
                          {event.recipients.map(recipient => (
                            <Chip
                              key={recipient.id}
                              label={getRecipientTypeLabel(recipient.recipientType, recipient.recipientValue)}
                              onDelete={() => handleDeleteRecipient(recipient.id)}
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))}
                        </Box>
                      )}

                      {/* Add recipient form */}
                      <Box sx={{ mt: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant='subtitle2' sx={{ mb: 2 }}>
                          Add Recipient
                        </Typography>
                        <Grid container spacing={2} alignItems='center'>
                          <Grid item xs={12} sm={4}>
                            <FormControl fullWidth size='small'>
                              <InputLabel>Recipient Type</InputLabel>
                              <Select
                                value={recipientForm.recipientType}
                                label='Recipient Type'
                                onChange={e => setRecipientForm(prev => ({ ...prev, recipientType: e.target.value }))}
                              >
                                <MenuItem value='all'>All Users</MenuItem>
                                <MenuItem value='role'>Specific Role</MenuItem>
                                <MenuItem value='user'>Specific User</MenuItem>
                                <MenuItem value='zone'>Specific Zone</MenuItem>
                                <MenuItem value='region'>Specific Region</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              fullWidth
                              size='small'
                              label='Value'
                              value={recipientForm.recipientValue}
                              onChange={e => setRecipientForm(prev => ({ ...prev, recipientValue: e.target.value }))}
                              disabled={recipientForm.recipientType === 'all'}
                              helperText={
                                recipientForm.recipientType === 'role'
                                  ? 'e.g., admin, super_agent'
                                  : recipientForm.recipientType === 'user'
                                  ? 'User ID or username'
                                  : recipientForm.recipientType === 'zone'
                                  ? 'Zone name'
                                  : recipientForm.recipientType === 'region'
                                  ? 'Region name'
                                  : ''
                              }
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Button
                              variant='outlined'
                              size='small'
                              onClick={() => handleAddRecipient(event.id)}
                              disabled={recipientForm.recipientType !== 'all' && !recipientForm.recipientValue}
                            >
                              Add Recipient
                            </Button>
                          </Grid>
                        </Grid>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))
              )}
            </Box>
          )}

          {activeTab === 'logs' && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Event</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Recipient</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Timestamp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Typography variant='body2' fontWeight={600}>
                          {log.event_name}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {log.event_type}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2'>
                          {log.message.length > 100 ? `${log.message.substring(0, 100)}...` : log.message}
                        </Typography>
                      </TableCell>
                      <TableCell>{log.recipient_username || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={log.status}
                          color={log.status === 'sent' ? 'success' : log.status === 'failed' ? 'error' : 'default'}
                          size='small'
                        />
                      </TableCell>
                      <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align='center'>
                        <Typography variant='body2' color='text.secondary'>
                          No notification logs available.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* Event Dialog */}
        <Dialog open={eventDialog} onClose={() => setEventDialog(false)} maxWidth='sm' fullWidth>
          <DialogTitle>{editingEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Event Type'
                  value={eventForm.eventType}
                  onChange={e => setEventForm(prev => ({ ...prev, eventType: e.target.value }))}
                  helperText='Unique identifier (e.g., user_login, password_change)'
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Event Name'
                  value={eventForm.eventName}
                  onChange={e => setEventForm(prev => ({ ...prev, eventName: e.target.value }))}
                  helperText='Display name'
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Description'
                  value={eventForm.description}
                  onChange={e => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={eventForm.isActive}
                      onChange={e => setEventForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                  }
                  label='Active'
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEventDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveEvent} variant='contained'>
              {editingEvent ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default NotificationManagement
