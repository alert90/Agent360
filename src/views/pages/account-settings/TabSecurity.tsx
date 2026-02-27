// ** React Imports
import { ReactNode, useState, useEffect } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import TableContainer from '@mui/material/TableContainer'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Components Imports
import CustomChip from 'src/@core/components/mui/chip'

// ** Demo Components
import CreateApiKey from 'src/views/pages/account-settings/security/CreateApiKey'
import ChangePasswordCard from 'src/views/pages/account-settings/security/ChangePasswordCard'
import TwoFactorAuthentication from 'src/views/pages/account-settings/security/TwoFactorAuthentication'

// ** Third Party Imports
import axios from 'axios'
import toast from 'react-hot-toast'

interface ApiKeyListType {
  title: string
  access: string
  date: string
  key: string
}

interface RecentDeviceDataType {
  date: string
  device: string
  location: string
  browserName: string
  browserIcon: ReactNode
}

const apiKeyList: ApiKeyListType[] = [
  {
    title: 'Server Key 1',
    access: 'Full Access',
    date: '28 Apr 2021, 18:20 GTM+4:10',
    key: '23eaf7f0-f4f7-495e-8b86-fad3261282ac'
  },
  {
    title: 'Server Key 2',
    access: 'Read Only',
    date: '12 Feb 2021, 10:30 GTM+2:30',
    key: 'bb98e571-a2e2-4de8-90a9-2e231b5e99'
  },
  {
    title: 'Server Key 3',
    access: 'Full Access',
    date: '28 Dec 2021, 12:21 GTM+4:10',
    key: '2e915e59-3105-47f2-8838-6e46bf83b711'
  }
]

const recentDeviceData: RecentDeviceDataType[] = [
  {
    location: 'Switzerland',
    device: 'HP Spectre 360',
    date: '10, July 2021 20:07',
    browserName: 'Chrome on Windows',
    browserIcon: (
      <Box component='span' sx={{ mr: 2.5, display: 'flex', '& svg': { color: 'info.main' } }}>
        <Icon icon='tabler:brand-windows' />
      </Box>
    )
  },
  {
    location: 'Australia',
    device: 'iPhone 12x',
    date: '13, July 2021 10:10',
    browserName: 'Chrome on iPhone',
    browserIcon: (
      <Box component='span' sx={{ mr: 2.5, display: 'flex', '& svg': { color: 'error.main' } }}>
        <Icon icon='tabler:device-mobile' />
      </Box>
    )
  },
  {
    location: 'Dubai',
    device: 'Oneplus 9 Pro',
    date: '14, July 2021 15:15',
    browserName: 'Chrome on Android',
    browserIcon: (
      <Box component='span' sx={{ mr: 2.5, display: 'flex', '& svg': { color: 'success.main' } }}>
        <Icon icon='tabler:brand-android' />
      </Box>
    )
  },
  {
    location: 'India',
    device: 'Apple iMac',
    date: '16, July 2021 16:17',
    browserName: 'Chrome on MacOS',
    browserIcon: (
      <Box component='span' sx={{ mr: 2.5, display: 'flex', '& svg': { color: 'secondary.main' } }}>
        <Icon icon='tabler:brand-apple' />
      </Box>
    )
  },
  {
    location: 'Switzerland',
    device: 'HP Spectre 360',
    date: '20, July 2021 21:01',
    browserName: 'Chrome on Windows',
    browserIcon: (
      <Box component='span' sx={{ mr: 2.5, display: 'flex', '& svg': { color: 'info.main' } }}>
        <Icon icon='tabler:brand-windows' />
      </Box>
    )
  },
  {
    location: 'Dubai',
    device: 'Oneplus 9 Pro',
    date: '21, July 2021 12:22',
    browserName: 'Chrome on Android',
    browserIcon: (
      <Box component='span' sx={{ mr: 2.5, display: 'flex', '& svg': { color: 'success.main' } }}>
        <Icon icon='tabler:brand-android' />
      </Box>
    )
  }
]

const TabSecurity = () => {
  const [deviceData, setDeviceData] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchDeviceData = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('accessToken')
        const response = await axios.get('/api/user/profile', {
          headers: {
            Authorization: token ? `Bearer ${token}` : ''
          }
        })
        setDeviceData(response.data.securitySettings?.recentDevices || [])
      } catch (error) {
        console.error('Error fetching device data:', error)
        toast.error('Failed to load device data')
      } finally {
        setLoading(false)
      }
    }

    fetchDeviceData()
  }, [])

  const getBrowserIcon = (browser: string) => {
    switch (browser?.toLowerCase()) {
      case 'chrome':
        return 'tabler:brand-chrome'
      case 'firefox':
        return 'tabler:brand-firefox'
      case 'safari':
        return 'tabler:brand-safari'
      case 'edge':
        return 'tabler:brand-edge'
      default:
        return 'tabler:device-desktop'
    }
  }

  const getOSIcon = (os: string) => {
    switch (os?.toLowerCase()) {
      case 'windows':
        return 'tabler:brand-windows'
      case 'macos':
      case 'mac os x':
        return 'tabler:brand-apple'
      case 'ios':
        return 'tabler:device-mobile'
      case 'android':
        return 'tabler:brand-android'
      case 'linux':
        return 'tabler:brand-linux'
      default:
        return 'tabler:device-desktop'
    }
  }

  const getOSColor = (os: string) => {
    switch (os?.toLowerCase()) {
      case 'windows':
        return 'info.main'
      case 'macos':
      case 'mac os x':
        return 'secondary.main'
      case 'ios':
        return 'error.main'
      case 'android':
        return 'success.main'
      case 'linux':
        return 'warning.main'
      default:
        return 'text.secondary'
    }
  }

  const formatDeviceData = (device: any) => {
    const browserIcon = (
      <Box component='span' sx={{ mr: 2.5, display: 'flex', '& svg': { color: 'info.main' } }}>
        <Icon icon={getBrowserIcon(device.browser)} />
      </Box>
    )

    return {
      browserIcon,
      browserName: `${device.browser || 'Unknown'} on ${device.deviceType || 'Unknown'}`,
      device: device.deviceName || `${device.browser || 'Unknown'} on ${device.os || 'Unknown'}`,
      location: device.location || 'Unknown',
      date: device.lastActivity
        ? new Date(device.lastActivity).toLocaleDateString() + ' ' + new Date(device.lastActivity).toLocaleTimeString()
        : 'Unknown'
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <ChangePasswordCard />
      </Grid>
      <Grid item xs={12}>
        <TwoFactorAuthentication />
      </Grid>

      {/* Recent Devices Card*/}
      <Grid item xs={12}>
        <Card>
          <CardHeader title='Recent Devices' />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>Browser</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>Device</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>Location</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>IP Address</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>Last Activity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody sx={{ '& .MuiTableCell-root': { py: theme => `${theme.spacing(2.5)} !important` } }}>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align='center'>
                      <Typography>Loading device data...</Typography>
                    </TableCell>
                  </TableRow>
                ) : deviceData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align='center'>
                      <Typography color='text.secondary'>No device data available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  deviceData.map((device, index) => {
                    const formatted = formatDeviceData(device)

                    return (
                      <TableRow key={device.id || index}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {formatted.browserIcon}
                            <Typography sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                              {formatted.browserName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                            {formatted.device}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                            {formatted.location}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ whiteSpace: 'nowrap', color: 'text.secondary', fontFamily: 'monospace' }}>
                            {device.ipAddress || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                            {formatted.date}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>
    </Grid>
  )
}
export default TabSecurity
