// src/views/pages/create-commission/StepCommissionType.tsx
import { ChangeEvent, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'

// ** Custom Component Import
import CustomTextField from 'src/@core/components/mui/text-field'

// ** Type Imports
import { CustomRadioIconsData, CustomRadioIconsProps } from 'src/@core/components/custom-radio/types'

// ** Custom Components Imports
import CustomRadioIcons from 'src/@core/components/custom-radio/icons'

interface IconType {
  icon: CustomRadioIconsProps['icon']
  iconProps: CustomRadioIconsProps['iconProps']
}

const data: CustomRadioIconsData[] = [
  {
    isSelected: true,
    value: 'SUPER_AGENT',
    content: 'Commission for Super Agents managing local agents with KPI-based performance.',
    title: (
      <Typography variant='h6' sx={{ mb: 1 }}>
        Super Agent
      </Typography>
    )
  },
  {
    value: 'FRANCHISE',
    content: 'Commission for Franchises based on capital advanced and turnover multiplier.',
    title: (
      <Typography variant='h6' sx={{ mb: 1 }}>
        Franchise
      </Typography>
    )
  }
]

const StepCommissionType = ({ formData, setFormData }: { formData: any; setFormData: (data: any) => void }) => {
  const initialIconSelected: string = data.filter(item => item.isSelected)[
    data.filter(item => item.isSelected).length - 1
  ].value

  // ** States
  const [selectedRadio, setSelectedRadio] = useState<string>(formData.type || initialIconSelected)

  // ** Hook
  const theme = useTheme()

  const icons: IconType[] = [
    {
      icon: 'tabler:user-star',
      iconProps: { fontSize: '2.5rem', style: { marginBottom: 8 }, color: theme.palette.primary.main }
    },
    {
      icon: 'tabler:building-store',
      iconProps: { fontSize: '2.5rem', style: { marginBottom: 8 }, color: theme.palette.warning.main }
    }
  ]

  const handleRadioChange = (prop: string | ChangeEvent<HTMLInputElement>) => {
    const value = typeof prop === 'string' ? prop : (prop.target as HTMLInputElement).value
    setSelectedRadio(value)

    // Reset type-specific fields when switching types
    if (value === 'SUPER_AGENT') {
      setFormData({
        ...formData,
        type: value,
        franchiseMultiplier: 4.5,
        franchiseBaseRate: 0.0005
      })
    } else {
      setFormData({
        ...formData,
        type: value,
        superAgentCommissionRate: 0.2,
        superAgentFixedRate: 0.3,
        superAgentVariableRate: 0.7,
        kpiWeights: {
          activeness: 55,
          valueTransacted: 20,
          uniqueAgents: 25
        }
      })
    }
  }

  return (
    <>
      <Grid container sx={{ mb: 6 }} spacing={4}>
        {data.map((item, index) => (
          <CustomRadioIcons
            key={index}
            data={data[index]}
            icon={icons[index].icon}
            selected={selectedRadio}
            name='custom-radios-commission'
            gridProps={{ sm: 6, xs: 12 }}
            handleChange={handleRadioChange}
            iconProps={icons[index].iconProps}
          />
        ))}
      </Grid>

      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Typography variant='h6' sx={{ mb: 3 }}>
            {selectedRadio === 'SUPER_AGENT' ? 'Super Agent Commission Structure' : 'Franchise Commission Structure'}
          </Typography>
          <Typography variant='body2' sx={{ mb: 4, color: 'text.secondary' }}>
            {selectedRadio === 'SUPER_AGENT'
              ? 'Super Agents earn 20% commission from total transactions of served agents with KPI-based performance metrics.'
              : 'Franchises earn 0.05% of gross turnover with performance-based multipliers and paybands.'}
          </Typography>

          {selectedRadio === 'SUPER_AGENT' ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main' }} />
                <Typography variant='body2'>
                  <strong>Fixed Commission:</strong> 30% of total eligible commission
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main' }} />
                <Typography variant='body2'>
                  <strong>Variable Commission:</strong> 70% based on KPI performance
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'warning.main' }} />
                <Typography variant='body2'>
                  <strong>Performance Threshold:</strong> Agents must transact ≥ 100,000 TZS
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main' }} />
                <Typography variant='body2'>
                  <strong>Base Commission:</strong> 0.05% of Capital Advanced
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main' }} />
                <Typography variant='body2'>
                  <strong>Multiplier:</strong> 4.5x turnover requirement
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'warning.main' }} />
                <Typography variant='body2'>
                  <strong>Paybands:</strong> Performance-based apportion rates with clawback
                </Typography>
              </Box>
            </Box>
          )}
        </Grid>

        <Grid item xs={12} sm={6}>
          <CustomTextField
            fullWidth
            type='number'
            label='Base Commission Rate (%)'
            placeholder={selectedRadio === 'SUPER_AGENT' ? '20' : '0.05'}
            value={formData.commissionRate || ''}
            onChange={e => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })}
            helperText={
              selectedRadio === 'SUPER_AGENT'
                ? 'Percentage of total commission for super agents (e.g., 20%)'
                : 'Base commission rate for franchises (e.g., 0.05%)'
            }
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <CustomTextField
            fullWidth
            type='number'
            label='Minimum Transaction Amount (TZS)'
            placeholder='100000'
            value={formData.minTransactionAmount || ''}
            onChange={e => setFormData({ ...formData, minTransactionAmount: parseFloat(e.target.value) || 0 })}
            helperText='Minimum amount for commission eligibility'
          />
        </Grid>
      </Grid>
    </>
  )
}

export default StepCommissionType
