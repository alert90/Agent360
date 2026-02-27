// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

// ** Third Party Imports
import axios from 'axios'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Components Imports
import CustomChip from 'src/@core/components/mui/chip'
import OptionsMenu from 'src/@core/components/option-menu'

interface LocationData {
  location: string
  visitCount: number
}

const getLocationIcon = (location: string) => {
  if (location.includes('Nairobi')) return 'tabler:map-pin'
  if (location.includes('Mombasa')) return 'tabler:ship'
  if (location.includes('Dar es Salaam')) return 'tabler:building-bank'
  if (location.includes('Kigali')) return 'tabler:flag'
  if (location.includes('Local Network')) return 'tabler:wifi'

  return 'tabler:globe'
}

const AnalyticsSourceVisits = () => {
  // ** State
  const [data, setData] = useState<LocationData[]>([])
  const [loading, setLoading] = useState(true)
  const [totalVisits, setTotalVisits] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await axios.get('/api/dashboard/analytics')
        const locations = response.data.sourceVisits || []
        setData(locations)

        // Calculate total visits
        const total = locations.reduce((sum: number, item: LocationData) => sum + item.visitCount, 0)
        setTotalVisits(total)
      } catch (error) {
        console.error('Error fetching source visits:', error)
        setData([])
        setTotalVisits(0)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <Card>
      <CardHeader
        title='Login Locations'
        subheader={`${totalVisits} Total Logins`}
        action={
          <OptionsMenu
            options={['Last Week', 'Last Month', 'Last Year']}
            iconButtonProps={{ size: 'small', sx: { color: 'text.disabled' } }}
          />
        }
      />
      <CardContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <Typography>Loading...</Typography>
          </Box>
        ) : data.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <Typography color='text.secondary'>No login data available</Typography>
          </Box>
        ) : (
          data.map((item: LocationData, index: number) => {
            // Calculate trend (mock data for now - in real app, compare with previous period)
            const trendNumber = Math.random() * 20 - 10 // Random between -10 and +10
            const trend = trendNumber < 0 ? 'negative' : 'positive'

            return (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: index !== data.length - 1 ? [6.25, 6.25, 5.5, 6.25] : undefined
                }}
              >
                <Avatar variant='rounded' sx={{ mr: 4, width: 34, height: 34 }}>
                  <Icon icon={getLocationIcon(item.location)} />
                </Avatar>
                <Box
                  sx={{
                    rowGap: 1,
                    columnGap: 4,
                    width: '100%',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography variant='h6'>{item.location}</Typography>
                    <Typography variant='body2' sx={{ color: 'text.disabled' }}>
                      User Login Location
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ mr: 4, color: 'text.secondary' }}>{item.visitCount} logins</Typography>
                    <CustomChip
                      rounded
                      size='small'
                      skin='light'
                      sx={{ lineHeight: 1 }}
                      color={trend === 'negative' ? 'error' : 'success'}
                      label={`${trend === 'negative' ? '-' : '+'}${Math.abs(trendNumber).toFixed(1)}%`}
                    />
                  </Box>
                </Box>
              </Box>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

export default AnalyticsSourceVisits
