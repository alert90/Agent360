// src/views/pages/create-commission/StepCommissionUsage.tsx
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'

// ** Custom Component Import
import CustomTextField from 'src/@core/components/mui/text-field'

const StepCommissionUsage = ({ formData, setFormData }: { formData: any; setFormData: (data: any) => void }) => {
  const isSuperAgent = formData.type === 'SUPER_AGENT'

  return (
    <Grid container spacing={4}>
      <Grid item xs={12}>
        <Typography variant='h6' sx={{ mb: 3 }}>
          {isSuperAgent ? 'Super Agent Commission Settings' : 'Franchise Commission Settings'}
        </Typography>
        <Typography variant='body2' sx={{ mb: 4, color: 'text.secondary' }}>
          {isSuperAgent
            ? 'Configure commission rates and KPI weights for Super Agent calculations.'
            : 'Configure multiplier, base rate, and payband settings for Franchise calculations.'}
        </Typography>
      </Grid>

      {isSuperAgent ? (
        <>
          {/* Super Agent Specific Settings */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title='Commission Breakdown' titleTypographyProps={{ variant: 'h6' }} />
              <CardContent>
                <Typography variant='body2' sx={{ mb: 3, color: 'text.secondary' }}>
                  Configure the fixed and variable portions of the Super Agent commission.
                </Typography>
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
                      helperText='Percentage of total commission that goes to super agents (e.g., 20%)'
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
                      helperText='Fixed commission portion (e.g., 30%)'
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
                      helperText='Variable commission portion based on KPIs (e.g., 70%)'
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomTextField
                      fullWidth
                      type='number'
                      label='Performance Threshold (TZS)'
                      placeholder='100000'
                      value={formData.minTransactionAmount || ''}
                      onChange={e => {
                        const value = parseFloat(e.target.value)
                        setFormData({
                          ...formData,
                          minTransactionAmount: isNaN(value) ? 100000 : value
                        })
                      }}
                      inputProps={{ min: 0 }}
                      helperText='Minimum transaction amount for agent eligibility'
                    />
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
                  Configure the weights for KPI calculations. Total must equal 100%.
                </Typography>
                <Grid container spacing={4}>
                  <Grid item xs={12} sm={4}>
                    <CustomTextField
                      fullWidth
                      type='number'
                      label='Agent Activeness Weight (%)'
                      placeholder='55'
                      value={
                        formData.kpiWeights?.activeness !== undefined ? formData.kpiWeights.activeness.toString() : ''
                      }
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
                      helperText='Weight for agent activeness KPI (recommended: 55%)'
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
                      helperText='Weight for transaction value KPI (recommended: 20%)'
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <CustomTextField
                      fullWidth
                      type='number'
                      label='Unique Agents Weight (%)'
                      placeholder='25'
                      value={
                        formData.kpiWeights?.uniqueAgents !== undefined
                          ? formData.kpiWeights.uniqueAgents.toString()
                          : ''
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
                      helperText='Weight for unique agents served KPI (recommended: 25%)'
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

          {/* KPI Bands Configuration */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title='KPI Performance Bands' titleTypographyProps={{ variant: 'h6' }} />
              <CardContent>
                <Typography variant='body2' sx={{ mb: 3, color: 'text.secondary' }}>
                  Configure the KPI performance bands and their corresponding rates.
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { label: 'Below 50%', min: 0, max: 50, defaultRate: 0 },
                    { label: '51% - 60%', min: 51, max: 60, defaultRate: 20 },
                    { label: '61% - 70%', min: 61, max: 70, defaultRate: 40 },
                    { label: '71% - 80%', min: 71, max: 80, defaultRate: 60 },
                    { label: '81% - 90%', min: 81, max: 90, defaultRate: 80 },
                    { label: '91% - 100%', min: 91, max: 100, defaultRate: 100 }
                  ].map((band, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <CustomTextField
                        fullWidth
                        type='number'
                        label={`${band.label} Rate (%)`}
                        value={
                          formData.kpiBands?.[index]?.rate !== undefined
                            ? formData.kpiBands[index].rate.toString()
                            : band.defaultRate.toString()
                        }
                        onChange={e => {
                          const value = parseInt(e.target.value)
                          const newBands = [
                            ...(formData.kpiBands || [
                              { min: 0, max: 50, rate: 0 },
                              { min: 51, max: 60, rate: 20 },
                              { min: 61, max: 70, rate: 40 },
                              { min: 71, max: 80, rate: 60 },
                              { min: 81, max: 90, rate: 80 },
                              { min: 91, max: 100, rate: 100 }
                            ])
                          ]
                          newBands[index] = { ...band, rate: isNaN(value) ? 0 : value }
                          setFormData({ ...formData, kpiBands: newBands })
                        }}
                        inputProps={{ min: 0, max: 100 }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </>
      ) : (
        <>
          {/* Franchise Specific Settings */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title='Franchise Commission Model' titleTypographyProps={{ variant: 'h6' }} />
              <CardContent>
                <Typography variant='body2' sx={{ mb: 3, color: 'text.secondary' }}>
                  Configure the base commission rate and turnover multiplier for Franchise calculations.
                </Typography>
                <Grid container spacing={4}>
                  <Grid item xs={12} sm={6}>
                    <CustomTextField
                      fullWidth
                      type='number'
                      label='Base Commission Rate (%)'
                      placeholder='0.05'
                      value={
                        formData.franchiseBaseRate !== undefined
                          ? (formData.franchiseBaseRate * 100).toString()
                          : '0.05'
                      }
                      onChange={e => {
                        const value = parseFloat(e.target.value)
                        setFormData({
                          ...formData,
                          franchiseBaseRate: isNaN(value) ? 0.0005 : value / 100
                        })
                      }}
                      inputProps={{ min: 0, step: 0.01 }}
                      helperText='Base commission rate on capital advanced (e.g., 0.05%)'
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <CustomTextField
                      fullWidth
                      type='number'
                      label='Turnover Multiplier'
                      placeholder='4.5'
                      value={
                        formData.franchiseMultiplier !== undefined ? formData.franchiseMultiplier.toString() : '4.5'
                      }
                      onChange={e => {
                        const value = parseFloat(e.target.value)
                        setFormData({
                          ...formData,
                          franchiseMultiplier: isNaN(value) ? 4.5 : value
                        })
                      }}
                      inputProps={{ min: 0, step: 0.1 }}
                      helperText='Multiplier for expected turnover calculation (e.g., 4.5x)'
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Paybands Configuration */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title='Performance Paybands' titleTypographyProps={{ variant: 'h6' }} />
              <CardContent>
                <Typography variant='body2' sx={{ mb: 3, color: 'text.secondary' }}>
                  Configure the performance levels, apportion rates, and clawback percentages.
                </Typography>
                {[
                  { name: 'Excellent', min: 100, max: Infinity, defaultApportion: 1.0, defaultClawback: 0 },
                  { name: 'Good', min: 80, max: 99, defaultApportion: 0.8, defaultClawback: 20 },
                  { name: 'Average', min: 60, max: 79, defaultApportion: 0.6, defaultClawback: 40 },
                  { name: 'Below Average', min: 40, max: 59, defaultApportion: 0.4, defaultClawback: 60 },
                  { name: 'Poor', min: 0, max: 39, defaultApportion: 0.2, defaultClawback: 80 }
                ].map((payband, index) => (
                  <Grid container spacing={2} key={index} sx={{ mb: 3 }}>
                    <Grid item xs={12}>
                      <Typography variant='subtitle2' sx={{ mb: 1 }}>
                        {payband.name} ({payband.min}%{payband.max !== Infinity ? ` - ${payband.max}%` : '+'})
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <CustomTextField
                        fullWidth
                        type='number'
                        label='Apportion Rate'
                        placeholder={payband.defaultApportion.toString()}
                        value={
                          formData.paybands?.[index]?.apportionRate !== undefined
                            ? (formData.paybands[index].apportionRate * 100).toString()
                            : (payband.defaultApportion * 100).toString()
                        }
                        onChange={e => {
                          const value = parseFloat(e.target.value)
                          const newPaybands = [
                            ...(formData.paybands || [
                              { min: 100, max: Infinity, name: 'Excellent', apportionRate: 1.0, clawbackPercentage: 0 },
                              { min: 80, max: 99, name: 'Good', apportionRate: 0.8, clawbackPercentage: 20 },
                              { min: 60, max: 79, name: 'Average', apportionRate: 0.6, clawbackPercentage: 40 },
                              { min: 40, max: 59, name: 'Below Average', apportionRate: 0.4, clawbackPercentage: 60 },
                              { min: 0, max: 39, name: 'Poor', apportionRate: 0.2, clawbackPercentage: 80 }
                            ])
                          ]
                          newPaybands[index] = {
                            ...newPaybands[index],
                            apportionRate: isNaN(value) ? 0 : value / 100
                          }
                          setFormData({ ...formData, paybands: newPaybands })
                        }}
                        inputProps={{ min: 0, max: 100 }}
                        helperText='Percentage of commission paid'
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <CustomTextField
                        fullWidth
                        type='number'
                        label='Clawback (%)'
                        placeholder={payband.defaultClawback.toString()}
                        value={
                          formData.paybands?.[index]?.clawbackPercentage !== undefined
                            ? formData.paybands[index].clawbackPercentage.toString()
                            : payband.defaultClawback.toString()
                        }
                        onChange={e => {
                          const value = parseInt(e.target.value)
                          const newPaybands = [
                            ...(formData.paybands || [
                              { min: 100, max: Infinity, name: 'Excellent', apportionRate: 1.0, clawbackPercentage: 0 },
                              { min: 80, max: 99, name: 'Good', apportionRate: 0.8, clawbackPercentage: 20 },
                              { min: 60, max: 79, name: 'Average', apportionRate: 0.6, clawbackPercentage: 40 },
                              { min: 40, max: 59, name: 'Below Average', apportionRate: 0.4, clawbackPercentage: 60 },
                              { min: 0, max: 39, name: 'Poor', apportionRate: 0.2, clawbackPercentage: 80 }
                            ])
                          ]
                          newPaybands[index] = {
                            ...newPaybands[index],
                            clawbackPercentage: isNaN(value) ? 0 : value
                          }
                          setFormData({ ...formData, paybands: newPaybands })
                        }}
                        inputProps={{ min: 0, max: 100 }}
                        helperText='Percentage clawed back'
                      />
                    </Grid>
                  </Grid>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </>
      )}

      {/* Schedule Configuration */}
      <Grid item xs={12}>
        <Card>
          <CardHeader title='Commission Schedule' titleTypographyProps={{ variant: 'h6' }} />
          <CardContent>
            <Typography variant='body2' sx={{ mb: 3, color: 'text.secondary' }}>
              Configure when this commission calculation should run.
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <CustomTextField
                  fullWidth
                  type='date'
                  label='Start Date'
                  value={formData.startDate || ''}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  helperText='When this configuration becomes active'
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomTextField
                  fullWidth
                  type='date'
                  label='End Date'
                  value={formData.endDate || ''}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  helperText='When this configuration expires (optional)'
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default StepCommissionUsage
