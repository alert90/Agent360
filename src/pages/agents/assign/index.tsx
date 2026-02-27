// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Pagination from '@mui/material/Pagination'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

interface Agent {
  id: string
  name: string
  account_number: string
  type: string
  is_active: boolean
  parent_agent_id?: string
}

interface Assignment {
  id: string
  local_agent_id: string
  super_agent_id: string
  franchise_id: string
  assigned_at: string
  assigned_by: string
  status: string
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

const AgentAssignment = () => {
  const [agents, setAgents] = useState<Agent[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedSuperAgent, setSelectedSuperAgent] = useState<string>('')
  const [selectedFranchise, setSelectedFranchise] = useState<string>('')
  const [unassignedAgents, setUnassignedAgents] = useState<Agent[]>([])
  const [assignedAgents, setAssignedAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(false)
  const [assignmentDialog, setAssignmentDialog] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  // Pagination and search states for unassigned agents
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [unassignedPagination, setUnassignedPagination] = useState<PaginationData>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0
  })
  const [unassignedLoading, setUnassignedLoading] = useState(false)

  useEffect(() => {
    fetchAgents()
    fetchAssignments()
  }, [])

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/commissions/agents')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setAgents(result.data)
        }
      }
    } catch (error) {
      console.error('Error fetching agents:', error)
    }
  }

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/agents/assignments')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setAssignments(result.data)
        }
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
    }
  }

  const fetchUnassignedAgents = async () => {
    if (!selectedSuperAgent && !selectedFranchise) {
      setUnassignedAgents([])
      setUnassignedPagination({ page: 1, limit: 25, total: 0, totalPages: 0 })

      return
    }

    setUnassignedLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: rowsPerPage.toString(),
        search: searchQuery,
        super_agent_id: selectedSuperAgent || '',
        franchise_id: selectedFranchise || ''
      })

      const response = await fetch(`/api/agents/unassigned?${params}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setUnassignedAgents(result.data)
          setUnassignedPagination(result.pagination)
        }
      }
    } catch (error) {
      console.error('Error fetching unassigned agents:', error)
    } finally {
      setUnassignedLoading(false)
    }
  }

  useEffect(() => {
    if (selectedSuperAgent) {
      const assigned = agents.filter(
        agent => agent.parent_agent_id === selectedSuperAgent && agent.type === 'local_agent'
      )
      setAssignedAgents(assigned)
    } else if (selectedFranchise) {
      const assigned = agents.filter(
        agent => agent.parent_agent_id === selectedFranchise && agent.type === 'local_agent'
      )
      setAssignedAgents(assigned)
    } else {
      setAssignedAgents([])
    }
  }, [selectedSuperAgent, selectedFranchise, agents])

  useEffect(() => {
    fetchUnassignedAgents()
  }, [selectedSuperAgent, selectedFranchise, currentPage, rowsPerPage, searchQuery])

  const superAgents = agents.filter(agent => agent.type === 'super_agent')
  const franchises = agents.filter(agent => agent.type === 'franchise')

  const handleAssignAgent = async (agent: Agent) => {
    if (!selectedSuperAgent && !selectedFranchise) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/agents/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          local_agent_id: agent.id,
          super_agent_id: selectedSuperAgent || null,
          franchise_id: selectedFranchise || null,
          status: 'active'
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Refresh assignments and agents
          await fetchAssignments()
          await fetchAgents()
          await fetchUnassignedAgents()
          setAssignmentDialog(false)
          setSelectedAgent(null)
        }
      }
    } catch (error) {
      console.error('Error assigning agent:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnassignAgent = async (assignment: Assignment) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/agents/unassign/${assignment.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Refresh assignments and agents
          await fetchAssignments()
          await fetchAgents()
          await fetchUnassignedAgents()
        }
      }
    } catch (error) {
      console.error('Error unassigning agent:', error)
    } finally {
      setLoading(false)
    }
  }

  const openAssignmentDialog = (agent: Agent) => {
    setSelectedAgent(agent)
    setAssignmentDialog(true)
  }

  const closeAssignmentDialog = () => {
    setAssignmentDialog(false)
    setSelectedAgent(null)
  }

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value)
  }

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setCurrentPage(1)
  }

  return (
    <Box sx={{ p: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
        <Box>
          <Typography variant='h4' sx={{ mb: 2 }}>
            Agent Assignment
          </Typography>
          <Typography variant='body1' color='text.secondary'>
            Assign local agents to Super Agents or Franchises
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={6} sx={{ mb: 6 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Select Super Agent</InputLabel>
            <Select
              value={selectedSuperAgent}
              label='Super Agent'
              onChange={e => {
                setSelectedSuperAgent(e.target.value)
                setSelectedFranchise('')
                setCurrentPage(1)
              }}
            >
              <MenuItem value=''>
                <em>None</em>
              </MenuItem>
              {superAgents.map(agent => (
                <MenuItem key={agent.id} value={agent.id}>
                  {agent.name} ({agent.account_number})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Select Franchise</InputLabel>
            <Select
              value={selectedFranchise}
              label='Franchise'
              onChange={e => {
                setSelectedFranchise(e.target.value)
                setSelectedSuperAgent('')
                setCurrentPage(1)
              }}
            >
              <MenuItem value=''>
                <em>None</em>
              </MenuItem>
              {franchises.map(agent => (
                <MenuItem key={agent.id} value={agent.id}>
                  {agent.name} ({agent.account_number})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <Button
            fullWidth
            variant='outlined'
            onClick={() => {
              fetchAssignments()
              fetchUnassignedAgents()
            }}
            startIcon={<Icon icon='tabler:refresh' />}
          >
            Refresh Assignments
          </Button>
        </Grid>
      </Grid>

      {/* Assignment Summary */}
      {(selectedSuperAgent || selectedFranchise) && (
        <Card sx={{ mb: 6 }}>
          <CardHeader
            title={`Current Assignments - ${
              selectedSuperAgent
                ? superAgents.find(a => a.id === selectedSuperAgent)?.name
                : franchises.find(f => f.id === selectedFranchise)?.name
            }`}
            subheader={
              <Typography variant='body2' color='text.secondary'>
                {assignedAgents.length} agents assigned
              </Typography>
            }
          />
          <CardContent>
            {assignedAgents.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Agent Name</TableCell>
                      <TableCell>Account Number</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align='center'>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assignedAgents.map(agent => {
                      const assignment = assignments.find(a => a.local_agent_id === agent.id)

                      return (
                        <TableRow key={agent.id} hover>
                          <TableCell>
                            <Typography variant='body2' fontWeight='medium'>
                              {agent.name}
                            </Typography>
                          </TableCell>
                          <TableCell>{agent.account_number}</TableCell>
                          <TableCell>
                            <Chip
                              label={agent.type.replace('_', ' ').toUpperCase()}
                              size='small'
                              color='default'
                              variant='outlined'
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={assignment?.status || 'Active'}
                              size='small'
                              color='success'
                              variant='outlined'
                            />
                          </TableCell>
                          <TableCell align='center'>
                            <Button
                              size='small'
                              variant='outlined'
                              color='error'
                              onClick={() => assignment && handleUnassignAgent(assignment)}
                              startIcon={<Icon icon='tabler:user-x' />}
                            >
                              Unassign
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant='body2' color='text.secondary'>
                  No agents assigned yet
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Unassigned Agents */}
      {(selectedSuperAgent || selectedFranchise) && (
        <Card>
          <CardHeader
            title='Unassigned Local Agents'
            subheader={
              <Typography variant='body2' color='text.secondary'>
                {unassignedPagination.total} agents available for assignment
              </Typography>
            }
          />
          <CardContent>
            {/* Search and Pagination Controls */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder='Search agents by name or account number...'
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Icon icon='tabler:search' />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label='Rows per page'
                  type='number'
                  value={rowsPerPage}
                  onChange={handleRowsPerPageChange}
                  inputProps={{ min: 10, max: 100 }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                  <Typography variant='body2' color='text.secondary'>
                    Showing {unassignedAgents.length} of {unassignedPagination.total} agents
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {unassignedLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <Typography variant='body2' color='text.secondary'>
                  Loading unassigned agents...
                </Typography>
              </Box>
            ) : unassignedAgents.length > 0 ? (
              <>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Agent Name</TableCell>
                        <TableCell>Account Number</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align='center'>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {unassignedAgents.map(agent => (
                        <TableRow key={agent.id} hover>
                          <TableCell>
                            <Typography variant='body2' fontWeight='medium'>
                              {agent.name}
                            </Typography>
                          </TableCell>
                          <TableCell>{agent.account_number}</TableCell>
                          <TableCell>
                            <Chip
                              label={agent.type.replace('_', ' ').toUpperCase()}
                              size='small'
                              color='default'
                              variant='outlined'
                            />
                          </TableCell>
                          <TableCell>
                            <Chip label='Unassigned' size='small' color='warning' variant='outlined' />
                          </TableCell>
                          <TableCell align='center'>
                            <Button
                              size='small'
                              variant='contained'
                              color='primary'
                              onClick={() => openAssignmentDialog(agent)}
                              startIcon={<Icon icon='tabler:user-plus' />}
                            >
                              Assign
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                {unassignedPagination.totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination
                      count={unassignedPagination.totalPages}
                      page={currentPage}
                      onChange={handlePageChange}
                      color='primary'
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant='body2' color='text.secondary'>
                  {searchQuery ? 'No agents found matching your search criteria' : 'All local agents are assigned'}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assignment Dialog */}
      <Dialog open={assignmentDialog} onClose={closeAssignmentDialog} maxWidth='sm' fullWidth>
        <DialogTitle>Assign Agent</DialogTitle>
        <DialogContent>
          {selectedAgent && (
            <Box sx={{ pt: 2 }}>
              <Typography variant='body1' sx={{ mb: 2 }}>
                Assign <strong>{selectedAgent.name}</strong> ({selectedAgent.account_number}) to:
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {selectedSuperAgent && `Super Agent: ${superAgents.find(a => a.id === selectedSuperAgent)?.name}`}
                {selectedFranchise && `Franchise: ${franchises.find(f => f.id === selectedFranchise)?.name}`}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAssignmentDialog} color='secondary'>
            Cancel
          </Button>
          <Button
            onClick={() => selectedAgent && handleAssignAgent(selectedAgent)}
            variant='contained'
            color='primary'
            disabled={loading}
          >
            {loading ? 'Assigning...' : 'Confirm Assignment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

AgentAssignment.acl = {
  action: 'update',
  subject: 'agent-management'
}

export default AgentAssignment
