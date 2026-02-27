// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Table from '@mui/material/Table'
import Switch from '@mui/material/Switch'
import TableRow from '@mui/material/TableRow'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import Typography from '@mui/material/Typography'
import TableContainer from '@mui/material/TableContainer'
import FormControlLabel from '@mui/material/FormControlLabel'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'

// ** Custom Components Imports
import CustomChip from 'src/@core/components/mui/chip'

// ** Third Party Imports
import toast from 'react-hot-toast'

interface StepCommissionReviewProps {
  formData: any
  onSuccess?: () => void
}

const StepCommissionReview = ({ formData, onSuccess }: StepCommissionReviewProps) => {
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!confirmed) {
      toast.error('Please confirm the commission details before submitting')

      return
    }

    setSaving(true)
    try {
      // Validate KPI weights
      const totalWeight =
        (formData.kpiWeights?.activeness || 0) +
        (formData.kpiWeights?.valueTransacted || 0) +
        (formData.kpiWeights?.uniqueAgents || 0)

      if (totalWeight !== 100) {
        toast.error('KPI weights must total 100%')
        setSaving(false)

        return
      }

      // Prepare config data for API (no dates as per user requirement)
      const configData = {
        title: formData.title,
        code: formData.code,
        description: formData.description,
        type: formData.type,
        value: formData.commissionRate,
        agentType: 'all',
        status: formData.status,
        minTransactionAmount: formData.minTransactionAmount,
        commissionRate: formData.commissionRate,
        superAgentCommissionRate: formData.superAgentCommissionRate,
        superAgentFixedRate: formData.superAgentFixedRate,
        superAgentVariableRate: formData.superAgentVariableRate,
        franchiseMultiplier: formData.franchiseMultiplier,
        kpiWeights: formData.kpiWeights,
        assignedUsers: formData.assignedUsers || []
      }

      const method = formData.id ? 'PUT' : 'POST'
      const url = formData.id ? `/api/commission-configs/${formData.id}` : '/api/commission-configs'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(configData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save commission configuration')
      }

      const result = await response.json()
      toast.success('Commission configuration saved successfully!')

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }

      console.log('Saved config:', result)
    } catch (error) {
      console.error('Save error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save commission configuration')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} lg={8} xl={9}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant='h4' sx={{ mb: 4 }}>
              Review Configuration 🚀
            </Typography>
            <Typography sx={{ mb: 4, color: 'text.secondary' }}>
              Please review your commission configuration details below and confirm before saving.
            </Typography>
          </Grid>

          {/* Basic Configuration */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title='Basic Configuration' titleTypographyProps={{ variant: 'h6' }} />
              <CardContent>
                <TableContainer>
                  <Table>
                    <TableBody
                      sx={{
                        '& .MuiTableCell-root': {
                          borderBottom: 0,
                          verticalAlign: 'top',
                          '&:last-of-type': { px: '0 !important' },
                          '&:first-of-type': { pl: '0 !important' },
                          py: theme => `${theme.spacing(0.75)} !important`
                        }
                      }}
                    >
                      <TableRow>
                        <TableCell>
                          <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                            Commission Title
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ color: 'text.secondary' }}>{formData.title || 'Not set'}</Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                            Commission Code
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <CustomChip
                            rounded
                            size='small'
                            skin='light'
                            color='primary'
                            label={formData.code || 'Not set'}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                            Description
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ color: 'text.secondary' }}>{formData.description || 'Not set'}</Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                            Status
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <CustomChip
                            rounded
                            size='small'
                            skin='light'
                            color={formData.status === 'active' ? 'success' : 'warning'}
                            label={formData.status || 'active'}
                          />
                        </TableCell>
                      </TableRow>
                      {/* Duration removed as commission duration is not needed per user requirements */}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Commission Rates */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title='Commission Rates' titleTypographyProps={{ variant: 'h6' }} />
              <CardContent>
                <TableContainer>
                  <Table>
                    <TableBody
                      sx={{
                        '& .MuiTableCell-root': {
                          borderBottom: 0,
                          verticalAlign: 'top',
                          '&:last-of-type': { px: '0 !important' },
                          '&:first-of-type': { pl: '0 !important' },
                          py: theme => `${theme.spacing(0.75)} !important`
                        }
                      }}
                    >
                      <TableRow>
                        <TableCell>
                          <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                            Base Commission Rate
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ color: 'text.secondary' }}>
                            {formData.commissionRate ? (formData.commissionRate * 100).toFixed(1) : 0}% for local agents
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                            Minimum Transaction Amount
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ color: 'text.secondary' }}>
                            TZS {formData.minTransactionAmount?.toLocaleString() || '100,000'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                            Super Agent Commission Rate
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ color: 'text.secondary' }}>
                            {formData.superAgentCommissionRate
                              ? (formData.superAgentCommissionRate * 100).toFixed(1)
                              : 20}
                            % of total commission
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                            Fixed Portion (Super Agent)
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ color: 'text.secondary' }}>
                            {formData.superAgentFixedRate ? (formData.superAgentFixedRate * 100).toFixed(1) : 6}% of
                            super agent commission
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                            Variable Portion (Super Agent)
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ color: 'text.secondary' }}>
                            {formData.superAgentVariableRate ? (formData.superAgentVariableRate * 100).toFixed(1) : 14}%
                            of super agent commission
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                            Franchise Multiplier
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ color: 'text.secondary' }}>
                            {formData.franchiseMultiplier || 4.5}x for expected turnover calculation
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* KPI Weights */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title='KPI Weights Configuration' titleTypographyProps={{ variant: 'h6' }} />
              <CardContent>
                <TableContainer>
                  <Table>
                    <TableBody
                      sx={{
                        '& .MuiTableCell-root': {
                          borderBottom: 0,
                          verticalAlign: 'top',
                          '&:last-of-type': { px: '0 !important' },
                          '&:first-of-type': { pl: '0 !important' },
                          py: theme => `${theme.spacing(0.75)} !important`
                        }
                      }}
                    >
                      <TableRow>
                        <TableCell>
                          <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                            Activeness Weight
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ color: 'text.secondary' }}>
                            {formData.kpiWeights?.activeness || 0}%
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                            Value Transacted Weight
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ color: 'text.secondary' }}>
                            {formData.kpiWeights?.valueTransacted || 0}%
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                            Unique Agents Weight
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ color: 'text.secondary' }}>
                            {formData.kpiWeights?.uniqueAgents || 0}%
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Typography noWrap sx={{ fontWeight: 600, color: 'text.secondary' }}>
                            Total Weight
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            sx={{
                              fontWeight: 600,
                              color:
                                (formData.kpiWeights?.activeness || 0) +
                                  (formData.kpiWeights?.valueTransacted || 0) +
                                  (formData.kpiWeights?.uniqueAgents || 0) ===
                                100
                                  ? 'success.main'
                                  : 'error.main'
                            }}
                          >
                            {(formData.kpiWeights?.activeness || 0) +
                              (formData.kpiWeights?.valueTransacted || 0) +
                              (formData.kpiWeights?.uniqueAgents || 0)}
                            %
                            {(formData.kpiWeights?.activeness || 0) +
                              (formData.kpiWeights?.valueTransacted || 0) +
                              (formData.kpiWeights?.uniqueAgents || 0) !==
                              100 && ' (Must equal 100%)'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />}
              label='I have reviewed and confirmed all commission configuration details.'
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant='contained' size='large' onClick={handleSubmit} disabled={!confirmed || saving}>
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  )
}

export default StepCommissionReview
