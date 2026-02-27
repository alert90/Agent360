// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

// ** Custom Components
import CustomTextField from 'src/@core/components/mui/text-field'
import CustomChip from 'src/@core/components/mui/chip'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Types
import { CommissionData } from 'src/types/apps/userTypes'

const CommissionManagement = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>('2024-03')

  const commissionData: CommissionData[] = [
    {
      id: '1',
      userId: 3,
      userRole: 'super_agent',
      period: '2024-03',
      totalCommission: 4500000,
      fixedCommission: 1350000,
      variableCommission: 3150000,
      kpiScore: 85,
      performanceThresholdMet: true,
      transactionsCount: 350,
      transactionValue: 150000000,
      status: 'pending'
    },
    {
      id: '2',
      userId: 4,
      userRole: 'franchise',
      period: '2024-03',
      totalCommission: 3200000,
      fixedCommission: 960000,
      variableCommission: 2240000,
      kpiScore: 92,
      performanceThresholdMet: true,
      transactionsCount: 280,
      transactionValue: 120000000,
      status: 'pending'
    }
  ]

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'warning',
      approved: 'info',
      paid: 'success'
    }

    return colors[status] || 'secondary'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS'
    }).format(amount)
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title='Commission Management'
            action={
              <Box sx={{ display: 'flex', gap: 2 }}>
                <CustomTextField type='month' value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
                <Button variant='contained' startIcon={<Icon icon='tabler:download' />}>
                  Export
                </Button>
                <Button variant='contained' color='success' startIcon={<Icon icon='tabler:check' />}>
                  Approve All
                </Button>
              </Box>
            }
          />
          <CardContent>
            <Grid container spacing={4}>
              {commissionData.map(commission => (
                <Grid item xs={12} md={6} key={commission.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                        <Box>
                          <Typography variant='h6' sx={{ mb: 1 }}>
                            {commission.userRole === 'super_agent' ? 'Super Agent John' : 'Franchise Mary'}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            Period: {commission.period}
                          </Typography>
                        </Box>
                        <CustomChip
                          rounded
                          skin='light'
                          label={commission.status}
                          color={getStatusColor(commission.status)}
                        />
                      </Box>

                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6}>
                          <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                            Total Commission
                          </Typography>
                          <Typography variant='h6' sx={{ color: 'primary.main' }}>
                            {formatCurrency(commission.totalCommission)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                            KPI Score
                          </Typography>
                          <Typography variant='h6' sx={{ color: 'success.main' }}>
                            {commission.kpiScore}%
                          </Typography>
                        </Grid>
                      </Grid>

                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={4}>
                          <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                            Fixed
                          </Typography>
                          <Typography variant='body2'>{formatCurrency(commission.fixedCommission)}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                            Variable
                          </Typography>
                          <Typography variant='body2'>{formatCurrency(commission.variableCommission)}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                            Transactions
                          </Typography>
                          <Typography variant='body2'>{commission.transactionsCount}</Typography>
                        </Grid>
                      </Grid>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant='tonal' size='small' startIcon={<Icon icon='tabler:eye' />}>
                          Review
                        </Button>
                        <Button variant='tonal' color='success' size='small' startIcon={<Icon icon='tabler:check' />}>
                          Approve
                        </Button>
                        <Button variant='tonal' color='error' size='small' startIcon={<Icon icon='tabler:x' />}>
                          Reject
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default CommissionManagement
