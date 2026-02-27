import React, { ReactNode } from 'react'
import { Box, Card, CardContent, Typography, Button, Stepper, StepLabel } from '@mui/material'
import { styled, useTheme } from '@mui/material/styles'
import MuiStep, { StepProps } from '@mui/material/Step'
import Icon from 'src/@core/components/icon'
import { useSettings } from 'src/@core/hooks/useSettings'
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'
import CustomAvatar from 'src/@core/components/mui/avatar'
import Avatar from '@mui/material/Avatar'

// ** Styled Components
import StepperWrapper from 'src/@core/styles/mui/stepper'

const Step = styled(MuiStep)<StepProps>(({ theme }) => ({
  padding: 0,
  '& .MuiStepLabel-iconContainer': {
    display: 'none'
  },
  '& .MuiStepLabel-label': {
    cursor: 'pointer'
  },
  [theme.breakpoints.down('md')]: {
    '&:not(:last-child)': {
      marginBottom: theme.spacing(6)
    },
    '& + svg': {
      display: 'none'
    }
  },
  [theme.breakpoints.up('md')]: {
    marginLeft: theme.spacing(4),
    marginRight: theme.spacing(4),
    '&:first-of-type': {
      marginLeft: 0
    },
    '&:last-of-type': {
      marginRight: 0
    }
  }
}))

export interface TransactionUploadStep {
  title: string
  icon: string
  subtitle?: string
  content: ReactNode
}

export interface TransactionUploadWizardProps {
  steps: TransactionUploadStep[]
  activeStep: number
  onStepChange: (step: number) => void
  onNext?: () => void
  onPrevious?: () => void
  onReset?: () => void
  loading?: boolean
  showNavigation?: boolean
  actionButtons?: ReactNode
}

const TransactionUploadWizard: React.FC<TransactionUploadWizardProps> = ({
  steps,
  activeStep,
  onStepChange,
  onNext,
  onPrevious,
  onReset,
  loading = false,
  showNavigation = true,
  actionButtons
}) => {
  const { settings } = useSettings()
  const theme = useTheme()
  const { direction } = settings

  const handleNext = () => {
    if (onNext && activeStep < steps.length - 1) {
      onNext()
    }
  }

  const handlePrevious = () => {
    if (onPrevious && activeStep > 0) {
      onPrevious()
    }
  }

  const handleReset = () => {
    if (onReset) {
      onReset()
    }
  }

  const handleStepClick = (index: number) => {
    if (onStepChange) {
      onStepChange(index)
    }
  }

  return (
    <Card>
      <CardContent>
        {/* Stepper Header */}
        <StepperWrapper sx={{ mb: 6 }}>
          <Stepper
            activeStep={activeStep}
            connector={
              <Icon fontSize='1.5rem' icon={direction === 'ltr' ? 'tabler:chevron-right' : 'tabler:chevron-left'} />
            }
            sx={{ justifyContent: 'space-between' }}
          >
            {steps.map((step, index) => {
              const RenderAvatar = activeStep >= index ? CustomAvatar : Avatar

              return (
                <Step
                  key={index}
                  onClick={() => handleStepClick(index)}
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
                          mr: 4,
                          ...(activeStep === index && { boxShadow: theme.shadows[3] }),
                          ...(activeStep > index && { color: hexToRGBA(theme.palette.primary.main, 0.4) })
                        }}
                      >
                        <Icon fontSize='1.5rem' icon={step.icon} />
                      </RenderAvatar>
                      <div>
                        <Typography variant='h6' className='step-title'>
                          {step.title}
                        </Typography>
                        {step.subtitle && (
                          <Typography variant='body2' className='step-subtitle'>
                            {step.subtitle}
                          </Typography>
                        )}
                      </div>
                    </div>
                  </StepLabel>
                </Step>
              )
            })}
          </Stepper>
        </StepperWrapper>

        {/* Step Content */}
        <Box sx={{ mb: 4 }}>{steps[activeStep]?.content}</Box>

        {/* Navigation Buttons */}
        {showNavigation && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant='outlined'
              startIcon={<Icon icon='tabler:arrow-left' />}
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </Button>

            <Box sx={{ display: 'flex', gap: 2 }}>
              {activeStep > 0 && onPrevious && (
                <Button
                  variant='outlined'
                  startIcon={<Icon icon='tabler:arrow-left' />}
                  onClick={handlePrevious}
                  disabled={loading}
                >
                  Previous
                </Button>
              )}

              {activeStep < steps.length - 1 && onNext && (
                <Button
                  variant='contained'
                  startIcon={<Icon icon='tabler:arrow-right' />}
                  onClick={handleNext}
                  disabled={loading}
                >
                  Next
                </Button>
              )}
            </Box>

            {actionButtons}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default TransactionUploadWizard
