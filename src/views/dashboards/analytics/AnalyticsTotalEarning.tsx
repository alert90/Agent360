import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import axios from 'axios'
import Icon from 'src/@core/components/icon'
import OptionsMenu from 'src/@core/components/option-menu'
import CustomAvatar from 'src/@core/components/mui/avatar'

interface AgentCounts {
  totalAgents: number
  franchise: number
  superAgents: number
  localAgents: number
  activeAgents: number
}

const AnalyticsTotalEarning = () => {
  const [agentCounts, setAgentCounts] = useState<AgentCounts>({
    totalAgents: 0,
    franchise: 0,
    superAgents: 0,
    localAgents: 0,
    activeAgents: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAgentCounts = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('accessToken')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}

        const response = await axios.get('/api/agents/list', {
          headers,
          params: { page: 1, limit: 1 }
        })

        if (response.data.success && response.data.stats) {
          setAgentCounts({
            totalAgents: response.data.stats.totalAgents || 0,
            franchise: response.data.stats.totalFranchise || 0,
            superAgents: response.data.stats.totalSuperAgents || 0,
            localAgents:
              response.data.stats.totalAgents -
                (response.data.stats.totalFranchise + response.data.stats.totalSuperAgents) || 0,
            activeAgents: response.data.stats.activeAgents || 0
          })
        }
      } catch (error) {
        console.error('Error fetching agent counts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAgentCounts()
  }, [])

  const totalAgents = agentCounts.totalAgents

  return (
    <Card>
      <CardHeader
        title='System Overview'
        action={
          <OptionsMenu
            options={['Refresh', 'Share', 'Update']}
            iconButtonProps={{ size: 'small', sx: { color: 'text.disabled' } }}
          />
        }
        subheader={
          <Box
            sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', '& svg': { mr: 1, color: 'success.main' } }}
          >
            <Typography variant='h1' sx={{ mr: 2 }}>
              {totalAgents}
            </Typography>
            <Icon fontSize='1.25rem' icon='tabler:users' />
            <Typography variant='h6' sx={{ color: 'success.main' }}>
              Total Agents
            </Typography>
          </Box>
        }
      />
      <CardContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <Typography>Loading...</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <CustomAvatar skin='light' variant='rounded' color='primary' sx={{ mr: 4, width: 34, height: 34 }}>
                <Icon icon='tabler:users' />
              </CustomAvatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant='h6'>Total Agents</Typography>
                <Typography variant='body2' sx={{ color: 'text.disabled' }}>
                  All registered agent accounts
                </Typography>
              </Box>
              <Typography sx={{ fontWeight: 500, color: 'primary.main' }}>{totalAgents.toLocaleString()}</Typography>
            </Box>

            <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid', borderTopColor: 'divider' }}>
              <Typography variant='h6' sx={{ mb: 2 }}>
                Agent Breakdown by Type
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                  Super Agents
                </Typography>
                <Typography variant='body2' sx={{ fontWeight: 500 }}>
                  {agentCounts.superAgents}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                  Franchises
                </Typography>
                <Typography variant='body2' sx={{ fontWeight: 500 }}>
                  {agentCounts.franchise}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                  Local Agents
                </Typography>
                <Typography variant='body2' sx={{ fontWeight: 500 }}>
                  {agentCounts.localAgents}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mt: 2,
                  pt: 2,
                  borderTop: '1px dashed',
                  borderTopColor: 'divider'
                }}
              >
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                  Active Agents
                </Typography>
                <Typography variant='body2' sx={{ fontWeight: 500, color: 'success.main' }}>
                  {agentCounts.activeAgents}
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default AnalyticsTotalEarning
