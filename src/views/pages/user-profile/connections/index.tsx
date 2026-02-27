// ** React Imports
import { ReactElement } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Types
import { ProfileConnectionsType } from 'src/types/profile'

interface Props {
  data: ProfileConnectionsType[]
}

const Connections = ({ data }: Props): ReactElement => {
  return (
    <Grid container spacing={6}>
      {data.map(connection => (
        <Grid item xs={12} sm={6} md={4} key={connection.id}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Avatar src={connection.avatar || '/images/avatars/1.png'} sx={{ mr: 3, width: 48, height: 48 }} />
                <Box>
                  <Typography variant='h6' sx={{ fontWeight: 600 }}>
                    {connection.name}
                  </Typography>
                  <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                    {connection.branch_name && `Branch: ${connection.branch_name}`}
                    {connection.zone && ` • Zone: ${connection.zone}`}
                    {connection.account_number && ` • Account: ${connection.account_number}`}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Button
                  size='small'
                  color='primary'
                  variant={connection.isFriend ? 'contained' : 'outlined'}
                  sx={{ minWidth: 30, minHeight: 30 }}
                >
                  <Icon fontSize='1.125rem' icon={connection.isFriend ? 'tabler:user-check' : 'tabler:user-x'} />
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

export default Connections
