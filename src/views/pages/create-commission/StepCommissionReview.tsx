// src/views/pages/create-commission/StepCommissionReview.tsx
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
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Components Imports
import CustomChip from 'src/@core/components/mui/chip'

interface StepCommissionReviewProps {
  formData: any
  onSuccess?: () => void
  onConfirmedChange?: (confirmed: boolean) => void
}

const StepCommissionReview = ({ formData, onConfirmedChange }: StepCommissionReviewProps) => {
  const [confirmed, setConfirmed] = useState(false)

  const isSuperAgent = formData.type === 'SUPER_AGENT'

  const handleConfirmationChange = (checked: boolean) => {
    setConfirmed(checked)
    if (onConfirmedChange) {
      onConfirmedChange(checked)
    }
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={6}>
        {/* Header */}
        <Grid item xs={12}>
          <Box sx={{ mb: 2 }}>
            <Typography variant='h4' sx={{ mb: 1 }}>
              Review Configuration
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>
              Please review your {isSuperAgent ? 'Super Agent' : 'Franchise'} commission configuration below and confirm
              before saving.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip
              label={isSuperAgent ? 'Super Agent' : 'Franchise'}
              color={isSuperAgent ? 'primary' : 'info'}
              size='small'
              variant='outlined'
            />
            <Chip
              label={formData.status || 'active'}
              color={formData.status === 'active' ? 'success' : 'warning'}
              size='small'
              variant='outlined'
            />
          </Box>
        </Grid>

        {/* Basic Configuration */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title='Basic Configuration'
              titleTypographyProps={{ variant: 'h6' }}
              avatar={<Icon icon='tabler:settings' fontSize='1.5rem' />}
            />
            <Divider />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableBody
                    sx={{
                      '& .MuiTableCell-root': {
                        borderBottom: '0',
                        borderColor: 'divider',
                        verticalAlign: 'top',
                        '&:last-of-type': { px: '0 !important' },
                        '&:first-of-type': { pl: '0 !important' },
                        py: theme => `${theme.spacing(1.25)} !important`
                      }
                    }}
                  >
                    <TableRow>
                      <TableCell sx={{ width: '30%' }}>
                        <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                          Commission Title
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: 'text.primary', fontWeight: 500 }}>
                          {formData.title || 'Not set'}
                        </Typography>
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
                        <Typography sx={{ color: 'text.primary' }}>
                          {formData.description || 'No description provided'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                          Commission Type
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={isSuperAgent ? 'Super Agent Commission' : 'Franchise Commission'}
                          color={isSuperAgent ? 'primary' : 'info'}
                          size='small'
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                          Date Range
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ color: 'text.primary' }}>
                          {formData.startDate
                            ? `${new Date(formData.startDate + 'T00:00:00').toLocaleDateString()} - ${
                                formData.endDate
                                  ? new Date(formData.endDate + 'T00:00:00').toLocaleDateString()
                                  : 'Ongoing'
                              }`
                            : 'Not specified'}
                        </Typography>
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
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Commission Rates */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title={isSuperAgent ? 'Super Agent Commission Structure' : 'Franchise Commission Structure'}
              titleTypographyProps={{ variant: 'h6' }}
              avatar={<Icon icon='tabler:percentage' fontSize='1.5rem' />}
            />
            <Divider />
            <CardContent>
              {isSuperAgent ? (
                <>
                  {/* Super Agent Commission Breakdown */}
                  <Typography variant='subtitle2' sx={{ mb: 2, color: 'primary.main' }}>
                    Commission Breakdown
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableBody
                        sx={{
                          '& .MuiTableCell-root': {
                            borderBottom: '0',
                            borderColor: 'divider',
                            verticalAlign: 'top',
                            '&:last-of-type': { px: '0 !important' },
                            '&:first-of-type': { pl: '0 !important' },
                            py: theme => `${theme.spacing(1.25)} !important`
                          }
                        }}
                      >
                        <TableRow>
                          <TableCell sx={{ width: '35%' }}>
                            <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                              Super Agent Commission Rate
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ color: 'text.primary', fontWeight: 500 }}>
                              {formData.superAgentCommissionRate
                                ? (formData.superAgentCommissionRate * 100).toFixed(1)
                                : '20.0'}
                              % of total agent commissions
                            </Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                              Fixed Commission Portion
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ color: 'text.primary' }}>
                              {formData.superAgentFixedRate ? (formData.superAgentFixedRate * 100).toFixed(1) : '30.0'}%
                              (Guaranteed)
                            </Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                              Variable Commission Portion
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ color: 'text.primary' }}>
                              {formData.superAgentVariableRate
                                ? (formData.superAgentVariableRate * 100).toFixed(1)
                                : '70.0'}
                              % (KPI-based)
                            </Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow sx={{ '& .MuiTableCell-root': { borderBottom: 0 } }}>
                          <TableCell>
                            <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                              Performance Threshold
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ color: 'text.primary' }}>
                              TZS {formData.minTransactionAmount?.toLocaleString() || '100,000'} minimum per agent
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : (
                <>
                  {/* Franchise Commission Settings */}
                  <Typography variant='subtitle2' sx={{ mb: 2, color: 'info.main' }}>
                    Commission Model
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableBody
                        sx={{
                          '& .MuiTableCell-root': {
                            borderBottom: '0',
                            borderColor: 'divider',
                            verticalAlign: 'top',
                            '&:last-of-type': { px: '0 !important' },
                            '&:first-of-type': { pl: '0 !important' },
                            py: theme => `${theme.spacing(1.25)} !important`
                          }
                        }}
                      >
                        <TableRow>
                          <TableCell sx={{ width: '35%' }}>
                            <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                              Base Commission Rate
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ color: 'text.primary', fontWeight: 500 }}>
                              {formData.franchiseBaseRate ? (formData.franchiseBaseRate * 100).toFixed(2) : '0.05'}% of
                              gross turnover
                            </Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                              Turnover Multiplier
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ color: 'text.primary' }}>
                              {formData.franchiseMultiplier || '4.5'}x capital advanced
                            </Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                              Performance Requirement
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ color: 'text.primary' }}>
                              ≥ {(formData.franchiseMultiplier || 4.5) * 100}% of deposited capital
                            </Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow sx={{ '& .MuiTableCell-root': { borderBottom: 0 } }}>
                          <TableCell>
                            <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                              Minimum Transaction
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ color: 'text.primary' }}>
                              TZS {formData.minTransactionAmount?.toLocaleString() || '100,000'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* KPI Weights / Paybands */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title={isSuperAgent ? 'KPI Weights Configuration' : 'Performance Paybands'}
              titleTypographyProps={{ variant: 'h6' }}
              avatar={<Icon icon={isSuperAgent ? 'tabler:chart-bar' : 'tabler:chart-pie'} fontSize='1.5rem' />}
            />
            <Divider />
            <CardContent>
              {isSuperAgent ? (
                <>
                  {/* KPI Weights Table */}
                  <TableContainer>
                    <Table>
                      <TableBody
                        sx={{
                          '& .MuiTableCell-root': {
                            borderBottom: '0',
                            borderColor: 'divider',
                            verticalAlign: 'top',
                            '&:last-of-type': { px: '0 !important' },
                            '&:first-of-type': { pl: '0 !important' },
                            py: theme => `${theme.spacing(1.25)} !important`
                          }
                        }}
                      >
                        <TableRow>
                          <TableCell sx={{ width: '35%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
                              <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                                Agent Activeness
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ color: 'text.primary', fontWeight: 500 }}>
                              {formData.kpiWeights?.activeness || 55}%
                            </Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                              <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                                Value Transacted
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ color: 'text.primary', fontWeight: 500 }}>
                              {formData.kpiWeights?.valueTransacted || 20}%
                            </Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                              <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                                Unique Agents
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ color: 'text.primary', fontWeight: 500 }}>
                              {formData.kpiWeights?.uniqueAgents || 25}%
                            </Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow sx={{ '& .MuiTableCell-root': { borderBottom: 0 } }}>
                          <TableCell>
                            <Typography noWrap sx={{ fontWeight: 600, color: 'text.secondary' }}>
                              Total Weight
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                              </Typography>
                              {(formData.kpiWeights?.activeness || 0) +
                                (formData.kpiWeights?.valueTransacted || 0) +
                                (formData.kpiWeights?.uniqueAgents || 0) !==
                                100 && <Chip label='Must equal 100%' color='error' size='small' variant='outlined' />}
                            </Box>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : (
                <>
                  {/* Paybands Table */}
                  <TableContainer>
                    <Table>
                      <TableBody
                        sx={{
                          '& .MuiTableCell-root': {
                            borderBottom: '0',
                            borderColor: 'divider',
                            py: theme => `${theme.spacing(1.25)} !important`
                          }
                        }}
                      >
                        {(
                          formData.paybands || [
                            { min: 100, max: Infinity, name: 'Excellent', apportionRate: 1.0, clawbackPercentage: 0 },
                            { min: 80, max: 99, name: 'Good', apportionRate: 0.8, clawbackPercentage: 20 },
                            { min: 60, max: 79, name: 'Average', apportionRate: 0.6, clawbackPercentage: 40 },
                            { min: 40, max: 59, name: 'Below Average', apportionRate: 0.4, clawbackPercentage: 60 },
                            { min: 0, max: 39, name: 'Poor', apportionRate: 0.2, clawbackPercentage: 80 }
                          ]
                        ).map((payband: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell sx={{ width: '25%' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    bgcolor:
                                      payband.name === 'Excellent'
                                        ? 'success.main'
                                        : payband.name === 'Good'
                                        ? 'primary.main'
                                        : payband.name === 'Average'
                                        ? 'warning.main'
                                        : payband.name === 'Below Average'
                                        ? 'error.light'
                                        : 'error.main'
                                  }}
                                />
                                <Typography variant='body2' sx={{ fontWeight: 600 }}>
                                  {payband.name}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ width: '25%' }}>
                              <Typography variant='body2' color='text.secondary'>
                                {payband.min}%{payband.max === Infinity ? '+' : ` - ${payband.max}%`}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ width: '25%' }}>
                              <Chip
                                label={`Apportion: ${(payband.apportionRate * 100).toFixed(0)}%`}
                                size='small'
                                color={
                                  payband.apportionRate >= 0.8
                                    ? 'success'
                                    : payband.apportionRate >= 0.6
                                    ? 'warning'
                                    : 'error'
                                }
                                variant='outlined'
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={`Clawback: ${payband.clawbackPercentage}%`}
                                size='small'
                                color={
                                  payband.clawbackPercentage <= 20
                                    ? 'success'
                                    : payband.clawbackPercentage <= 60
                                    ? 'warning'
                                    : 'error'
                                }
                                variant='outlined'
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Confirmation */}
        <Grid item xs={12}>
          <CardContent sx={{ py: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={confirmed}
                  onChange={e => handleConfirmationChange(e.target.checked)}
                  color='success'
                />
              }
              label={
                <Typography variant='body1' sx={{ fontWeight: 500 }}>
                  I have reviewed and confirmed all commission configuration details
                </Typography>
              }
            />
          </CardContent>
        </Grid>
      </Grid>
    </Box>
  )
}

export default StepCommissionReview
