// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'

// ** Custom Component Import
import CustomTextField from 'src/@core/components/mui/text-field'

const StepCommissionUsage = ({ formData, setFormData }: { formData: any; setFormData: (data: any) => void }) => {
  return (
    <Grid container spacing={4}>
      <Grid item xs={12}>
        <Typography variant='h6' sx={{ mb: 3 }}>
          Agent Commission Settings
        </Typography>
        <Typography variant='body2' sx={{ mb: 4, color: 'text.secondary' }}>
          Configure commission rates and settings for different agent types.
        </Typography>
      </Grid>

      {/* Super Agent Settings */}
      <Grid item xs={12}>
        <Card>
          <CardHeader title='Super Agent Commission Settings' titleTypographyProps={{ variant: 'h6' }} />
          <CardContent>
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <CustomTextField
                  fullWidth
                  type='number'
                  label='Super Agent Commission Rate (%)'
                  placeholder='20'
                  value={
                    formData.superAgentCommissionRate !== undefined
                      ? (Math.round(formData.superAgentCommissionRate * 100 * 10) / 10).toString()
                      : ''
                  }
                  onChange={e => {
                    const value = parseFloat(e.target.value)
                    setFormData({
                      ...formData,
                      superAgentCommissionRate: isNaN(value) ? 0 : Math.round(value * 10) / 1000
                    })
                  }}
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                  helperText='Percentage of total commission that goes to super agents (20% = 0.20)'
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomTextField
                  fullWidth
                  type='number'
                  label='Fixed Commission Portion (%)'
                  placeholder='30'
                  value={
                    formData.superAgentFixedRate !== undefined
                      ? (Math.round(formData.superAgentFixedRate * 100 * 10) / 10).toString()
                      : ''
                  }
                  onChange={e => {
                    const value = parseFloat(e.target.value)
                    setFormData({
                      ...formData,
                      superAgentFixedRate: isNaN(value) ? 0 : Math.round(value * 10) / 1000
                    })
                  }}
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                  helperText='Fixed commission for super agent (30%)'
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomTextField
                  fullWidth
                  type='number'
                  label='Variable Commission Portion (%)'
                  placeholder='70'
                  value={
                    formData.superAgentVariableRate !== undefined
                      ? (Math.round(formData.superAgentVariableRate * 100 * 10) / 10).toString()
                      : ''
                  }
                  onChange={e => {
                    const value = parseFloat(e.target.value)
                    setFormData({
                      ...formData,
                      superAgentVariableRate: isNaN(value) ? 0 : Math.round(value * 10) / 1000
                    })
                  }}
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                  helperText='Variable commission based on KPIs (70%)'
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Franchise Settings */}
      <Grid item xs={12}>
        <Card>
          <CardHeader title='Franchise Commission Settings' titleTypographyProps={{ variant: 'h6' }} />
          <CardContent>
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <CustomTextField
                  fullWidth
                  type='number'
                  label='Turnover Multiplier'
                  placeholder='4.5'
                  value={formData.franchiseMultiplier !== undefined ? formData.franchiseMultiplier.toString() : ''}
                  onChange={e => {
                    const value = parseFloat(e.target.value)
                    setFormData({
                      ...formData,
                      franchiseMultiplier: isNaN(value) ? 4.5 : value
                    })
                  }}
                  inputProps={{ min: 0, step: 0.1 }}
                  helperText='Multiplier for expected turnover calculation (agent value × 4.5)'
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant='subtitle1' sx={{ mb: 2 }}>
                  Payband Configuration
                </Typography>
                <Typography variant='body2' sx={{ mb: 3, color: 'text.secondary' }}>
                  Define performance bands based on actual vs expected turnover percentage
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <CustomTextField
                      fullWidth
                      type='number'
                      label='Excellent (≥100%) Payband (%)'
                      placeholder='100'
                      value={
                        formData.paybandA !== undefined
                          ? (Math.round(formData.paybandA * 100 * 10) / 10).toString()
                          : ''
                      }
                      onChange={e => {
                        const value = parseFloat(e.target.value)
                        setFormData({
                          ...formData,
                          paybandA: isNaN(value) ? 1 : Math.round(value * 10) / 1000
                        })
                      }}
                      inputProps={{ min: 0, max: 100, step: 0.1 }}
                      helperText='Commission rate for excellent performance (≥100% expected turnover)'
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomTextField
                      fullWidth
                      type='number'
                      label='Good (80-99%) Payband (%)'
                      placeholder='80'
                      value={
                        formData.paybandB !== undefined
                          ? (Math.round(formData.paybandB * 100 * 10) / 10).toString()
                          : ''
                      }
                      onChange={e => {
                        const value = parseFloat(e.target.value)
                        setFormData({
                          ...formData,
                          paybandB: isNaN(value) ? 0.8 : Math.round(value * 10) / 1000
                        })
                      }}
                      inputProps={{ min: 0, max: 100, step: 0.1 }}
                      helperText='Commission rate for good performance (80-99% expected turnover)'
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomTextField
                      fullWidth
                      type='number'
                      label='Average (60-79%) Payband (%)'
                      placeholder='60'
                      value={
                        formData.paybandC !== undefined
                          ? (Math.round(formData.paybandC * 100 * 10) / 10).toString()
                          : ''
                      }
                      onChange={e => {
                        const value = parseFloat(e.target.value)
                        setFormData({
                          ...formData,
                          paybandC: isNaN(value) ? 0.6 : Math.round(value * 10) / 1000
                        })
                      }}
                      inputProps={{ min: 0, max: 100, step: 0.1 }}
                      helperText='Commission rate for average performance (60-79% expected turnover)'
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomTextField
                      fullWidth
                      type='number'
                      label='Below Average (40-59%) Payband (%)'
                      placeholder='40'
                      value={
                        formData.paybandD !== undefined
                          ? (Math.round(formData.paybandD * 100 * 10) / 10).toString()
                          : ''
                      }
                      onChange={e => {
                        const value = parseFloat(e.target.value)
                        setFormData({
                          ...formData,
                          paybandD: isNaN(value) ? 0.4 : Math.round(value * 10) / 1000
                        })
                      }}
                      inputProps={{ min: 0, max: 100, step: 0.1 }}
                      helperText='Commission rate for below average performance (40-59% expected turnover)'
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomTextField
                      fullWidth
                      type='number'
                      label='Poor (<40%) Payband (%)'
                      placeholder='20'
                      value={
                        formData.paybandE !== undefined
                          ? (Math.round(formData.paybandE * 100 * 10) / 10).toString()
                          : ''
                      }
                      onChange={e => {
                        const value = parseFloat(e.target.value)
                        setFormData({
                          ...formData,
                          paybandE: isNaN(value) ? 0.2 : Math.round(value * 10) / 1000
                        })
                      }}
                      inputProps={{ min: 0, max: 100, step: 0.1 }}
                      helperText='Commission rate for poor performance (<40% expected turnover)'
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* KPI Weights Configuration */}
      <Grid item xs={12}>
        <Card>
          <CardHeader title='KPI Weights Configuration' titleTypographyProps={{ variant: 'h6' }} />
          <CardContent>
            <Typography variant='body2' sx={{ mb: 3, color: 'text.secondary' }}>
              Configure the weights for Super Agent KPI calculations. Total must equal 100%.
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} sm={4}>
                <CustomTextField
                  fullWidth
                  type='number'
                  label='Activeness Weight (%)'
                  placeholder='55'
                  value={formData.kpiWeights?.activeness !== undefined ? formData.kpiWeights.activeness.toString() : ''}
                  onChange={e => {
                    const value = parseInt(e.target.value)
                    setFormData({
                      ...formData,
                      kpiWeights: {
                        ...formData.kpiWeights,
                        activeness: isNaN(value) ? 0 : value
                      }
                    })
                  }}
                  inputProps={{ min: 0, max: 100 }}
                  helperText='Weight for agent activeness KPI (55%)'
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <CustomTextField
                  fullWidth
                  type='number'
                  label='Value Transacted Weight (%)'
                  placeholder='20'
                  value={
                    formData.kpiWeights?.valueTransacted !== undefined
                      ? formData.kpiWeights.valueTransacted.toString()
                      : ''
                  }
                  onChange={e => {
                    const value = parseInt(e.target.value)
                    setFormData({
                      ...formData,
                      kpiWeights: {
                        ...formData.kpiWeights,
                        valueTransacted: isNaN(value) ? 0 : value
                      }
                    })
                  }}
                  inputProps={{ min: 0, max: 100 }}
                  helperText='Weight for transaction value KPI (20%)'
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <CustomTextField
                  fullWidth
                  type='number'
                  label='Unique Agents Weight (%)'
                  placeholder='25'
                  value={
                    formData.kpiWeights?.uniqueAgents !== undefined ? formData.kpiWeights.uniqueAgents.toString() : ''
                  }
                  onChange={e => {
                    const value = parseInt(e.target.value)
                    setFormData({
                      ...formData,
                      kpiWeights: {
                        ...formData.kpiWeights,
                        uniqueAgents: isNaN(value) ? 0 : value
                      }
                    })
                  }}
                  inputProps={{ min: 0, max: 100 }}
                  helperText='Weight for unique agents served KPI (25%)'
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant='body2' sx={{ fontWeight: 600 }}>
                  Total Weight:{' '}
                  {(formData.kpiWeights?.activeness || 0) +
                    (formData.kpiWeights?.valueTransacted || 0) +
                    (formData.kpiWeights?.uniqueAgents || 0)}
                  %
                  {(formData.kpiWeights?.activeness || 0) +
                    (formData.kpiWeights?.valueTransacted || 0) +
                    (formData.kpiWeights?.uniqueAgents || 0) !==
                    100 && <span style={{ color: 'red' }}> (Must equal 100%)</span>}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default StepCommissionUsage
