// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'

// ** Third Party Imports
import axios from 'axios'
import { format } from 'date-fns'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Types
import { ThemeColor } from 'src/@core/layouts/types'

// ** Custom Components Imports
import CustomAvatar from 'src/@core/components/mui/avatar'
import OptionsMenu from 'src/@core/components/option-menu'

interface EventData {
  title: string
  message: string
  is_read: number
  created_at: string
  event_type: string
  event_name: string
}

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'user_login':
      return 'tabler:login'
    case 'transaction_completed':
      return 'tabler:check-circle'
    case 'commission_updated':
      return 'tabler:currency-dollar'
    case 'password_change':
      return 'tabler:lock'
    case 'profile_updated':
      return 'tabler:user'
    case 'calendar_event_created':
      return 'tabler:calendar'
    case 'admin_update':
      return 'tabler:settings'
    default:
      return 'tabler:bell'
  }
}

const getEventColor = (eventType: string): ThemeColor => {
  switch (eventType) {
    case 'user_login':
      return 'success'
    case 'transaction_completed':
      return 'primary'
    case 'commission_updated':
      return 'warning'
    case 'password_change':
      return 'info'
    case 'profile_updated':
      return 'secondary'
    case 'calendar_event_created':
      return 'success'
    case 'admin_update':
      return 'error'
    default:
      return 'primary'
  }
}

const AnalyticsMonthlyCampaignState = () => {
  // ** State
  const [events, setEvents] = useState<EventData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await axios.get('/api/dashboard/analytics')
        setEvents(response.data.recentEvents || [])
      } catch (error) {
        console.error('Error fetching recent events:', error)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <Card>
      <CardHeader
        title='Recent Events'
        subheader={`${events.length} Recent Activities`}
        action={
          <OptionsMenu
            options={['Last Week', 'Last Month', 'Last 3 Months']}
            iconButtonProps={{ size: 'small', sx: { color: 'text.disabled' } }}
          />
        }
      />
      <CardContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <Typography>Loading events...</Typography>
          </Box>
        ) : events.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <Typography color='text.secondary'>No recent events</Typography>
          </Box>
        ) : (
          events.slice(0, 6).map((event: EventData, index: number) => {
            return (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  mb: index !== Math.min(events.length - 1, 5) ? [4, 4, 5, 4] : undefined
                }}
              >
                <CustomAvatar
                  skin='light'
                  variant='rounded'
                  color={getEventColor(event.event_type)}
                  sx={{ mr: 3, width: 36, height: 36, mt: 0.5 }}
                >
                  <Icon icon={getEventIcon(event.event_type)} fontSize='1.25rem' />
                </CustomAvatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant='h6' sx={{ fontSize: '0.9rem', lineHeight: 1.4 }}>
                      {event.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {event.is_read === 0 && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: 'primary.main'
                          }}
                        />
                      )}
                      <Typography variant='body2' sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>
                        {format(new Date(event.created_at), 'MMM dd, HH:mm')}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant='body2' sx={{ color: 'text.secondary', mb: 1, fontSize: '0.8rem' }}>
                    {event.message.length > 80 ? `${event.message.substring(0, 80)}...` : event.message}
                  </Typography>
                  <Chip
                    label={event.event_name}
                    size='small'
                    variant='outlined'
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                </Box>
              </Box>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

export default AnalyticsMonthlyCampaignState
