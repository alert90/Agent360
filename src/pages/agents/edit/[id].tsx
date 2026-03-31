import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Alert from '@mui/material/Alert'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

interface Agent {
  id: string | number
  name: string
  accountNumber: string
  account_number?: string
  type: string
  isActive: boolean
  is_active?: boolean
  parentAgentId?: number | string | null
  parent_agent_id?: number | string | null
  email?: string | null
  phone?: string | null
  contact?: string | null
  branchCode?: string | null
  branch_code?: string
  branchName?: string | null
  branch_name?: string
  region?: string | null
  zone?: string | null
  username?: string | null
  role?: string | null
  commissionEligible?: number | null
  totalTransactionAmount?: number | null
  transactionCount?: number | null
  commissionAmount?: number | null
  payband?: number | null
  createdAt?: string | Date | null
  created_at?: string
  updatedAt?: string | Date | null
  updated_at?: string
}

const AgentEdit = () => {
  const router = useRouter()
  const { id } = router.query

  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<{
    name?: string
    accountNumber?: string
    account_number?: string
    type?: string
    isActive?: boolean
    is_active?: boolean
    email?: string | null
    phone?: string | null
    contact?: string | null
    branchCode?: string | null
    branch_code?: string
    branchName?: string | null
    branch_name?: string
    region?: string | null
    zone?: string | null
  }>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchAgentDetails()
    }
  }, [id])

  const fetchAgentDetails = async () => {
    try {
      const response = await fetch(`/api/agents/${id}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setAgent(result.data)
          setFormData(result.data)
        }
      }
    } catch (error) {
      console.error('Error fetching agent details:', error)
      setError('Failed to fetch agent details')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError(null)
  }

  const handleSave = async () => {
    if (!agent) return

    setSaving(true)
    setError(null)

    try {
      // Map camelCase to snake_case for API and include all fields
      const updateData = {
        name: formData.name || agent.name,
        accountNumber: formData.accountNumber || agent.accountNumber || agent.account_number,
        type: formData.type || agent.type,
        isActive: formData.isActive !== undefined ? formData.isActive : agent.isActive || agent.is_active,
        email: formData.email ?? agent.email,
        phone: formData.phone ?? agent.phone,
        contact: formData.contact ?? agent.contact,
        branchCode: formData.branchCode ?? agent.branchCode ?? agent.branch_code,
        branchName: formData.branchName ?? agent.branchName ?? agent.branch_name,
        region: formData.region ?? agent.region,
        zone: formData.zone ?? agent.zone
      }

      console.log('Sending update data:', updateData)

      const response = await fetch(`/api/agents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Refresh agent data
          await fetchAgentDetails()
          setError(null)
        } else {
          setError(result.message || 'Failed to update agent')
        }
      } else {
        try {
          const errorData = await response.json()
          setError(errorData.message || 'Failed to update agent')
        } catch (e) {
          setError(`Failed to update agent (HTTP ${response.status})`)
        }
      }
    } catch (error) {
      console.error('Error updating agent:', error)
      setError('Failed to update agent')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push(`/agents/view/${id}`)
  }

  const getAgentTypeColor = (type: string) => {
    switch (type) {
      case 'super_agent':
        return 'primary'
      case 'franchise':
        return 'secondary'
      case 'local_agent':
        return 'default'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 6 }}>
        <LinearProgress />
        <Typography variant='body2' sx={{ mt: 2, textAlign: 'center' }}>
          Loading agent details...
        </Typography>
      </Box>
    )
  }

  if (!agent) {
    return (
      <Box sx={{ p: 6 }}>
        <Alert severity='error'>Agent not found</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
        <Box>
          <Typography variant='h4' sx={{ mb: 2 }}>
            Edit Agent
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Update agent information for {agent.name}
          </Typography>
        </Box>
        <Button variant='outlined' startIcon={<Icon icon='tabler:arrow-left' />} onClick={handleCancel}>
          Back to Agent View
        </Button>
      </Box>

      {error && (
        <Alert severity='error' sx={{ mb: 6 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardHeader
          title='Agent Information'
          subheader={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={agent.type.replace('_', ' ').toUpperCase()}
                size='small'
                color={getAgentTypeColor(agent.type) as any}
                variant='outlined'
              />
              <Typography variant='body2' color='text.secondary'>
                Account: {formData.accountNumber}
              </Typography>
            </Box>
          }
        />
        <CardContent>
          <Grid container spacing={6}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Agent Name'
                value={formData.name || ''}
                onChange={e => handleInputChange('name', e.target.value)}
                margin='normal'
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Account Number'
                value={formData.accountNumber || formData.account_number || ''}
                onChange={e => handleInputChange('accountNumber', e.target.value)}
                margin='normal'
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin='normal'>
                <InputLabel>Agent Type</InputLabel>
                <Select
                  value={formData.type || ''}
                  label='Agent Type'
                  onChange={e => handleInputChange('type', e.target.value)}
                >
                  <MenuItem value='local_agent'>Local Agent</MenuItem>
                  <MenuItem value='super_agent'>Super Agent</MenuItem>
                  <MenuItem value='franchise'>Franchise</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <Typography sx={{ mr: 2 }}>Active Status:</Typography>
                <Switch
                  checked={formData.isActive ?? formData.is_active ?? false}
                  onChange={e => handleInputChange('isActive', e.target.checked)}
                />
                <Typography sx={{ ml: 2 }}>
                  {formData.isActive ?? formData.is_active ? 'Active' : 'Inactive'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Email'
                type='email'
                value={formData.email || ''}
                onChange={e => handleInputChange('email', e.target.value)}
                margin='normal'
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Phone'
                value={formData.phone || ''}
                onChange={e => handleInputChange('phone', e.target.value)}
                margin='normal'
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Contact'
                value={formData.contact || ''}
                onChange={e => handleInputChange('contact', e.target.value)}
                margin='normal'
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Branch Code'
                value={formData.branchCode ?? formData.branch_code ?? ''}
                onChange={e => handleInputChange('branchCode', e.target.value)}
                margin='normal'
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Branch Name'
                value={formData.branchName ?? formData.branch_name ?? ''}
                onChange={e => handleInputChange('branchName', e.target.value)}
                margin='normal'
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Region'
                value={formData.region ?? ''}
                onChange={e => handleInputChange('region', e.target.value)}
                margin='normal'
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Zone'
                value={formData.zone ?? ''}
                onChange={e => handleInputChange('zone', e.target.value)}
                margin='normal'
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 6 }}>
            <Button variant='outlined' onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant='contained'
              onClick={handleSave}
              disabled={saving}
              startIcon={<Icon icon='tabler:device-floppy' />}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

AgentEdit.acl = {
  action: 'update',
  subject: 'agent-management'
}

export default AgentEdit
