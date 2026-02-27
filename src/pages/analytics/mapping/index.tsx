// ** React Imports
import { useState, useEffect } from 'react'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Hooks
import { useAuth } from 'src/hooks/useAuth'

interface NetworkNode {
  id: string
  name: string
  type: 'regional_manager' | 'super_agent' | 'franchise' | 'local_agent'
  zone: string
  connections: string[]
  performance: number
}

const NetworkMapping = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [selectedZone, setSelectedZone] = useState<string>('all')
  const [networkData, setNetworkData] = useState<NetworkNode[]>([])
  const [zones, setZones] = useState<string[]>([])

  useEffect(() => {
    fetchNetworkData()
  }, [])

  const fetchNetworkData = async () => {
    try {
      // Fetch agents with transaction data (same as agents list)
      const agentsRes = await fetch('/api/agents/list?limit=1000') // Get all agents
      const agentsData = await agentsRes.json()

      if (!agentsData.success) {
        throw new Error('Failed to fetch agents data')
      }

      const agents = agentsData.data || []

      // Fetch assignments and regional manager assignments
      const [assignmentsRes, regionalAssignmentsRes] = await Promise.all([
        fetch('/api/agents/assignments'),
        fetch('/api/regional-managers/assignments')
      ])

      const assignments = await assignmentsRes.json()
      const regionalAssignments = await regionalAssignmentsRes.json()

      // Build network structure
      const nodes: NetworkNode[] = []
      const zoneSet = new Set<string>()

      // Add regional managers
      const regionalManagersRes = await fetch('/api/apps/users/list?role=regional_manager')
      const regionalManagersData = await regionalManagersRes.json()
      const regionalManagers = regionalManagersData.users || []
      regionalManagers.forEach((rm: any) => {
        zoneSet.add(rm.zone || 'Unknown')
        nodes.push({
          id: `rm-${rm.id}`,
          name: rm.fullName,
          type: 'regional_manager',
          zone: rm.zone || 'Unknown',
          connections: regionalAssignments
            .filter((a: any) => a.regionalManagerId === rm.id)
            .map((a: any) => `agent-${a.agentId}`),
          performance: 0 // Calculate based on assigned agents
        })
      })

      // Add agents
      agents.forEach((agent: any) => {
        zoneSet.add(agent.zone || 'Unknown')
        const connections: string[] = []

        // Find parent connections
        const agentAssignment = assignments.find((a: any) => a.localAgentId === agent.id)
        if (agentAssignment) {
          if (agentAssignment.superAgentId) {
            connections.push(`agent-${agentAssignment.superAgentId}`)
          }
          if (agentAssignment.franchiseId) {
            connections.push(`agent-${agentAssignment.franchiseId}`)
          }
        }

        // Find regional manager connection
        const regionalAssignment = regionalAssignments.find((a: any) => a.agentId === agent.id)
        if (regionalAssignment) {
          connections.push(`rm-${regionalAssignment.regionalManagerId}`)
        }

        nodes.push({
          id: `agent-${agent.id}`,
          name: agent.name,
          type: agent.type as any,
          zone: agent.zone || 'Unknown',
          connections,
          performance: agent.total_transaction_amount || 0
        })
      })

      setNetworkData(nodes)
      setZones(['all', ...Array.from(zoneSet).sort()])
    } catch (error) {
      console.error('Error fetching network data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredNodes = selectedZone === 'all'
    ? networkData
    : networkData.filter(node => node.zone === selectedZone)

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'regional_manager': return '#1976d2'
      case 'super_agent': return '#388e3c'
      case 'franchise': return '#f57c00'
      case 'local_agent': return '#7b1fa2'
      default: return '#757575'
    }
  }

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'regional_manager': return 'tabler:user-check'
      case 'super_agent': return 'tabler:users'
      case 'franchise': return 'tabler:building'
      case 'local_agent': return 'tabler:user'
      default: return 'tabler:circle'
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="Agent Network Mapping"
            subheader="Visualize agent relationships and connections by zone"
            action={
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Zone Filter</InputLabel>
                <Select
                  value={selectedZone}
                  label="Zone Filter"
                  onChange={(e) => setSelectedZone(e.target.value)}
                >
                  {zones.map(zone => (
                    <MenuItem key={zone} value={zone}>
                      {zone === 'all' ? 'All Zones' : zone}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            }
          />
          <CardContent>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Network Overview</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <Box display="flex" alignItems="center">
                    <Box sx={{ width: 16, height: 16, bgcolor: '#1976d2', borderRadius: 1, mr: 1 }} />
                    <Typography variant="body2">Regional Managers</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box display="flex" alignItems="center">
                    <Box sx={{ width: 16, height: 16, bgcolor: '#388e3c', borderRadius: 1, mr: 1 }} />
                    <Typography variant="body2">Super Agents</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box display="flex" alignItems="center">
                    <Box sx={{ width: 16, height: 16, bgcolor: '#f57c00', borderRadius: 1, mr: 1 }} />
                    <Typography variant="body2">Franchises</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box display="flex" alignItems="center">
                    <Box sx={{ width: 16, height: 16, bgcolor: '#7b1fa2', borderRadius: 1, mr: 1 }} />
                    <Typography variant="body2">Local Agents</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {filteredNodes.map(node => (
                <Card key={node.id} sx={{ minWidth: 200, bgcolor: getNodeColor(node.type) + '10', border: `1px solid ${getNodeColor(node.type)}40` }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Icon icon={getNodeIcon(node.type)} fontSize="1.25rem" color={getNodeColor(node.type)} />
                      <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 600 }}>
                        {node.name}
                      </Typography>
                    </Box>
                    <Chip
                      label={node.type.replace('_', ' ').toUpperCase()}
                      size="small"
                      sx={{ mb: 1, bgcolor: getNodeColor(node.type), color: 'white' }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Zone: {node.zone}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Connections: {node.connections.length}
                    </Typography>
                    {node.performance > 0 && (
                      <Typography variant="body2" color="text.secondary">
                        Performance: {node.performance.toLocaleString()}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>

            {filteredNodes.length === 0 && (
              <Box textAlign="center" py={6}>
                <Typography variant="h6" color="text.secondary">
                  No agents found for the selected zone
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

NetworkMapping.acl = {
  action: 'read',
  subject: 'analytics'
}

export default NetworkMapping