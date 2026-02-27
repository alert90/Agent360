// ** React Imports
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

const CreateCommission = ({ editData, onSuccess, onCancel }: CreateCommissionProps) => {
  // ** States
  const [activeStep, setActiveStep] = useState<number>(0)
  const [formData, setFormData] = useState(() => {
    if (editData) {
      // Convert edit data to form format
      return {
        type: editData.type || 'percentage',
        commissionRate: editData.commission_rate || 0.05,
        minTransactionAmount: editData.min_transaction_amount || 100000,
        superAgentCommissionRate: editData.super_agent_commission_rate || 0.2,
        superAgentFixedRate: editData.super_agent_fixed_rate || 0.06,
        superAgentVariableRate: editData.super_agent_variable_rate || 0.14,
        franchiseMultiplier: editData.franchise_multiplier || 4.5,
        kpiWeights: editData.kpi_weights || {
          activeness: 55,
          valueTransacted: 25,
          uniqueAgents: 20
        },
        title: editData.title || '',
        code: editData.code || '',
        description: editData.description || '',
        status: editData.status || 'active',
        assignedUsers: editData.assigned_user_ids || []
      }
    }

    return {
      type: 'percentage',
      commissionRate: 0.05,
      minTransactionAmount: 100000,
      superAgentCommissionRate: 0.2,
      superAgentFixedRate: 0.06,
      superAgentVariableRate: 0.14,
      franchiseMultiplier: 4.5,
      kpiWeights: {
        activeness: 55,
        valueTransacted: 25,
        uniqueAgents: 20
      },
      title: '',
      code: '',
      description: '',
      status: 'active',
      assignedUsers: []
    }
  })

  // ** Hook
  const theme = useTheme()

  // Handle Stepper
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
        return <StepCommissionReview formData={formData} onSuccess={onSuccess} />
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
          onClick={() => (stepCondition ? (onSuccess ? onSuccess() : alert('Submitted..!!')) : handleNext())}
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
      <CardContent sx={{ pt: theme => `${theme.spacing(6)} !important` }}>
        {renderContent()}
        {renderFooter()}
      </CardContent>
    </Card>
  )
}

export default CreateCommission
