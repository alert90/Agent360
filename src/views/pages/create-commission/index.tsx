import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import StepLabel from '@mui/material/StepLabel'
import Typography from '@mui/material/Typography'
import { styled, useTheme } from '@mui/material/styles'
import MuiStep, { StepProps } from '@mui/material/Step'
import MuiStepper, { StepperProps } from '@mui/material/Stepper'
import CardContent, { CardContentProps } from '@mui/material/CardContent'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Components Imports
import CustomAvatar from 'src/@core/components/mui/avatar'

// ** Step Components
import StepCommissionType from './StepCommissionType'
import StepCommissionReview from './StepCommissionReview'
import StepCommissionUsage from './StepCommissionUsage'
import StepCommissionDetails from './StepCommissionDetails'

// ** Util Import
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'

// ** Styled Components
import StepperWrapper from 'src/@core/styles/mui/stepper'

const steps = [
  {
    title: 'Commission Type',
    icon: 'tabler:users',
    subtitle: 'Choose type of commission'
  },
  {
    icon: 'tabler:id',
    title: 'Commission Config',
    subtitle: 'Provide commission details'
  },
  {
    title: 'Commission Usage',
    icon: 'tabler:credit-card',
    subtitle: 'Limitations & Offers'
  },
  {
    icon: 'tabler:checkbox',
    subtitle: 'Launch a config',
    title: 'Review & Complete'
  }
]

const Stepper = styled(MuiStepper)<StepperProps>(({ theme }) => ({
  height: '100%',
  minWidth: '15rem',
  '& .MuiStep-root:not(:last-of-type) .MuiStepLabel-root': {
    paddingBottom: theme.spacing(5)
  },
  [theme.breakpoints.down('md')]: {
    minWidth: 0
  }
}))

const StepperHeaderContainer = styled(CardContent)<CardContentProps>(({ theme }) => ({
  borderRight: `1px solid ${theme.palette.divider}`,
  [theme.breakpoints.down('md')]: {
    borderRight: 0,
    borderBottom: `1px solid ${theme.palette.divider}`
  }
}))

const Step = styled(MuiStep)<StepProps>(({ theme }) => ({
  '& .MuiStepLabel-root': {
    paddingTop: 0
  },
  '&:not(:last-of-type) .MuiStepLabel-root': {
    paddingBottom: theme.spacing(6)
  },
  '&:last-of-type .MuiStepLabel-root': {
    paddingBottom: 0
  },
  '& .MuiStepLabel-iconContainer': {
    display: 'none'
  },
  '& .step-subtitle': {
    color: `${theme.palette.text.disabled} !important`
  },
  '& + svg': {
    color: theme.palette.text.disabled
  },
  '&.Mui-completed .step-title': {
    color: theme.palette.text.disabled
  },
  '& .MuiStepLabel-label': {
    cursor: 'pointer'
  }
}))

interface CreateCommissionProps {
  editData?: any
  onSuccess?: () => void
  onCancel?: () => void
}

const formatDateForInput = (dateStr: string | null | undefined): string => {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return ''

    return date.toISOString().split('T')[0] // Returns "YYYY-MM-DD"
  } catch {
    return ''
  }
}

