// ** MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

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

interface ActivitiesProps {
  user: User
}

const Activities = ({ user }: ActivitiesProps) => {
  return (
    <Card>
      <CardContent>
        <Typography variant='h6' gutterBottom>
          Recent Activities
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          User activity tracking will be displayed here.
        </Typography>
      </CardContent>
    </Card>
  )
}

export default Activities
