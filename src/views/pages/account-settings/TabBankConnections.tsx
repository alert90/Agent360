import { useState, useEffect } from 'react'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Avatar from '@mui/material/Avatar'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Alert from '@mui/material/Alert'
import Icon from 'src/@core/components/icon'
import axios from 'axios'
import toast from 'react-hot-toast'

const TabBankConnections = () => {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  // Fetch linked agents
  const fetchLinkedAgents = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const response = await axios.get('/api/user/linked-agents', {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      })
      setAgents(response.data.agents || [])
    } catch (error) {
      console.error('Fetch error:', error)

      // Don't show error on every keystroke
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLinkedAgents()
  }, [])

  // Search function - simple and direct
  const handleSearch = async () => {
    if (!searchTerm || searchTerm.length < 2) {
      toast.error('Please enter at least 2 characters')

      return
    }

    try {
      setSearching(true)
      const token = localStorage.getItem('accessToken')
      const response = await axios.get(`/api/user/search-agents?search=${encodeURIComponent(searchTerm)}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      })
      setSearchResults(response.data || [])
      if (response.data.length === 0) {
        toast.info('No agents found')
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Search failed')
    } finally {
      setSearching(false)
    }
  }

  const linkAgent = async (agentId: number) => {
    try {
      const token = localStorage.getItem('accessToken')
      await axios.post(
        '/api/user/linked-agents',
        { agentId },
        {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        }
      )
      toast.success('Agent linked successfully')
      setDialogOpen(false)
      setSearchTerm('')
      setSearchResults([])
      fetchLinkedAgents()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to link agent')
    }
  }

  const unlinkAgent = async (agentId: number) => {
    try {
      const token = localStorage.getItem('accessToken')
      await axios.delete(`/api/user/linked-agents/${agentId}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      })
      toast.success('Agent unlinked successfully')
      fetchLinkedAgents()
    } catch (error) {
      toast.error('Failed to unlink agent')
    }
  }

  const setDefaultAgent = async (agentId: number) => {
    try {
      const token = localStorage.getItem('accessToken')
      await axios.put(
        `/api/user/linked-agents/${agentId}`,
        {},
        {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        }
      )
      toast.success('Default agent updated')
      fetchLinkedAgents()
    } catch (error) {
      toast.error('Failed to update default agent')
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title='Linked Bank Accounts'
            subheader='Manage which agent bank accounts are linked to your user account'
            action={
              <Button
                variant='contained'
                startIcon={<Icon icon='tabler:link-plus' />}
                onClick={() => setDialogOpen(true)}
              >
                Link Bank Account
              </Button>
            }
          />
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : agents.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Icon icon='tabler:building-bank' fontSize={48} style={{ color: '#9e9e9e', marginBottom: 16 }} />
                <Typography variant='h6' color='text.secondary'>
                  No Bank Accounts Linked
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Click "Link Bank Account" to add one
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {agents.map((agent: any) => (
                  <Grid item xs={12} md={6} key={agent.id}>
                    <Card variant='outlined' sx={{ position: 'relative' }}>
                      {agent.isDefault && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            bgcolor: 'success.main',
                            color: 'white',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: '0.7rem'
                          }}
                        >
                          Default
                        </Box>
                      )}
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                            <Icon icon='tabler:building-bank' />
                          </Avatar>
                          <Box>
                            <Typography variant='h6'>{agent.name}</Typography>
                            <Typography variant='body2' color='text.secondary'>
                              Account: {agent.accountNumber}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              Agent ID: {agent.id}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant='body2'>
                            <strong>Branch:</strong> {agent.branchName}
                          </Typography>
                          <Typography variant='body2'>
                            <strong>Type:</strong> {agent.type?.replace('_', ' ') || 'Local Agent'}
                          </Typography>
                          {agent.zone && (
                            <Typography variant='body2'>
                              <strong>Zone:</strong> {agent.zone}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                          <Chip
                            label={agent.isActive ? 'Active' : 'Inactive'}
                            size='small'
                            color={agent.isActive ? 'success' : 'error'}
                          />
                          {!agent.isDefault && agents.length > 1 && (
                            <Button size='small' variant='outlined' onClick={() => setDefaultAgent(agent.id)}>
                              Set as Default
                            </Button>
                          )}
                          <IconButton size='small' color='error' onClick={() => unlinkAgent(agent.id)}>
                            <Icon icon='tabler:link-off' />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Simple Search Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>Link Bank Account</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 3, mt: 1 }}>
            <TextField
              fullWidth
              placeholder='Search by name, account number, or branch...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Icon icon='tabler:search' />
                  </InputAdornment>
                )
              }}
            />
            <Button variant='contained' onClick={handleSearch} disabled={searching}>
              {searching ? <CircularProgress size={24} /> : 'Search'}
            </Button>
          </Box>

          {searchResults.length > 0 && (
            <Grid container spacing={2}>
              {searchResults.map((agent: any) => (
                <Grid item xs={12} key={agent.id}>
                  <Card variant='outlined'>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant='subtitle1' fontWeight={600}>
                            {agent.name}
                          </Typography>
                          <Typography variant='body2'>Account: {agent.account_number}</Typography>
                          <Typography variant='body2'>Agent ID: {agent.id}</Typography>
                          <Typography variant='body2'>Branch: {agent.branch_name}</Typography>
                          <Typography variant='body2'>Type: {agent.type?.replace('_', ' ')}</Typography>
                        </Box>
                        <Button
                          variant='contained'
                          startIcon={<Icon icon='tabler:link' />}
                          onClick={() => linkAgent(agent.id)}
                        >
                          Link
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {searchTerm && !searching && searchResults.length === 0 && (
            <Alert severity='info'>No agents found matching "{searchTerm}"</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default TabBankConnections
