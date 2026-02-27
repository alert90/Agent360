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
import Chip from '@mui/material/Chip'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Types
import { ProfileTeamsType } from 'src/types/profile'

interface Props {
  data: ProfileTeamsType[]
}

const Teams = ({ data }: Props): ReactElement => {
  return (
    <Grid container spacing={6}>
      {data.map((team, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <Avatar
                  src={team.avatar || '/images/icons/project-icons/support-label.png'}
                  sx={{ mr: 3, width: 48, height: 48 }}
                />
                <Box>
                  <Typography variant='h6' sx={{ fontWeight: 600 }}>
                    {team.title}
                  </Typography>
                  <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                    {team.description}
                  </Typography>
                </Box>
              </Box>
              {team.chipText && (
                <Box sx={{ mt: 2 }}>
                  <Chip label={team.chipText} color={team.color || 'primary'} size='small' />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

export default Teams
