// ** React Imports
import { ChangeEvent, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { styled, useTheme } from '@mui/material/styles'

// ** Custom Component Import
import CustomTextField from 'src/@core/components/mui/text-field'

// ** Type Imports
import { CustomRadioIconsData, CustomRadioIconsProps } from 'src/@core/components/custom-radio/types'

// ** Custom Components Imports
import CustomRadioIcons from 'src/@core/components/custom-radio/icons'

// ** Types
import { AgentType } from 'src/types/apps/commissionTypes'

interface IconType {
  icon: CustomRadioIconsProps['icon']
  iconProps: CustomRadioIconsProps['iconProps']
}

const data: CustomRadioIconsData[] = [
  {
    isSelected: true,
    value: 'percentage',
    content: 'Commission calculated as percentage of transaction amount.',
    title: (
      <Typography variant='h6' sx={{ mb: 1 }}>
        Percentage Based
      </Typography>
    )
  }
]

const ImgWrapper = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(4, 4, 0, 4)
  },
  [theme.breakpoints.up('sm')]: {
    height: 250,
    padding: theme.spacing(5, 5, 0, 5)
  },
  '& img': {
    height: 'auto',
    maxWidth: '100%'
  }
}))

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
      icon: 'tabler:percentage',
      iconProps: { fontSize: '2.5rem', style: { marginBottom: 8 }, color: theme.palette.text.secondary }
    },
    {
      icon: 'tabler:currency-dollar',
      iconProps: { fontSize: '2.5rem', style: { marginBottom: 8 }, color: theme.palette.text.secondary }
    }
  ]

  const handleRadioChange = (prop: string | ChangeEvent<HTMLInputElement>) => {
    const value = typeof prop === 'string' ? prop : (prop.target as HTMLInputElement).value
    setSelectedRadio(value)
    setFormData({ ...formData, type: value })
  }

  return (
    <>
      <Grid container sx={{ mb: 6 }} spacing={4}>
        <Grid item xs={12} sx={{ mb: 2 }}>
          <ImgWrapper>
            <img width={650} alt='illustration' src={`/images/pages/create-deal-type-${theme.palette.mode}.png`} />
          </ImgWrapper>
        </Grid>
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
            Commission Configuration Overview
          </Typography>
          <Typography variant='body2' sx={{ mb: 4, color: 'text.secondary' }}>
            This commission system supports three types of agents:
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main' }} />
              <Typography variant='body2'>
                <strong>Local Agents:</strong> Get direct commission from customer transactions (5% base rate)
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'success.main' }} />
              <Typography variant='body2'>
                <strong>Super Agents:</strong> Get 20% of commission from agents they serve (30% fixed + 70% KPI-based)
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'warning.main' }} />
              <Typography variant='body2'>
                <strong>Franchises:</strong> Get commission based on 4.5x turnover multiplier with paybands
              </Typography>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <CustomTextField
            fullWidth
            label='Base Commission Rate (%)'
            type='number'
            placeholder='5'
            value={formData.commissionRate || ''}
            onChange={e => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })}
            helperText='Default commission rate for local agents (percentage)'
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <CustomTextField
            fullWidth
            label='Minimum Transaction Amount'
            type='number'
            placeholder='100000'
            value={formData.minTransactionAmount || ''}
            onChange={e => setFormData({ ...formData, minTransactionAmount: parseFloat(e.target.value) || 0 })}
            helperText='Minimum amount for commission eligibility (TZS)'
          />
        </Grid>
      </Grid>
    </>
  )
}

export default StepCommissionType
