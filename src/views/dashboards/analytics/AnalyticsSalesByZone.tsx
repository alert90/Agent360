// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

// ** Third Party Imports
import axios from 'axios'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Components Imports
import OptionsMenu from 'src/@core/components/option-menu'

interface ZoneData {
  zone: string
  transactionCount: number
  totalAmount: number
}

const getZoneIcon = (zone: string) => {
  if (zone.includes('Nairobi') || zone.includes('Central')) return '/images/cards/us.png'
  if (zone.includes('Mombasa') || zone.includes('Coast')) return '/images/cards/brazil.png'
  if (zone.includes('Dar es Salaam') || zone.includes('Eastern')) return '/images/cards/india.png'
  if (zone.includes('Kigali') || zone.includes('Southern')) return '/images/cards/australia.png'

  return '/images/cards/us.png' // Default icon
}

const AnalyticsSalesByZone = () => {
  // ** State
  const [data, setData] = useState<ZoneData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await axios.get('/api/dashboard/analytics')
        setData(response.data.transactionsByZone || [])
      } catch (error) {
        console.error('Error fetching zone data:', error)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Format amount for display
  const formatAmount = (amount: number) => {
    if (amount >= 1000000000) return `TZS ${(amount / 1000000000).toFixed(2)} B`
    if (amount >= 1000000) return `TZS ${(amount / 1000000).toFixed(2)} M`
    if (amount >= 1000) return `TZS ${(amount / 1000).toFixed(2)} K`

    return `TZS ${amount.toLocaleString()}`
  }

  return (
    <Card>
      <CardHeader
        title='Transactions by Zones'
        subheader='Monthly transactions overview'
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
            <Typography color='text.secondary'>No zone data available</Typography>
          </Box>
        ) : (
          data.map((item: ZoneData, index: number) => {
            // Calculate trend (mock data for now - in real app, compare with previous period)
            const trendNumber = Math.random() * 40 - 20 // Random between -20 and +20
            const trend = trendNumber < 0 ? 'negative' : 'positive'

            return (
              <Box
                key={item.zone}
                sx={{
                  display: 'flex',
                  '& img': { mr: 4 },
                  alignItems: 'center',
                  mb: index !== data.length - 1 ? 4.5 : undefined
                }}
              >
                <img width={34} height={34} src={getZoneIcon(item.zone)} alt={item.zone} />

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
                    <Typography variant='h6'>{formatAmount(item.totalAmount)}</Typography>
                    <Typography variant='body2' sx={{ color: 'text.disabled' }}>
                      {item.zone} ({item.transactionCount} transactions)
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      '& svg': { mr: 1 },
                      alignItems: 'center',
                      '& > *': { color: trend === 'negative' ? 'error.main' : 'success.main' }
                    }}
                  >
                    <Icon
                      fontSize='1.25rem'
                      icon={trend === 'negative' ? 'tabler:chevron-down' : 'tabler:chevron-up'}
                    />
                    <Typography variant='h6'>{`${Math.abs(trendNumber).toFixed(1)}%`}</Typography>
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

export default AnalyticsSalesByZone
