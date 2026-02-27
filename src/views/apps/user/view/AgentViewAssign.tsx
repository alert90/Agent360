// ** MUI Imports
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import TableContainer from '@mui/material/TableContainer'

const AgentViewAssign = () => {
  return (
    <Card>
      <CardHeader title='Assignment' sx={{ pb: 1.5 }} />

      <CardContent>
        <Typography sx={{ mb: 6, color: 'text.secondary' }}>
          When you assign local agent, you'll be able to transact and get commission based on their progress.
        </Typography>
        <TableContainer
          sx={{ borderRadius: '6px !important', border: theme => `1px solid ${theme.palette.divider}` }}
        ></TableContainer>
      </CardContent>

      <CardActions>
        <Button variant='contained' sx={{ mr: 2 }}>
          Save Changes
        </Button>
        <Button color='secondary' variant='tonal'>
          Discard
        </Button>
      </CardActions>
    </Card>
  )
}

export default AgentViewAssign
