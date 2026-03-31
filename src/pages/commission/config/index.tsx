// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import CircularProgress from '@mui/material/CircularProgress'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Demo Components Imports
import CreateCommission from 'src/views/pages/create-commission'

// ** Custom Component
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'

// ** Third Party Imports
import toast from 'react-hot-toast'

interface CommissionConfig {
  id: number
  title: string
  code: string
  description: string
  status: string
  type: string
  commissionRate: number
  superAgentCommissionRate: number
  franchiseMultiplier: number
  kpiWeights: {
    activeness: number
    valueTransacted: number
    uniqueAgents: number
  }
  createdAt: string
  updatedAt: string
}

const CommissionConfig = () => {
  const [configs, setConfigs] = useState<CommissionConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingConfig, setEditingConfig] = useState<CommissionConfig | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; config: CommissionConfig | null }>({
    open: false,
    config: null
  })
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [menuConfig, setMenuConfig] = useState<CommissionConfig | null>(null)

  const fetchConfigs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/commissions/config')
      if (!response.ok) throw new Error('Failed to fetch configurations')

      const configsData = await response.json()

      // Transform data to match frontend interface
      const transformedConfigs = configsData.map((config: any) => ({
        id: config.id,
        title: config.title,
        code: config.code,
        description: config.description,
        status: config.status,
        type: config.type,
        commissionRate: config.commissionRate,
        superAgentCommissionRate: config.superAgentCommissionRate,
        franchiseMultiplier: config.franchiseMultiplier,
        kpiWeights: config.kpiWeights
          ? JSON.parse(config.kpiWeights)
          : { activeness: 55, valueTransacted: 20, uniqueAgents: 25 },
        createdAt: config.createdAt,
        updatedAt: config.updatedAt
      }))

      setConfigs(transformedConfigs)
    } catch (error) {
      console.error('Error fetching configs:', error)
      toast.error('Failed to load commission configurations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfigs()
  }, [])

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, config: CommissionConfig) => {
    setAnchorEl(event.currentTarget)
    setMenuConfig(config)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setMenuConfig(null)
  }

  const handleEdit = () => {
    if (menuConfig) {
      setEditingConfig(menuConfig)
      setShowCreateForm(true)
    }
    handleMenuClose()
  }

  const handleDelete = () => {
    if (menuConfig) {
      setDeleteDialog({ open: true, config: menuConfig })
    }
    handleMenuClose()
  }

  const confirmDelete = async () => {
    if (!deleteDialog.config) return

    try {
      const response = await fetch(`/api/commissions/config/${deleteDialog.config.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete configuration')

      toast.success('Commission configuration deleted successfully')
      fetchConfigs()
    } catch (error) {
      console.error('Error deleting config:', error)
      toast.error('Failed to delete commission configuration')
    } finally {
      setDeleteDialog({ open: false, config: null })
    }
  }

  const handleCreateSuccess = () => {
    setShowCreateForm(false)
    setEditingConfig(null)
    fetchConfigs()
    toast.success('Commission configuration saved successfully')
  }

  const handleCancelCreate = () => {
    setShowCreateForm(false)
    setEditingConfig(null)
  }

  if (showCreateForm) {
    return (
      <DatePickerWrapper>
        <CreateCommission editData={editingConfig} onSuccess={handleCreateSuccess} onCancel={handleCancelCreate} />
      </DatePickerWrapper>
    )
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant='h4' gutterBottom>
            Commission Configurations
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Manage commission calculation rules for different agent types
          </Typography>
        </Box>
        <Button variant='contained' startIcon={<Icon icon='tabler:plus' />} onClick={() => setShowCreateForm(true)}>
          New Configuration
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : configs.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Icon icon='tabler:file-x' fontSize='3rem' color='text.secondary' />
            <Typography variant='h6' sx={{ mt: 2 }}>
              No Commission Configurations
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
              Create your first commission configuration to get started
            </Typography>
            <Button variant='contained' startIcon={<Icon icon='tabler:plus' />} onClick={() => setShowCreateForm(true)}>
              Create Configuration
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {configs.map(config => (
            <Grid item xs={12} md={6} lg={4} key={config.id}>
              <Card>
                <CardHeader
                  title={config.title}
                  subheader={`Code: ${config.code}`}
                  action={
                    <IconButton onClick={e => handleMenuClick(e, config)}>
                      <Icon icon='tabler:dots-vertical' />
                    </IconButton>
                  }
                />
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={config.status}
                      color={config.status === 'active' ? 'success' : 'warning'}
                      size='small'
                      variant='outlined'
                    />
                  </Box>

                  {config.description && (
                    <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                      {config.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant='body2'>
                      <strong>Local Agent Rate:</strong> {(config.commissionRate * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant='body2'>
                      <strong>Super Agent Rate:</strong> {(config.superAgentCommissionRate * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant='body2'>
                      <strong>Franchise Multiplier:</strong> {config.franchiseMultiplier}x
                    </Typography>
                  </Box>

                  <Typography variant='caption' color='text.secondary' sx={{ mt: 2, display: 'block' }}>
                    Created: {new Date(config.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>
          <Icon icon='tabler:edit' fontSize='1.25rem' style={{ marginRight: 8 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Icon icon='tabler:trash' fontSize='1.25rem' style={{ marginRight: 8 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, config: null })}>
        <DialogTitle>Delete Commission Configuration</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the configuration "{deleteDialog.config?.title}"? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, config: null })}>Cancel</Button>
          <Button onClick={confirmDelete} color='error' variant='contained'>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

CommissionConfig.acl = {
  action: 'read',
  subject: 'commissions'
}

export default CommissionConfig