const CreateCommission = ({ editData, onSuccess, onCancel }: CreateCommissionProps) => {
  // ** States
  const [activeStep, setActiveStep] = useState<number>(0)
  const [reviewConfirmed, setReviewConfirmed] = useState(false)
  const [formData, setFormData] = useState(() => {
    if (editData) {
      return {
        type: editData.type || 'SUPER_AGENT',
        commissionRate: editData.commissionRate || 0.05,
        minTransactionAmount: editData.minTransactionAmount || 100000,
        superAgentCommissionRate: editData.superAgentCommissionRate || 0.2,
        superAgentFixedRate: editData.superAgentFixedRate || 0.3,
        superAgentVariableRate: editData.superAgentVariableRate || 0.7,
        franchiseMultiplier: editData.franchiseMultiplier || 4.5,
        franchiseBaseRate: editData.franchiseBaseRate || 0.0005,
        kpiWeights: editData.kpiWeights || {
          activeness: 55,
          valueTransacted: 20,
          uniqueAgents: 25
        },
        kpiBands: editData.kpiBands || [
          { min: 0, max: 50, rate: 0 },
          { min: 51, max: 60, rate: 20 },
          { min: 61, max: 70, rate: 40 },
          { min: 71, max: 80, rate: 60 },
          { min: 81, max: 90, rate: 80 },
          { min: 91, max: 100, rate: 100 }
        ],
        paybands: editData.paybands || [
          { min: 100, max: Infinity, name: 'Excellent', apportionRate: 1.0, clawbackPercentage: 0 },
          { min: 80, max: 99, name: 'Good', apportionRate: 0.8, clawbackPercentage: 20 },
          { min: 60, max: 79, name: 'Average', apportionRate: 0.6, clawbackPercentage: 40 },
          { min: 40, max: 59, name: 'Below Average', apportionRate: 0.4, clawbackPercentage: 60 },
          { min: 0, max: 39, name: 'Poor', apportionRate: 0.2, clawbackPercentage: 80 }
        ],
        title: editData.title || '',
        code: editData.code || '',
        description: editData.description || '',
        status: editData.status || 'active',
        startDate: formatDateForInput(editData.startDate),
        endDate: formatDateForInput(editData.endDate),
        assignedUsers: editData.assignedUserIds || []
      }
    }

    return {
      type: 'SUPER_AGENT',
      commissionRate: 0.05,
      minTransactionAmount: 100000,
      superAgentCommissionRate: 0.2,
      superAgentFixedRate: 0.3,
      superAgentVariableRate: 0.7,
      franchiseMultiplier: 4.5,
      franchiseBaseRate: 0.0005,
      kpiWeights: {
        activeness: 55,
        valueTransacted: 20,
        uniqueAgents: 25
      },
      kpiBands: [
        { min: 0, max: 50, rate: 0 },
        { min: 51, max: 60, rate: 20 },
        { min: 61, max: 70, rate: 40 },
        { min: 71, max: 80, rate: 60 },
        { min: 81, max: 90, rate: 80 },
        { min: 91, max: 100, rate: 100 }
      ],
      paybands: [
        { min: 100, max: Infinity, name: 'Excellent', apportionRate: 1.0, clawbackPercentage: 0 },
        { min: 80, max: 99, name: 'Good', apportionRate: 0.8, clawbackPercentage: 20 },
        { min: 60, max: 79, name: 'Average', apportionRate: 0.6, clawbackPercentage: 40 },
        { min: 40, max: 59, name: 'Below Average', apportionRate: 0.4, clawbackPercentage: 60 },
        { min: 0, max: 39, name: 'Poor', apportionRate: 0.2, clawbackPercentage: 80 }
      ],
      title: '',
      code: '',
      description: '',
      status: 'active',
      startDate: '',
      endDate: '',
      assignedUsers: []
    }
  })

  // ** Hook
  const theme = useTheme()

  const handleNext = () => {
    setActiveStep(activeStep + 1)
  }

  const handlePrev = () => {
    if (activeStep !== 0) {
      setActiveStep(activeStep - 1)
    }
  }

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <StepCommissionType formData={formData} setFormData={setFormData} />
      case 1:
        return <StepCommissionDetails formData={formData} setFormData={setFormData} />
      case 2:
        return <StepCommissionUsage formData={formData} setFormData={setFormData} />
      case 3:
        return <StepCommissionReview formData={formData} onSuccess={onSuccess} onConfirmedChange={setReviewConfirmed} />
      default:
        return null
    }
  }

  const renderContent = () => {
    return getStepContent(activeStep)
  }

  const renderFooter = () => {
    const stepCondition = activeStep === steps.length - 1

    return (
      <Box sx={{ mt: 6, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant='tonal'
          color='secondary'
          onClick={() => {
            if (activeStep === 0 && onCancel) {
              onCancel()
            } else {
              handlePrev()
            }
          }}
          startIcon={<Icon icon={theme.direction === 'ltr' ? 'tabler:arrow-left' : 'tabler:arrow-right'} />}
        >
          {activeStep === 0 ? 'Cancel' : 'Previous'}
        </Button>
        <Button
          variant='contained'
          color={stepCondition ? 'success' : 'primary'}
          disabled={stepCondition && !reviewConfirmed}
          onClick={() => (stepCondition ? handleSubmit() : handleNext())}
          endIcon={
            <Icon
              icon={
                stepCondition ? 'tabler:check' : theme.direction === 'ltr' ? 'tabler:arrow-right' : 'tabler:arrow-left'
              }
            />
          }
        >
          {stepCondition ? 'Submit' : 'Next'}
        </Button>
      </Box>
    )
  }

  const handleSubmit = async () => {
    if (!reviewConfirmed) {
      alert('Please confirm the commission details before submitting')

      return
    }

    if (formData.type === 'SUPER_AGENT') {
      const totalWeight =
        (formData.kpiWeights?.activeness || 0) +
        (formData.kpiWeights?.valueTransacted || 0) +
        (formData.kpiWeights?.uniqueAgents || 0)

      if (totalWeight !== 100) {
        alert('KPI weights must total 100%')

        return
      }
    }

    // Prepare config data
    const configData: Record<string, any> = {
      title: formData.title,
      code: formData.code,
      description: formData.description,
      type: formData.type,
      value: formData.commissionRate,
      agentType: formData.type,
      status: formData.status,
      minTransactionAmount: formData.minTransactionAmount,
      commissionRate: formData.commissionRate,

      ...(formData.startDate && formData.startDate !== ''
        ? { startDate: new Date(formData.startDate + 'T00:00:00.000Z') }
        : { startDate: null }),
      ...(formData.endDate && formData.endDate !== ''
        ? { endDate: new Date(formData.endDate + 'T23:59:59.999Z') }
        : { endDate: null }),

      ...(formData.type === 'SUPER_AGENT'
        ? {
            superAgentCommissionRate: formData.superAgentCommissionRate,
            superAgentFixedRate: formData.superAgentFixedRate,
            superAgentVariableRate: formData.superAgentVariableRate,
            kpiWeights: JSON.stringify(formData.kpiWeights),
            kpiBands: formData.kpiBands,
            franchiseMultiplier: null,
            franchiseBaseRate: null,
            paybandRates: JSON.stringify(
              formData.kpiBands || [
                { min: 0, max: 50, rate: 0 },
                { min: 51, max: 60, rate: 20 },
                { min: 61, max: 70, rate: 40 },
                { min: 71, max: 80, rate: 60 },
                { min: 81, max: 90, rate: 80 },
                { min: 91, max: 100, rate: 100 }
              ]
            )
          }
        : {
            franchiseMultiplier: formData.franchiseMultiplier,
            franchiseBaseRate: formData.franchiseBaseRate,
            superAgentCommissionRate: null,
            superAgentFixedRate: null,
            superAgentVariableRate: null,
            kpiWeights: null,
            kpiBands: null,
            paybandRates: JSON.stringify(
              formData.paybands || [
                { min: 100, max: Infinity, name: 'Excellent', apportionRate: 1.0, clawbackPercentage: 0 },
                { min: 80, max: 99, name: 'Good', apportionRate: 0.8, clawbackPercentage: 20 },
                { min: 60, max: 79, name: 'Average', apportionRate: 0.6, clawbackPercentage: 40 },
                { min: 40, max: 59, name: 'Below Average', apportionRate: 0.4, clawbackPercentage: 60 },
                { min: 0, max: 39, name: 'Poor', apportionRate: 0.2, clawbackPercentage: 80 }
              ]
            )
          }),
      assignedUsers: formData.assignedUsers || []
    }

    Object.keys(configData).forEach(key => {
      if (configData[key] === undefined || key === 'kpiBands' || key === 'paybands') {
        delete configData[key]
      }
    })

    try {
      const method = editData?.id ? 'PUT' : 'POST'
      const url = editData?.id ? `/api/commissions/config/${editData.id}` : '/api/commissions/config'
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

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Save error:', error)
      alert(error instanceof Error ? error.message : 'Failed to save commission configuration')
    }
  }

  return (
    <Card sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
      <StepperHeaderContainer>
        <StepperWrapper sx={{ height: '100%' }}>
          <Stepper
            connector={<></>}
            orientation='vertical'
            activeStep={activeStep}
            sx={{ height: '100%', minWidth: '15rem' }}
          >
            {steps.map((step, index) => {
              const RenderAvatar = activeStep >= index ? CustomAvatar : Avatar

              return (
                <Step
                  key={index}
                  onClick={() => setActiveStep(index)}
                  sx={{ '&.Mui-completed + svg': { color: 'primary.main' } }}
                >
                  <StepLabel>
                    <div className='step-label'>
                      <RenderAvatar
                        variant='rounded'
                        {...(activeStep >= index && { skin: 'light' })}
                        {...(activeStep === index && { skin: 'filled' })}
                        {...(activeStep >= index && { color: 'primary' })}
                        sx={{
                          ...(activeStep === index && { boxShadow: theme => theme.shadows[3] }),
                          ...(activeStep > index && { color: theme => hexToRGBA(theme.palette.primary.main, 0.4) })
                        }}
                      >
                        <Icon icon={step.icon} fontSize='1.5rem' />
                      </RenderAvatar>
                      <div>
                        <Typography className='step-title'>{step.title}</Typography>
                        <Typography className='step-subtitle'>{step.subtitle}</Typography>
                      </div>
                    </div>
                  </StepLabel>
                </Step>
              )
            })}
          </Stepper>
        </StepperWrapper>
      </StepperHeaderContainer>
      <CardContent sx={{ pt: theme => `${theme.spacing(6)} !important`, flex: 1 }}>
        {renderContent()}
        {renderFooter()}
      </CardContent>
    </Card>
  )
}

export default CreateCommission
