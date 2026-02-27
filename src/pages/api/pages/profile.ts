import { NextApiRequest, NextApiResponse } from 'next/types'
import jwt from 'jsonwebtoken'
import Database from 'better-sqlite3'
import { AgentData, AgentConnection, AgentTransaction } from 'src/types/apps/userTypes'

const db = new Database('agent360.db')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Get the authenticated user from JWT token
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET!) as {
      id: number
      email: string
      role: string
    }

    const { tab = 'profile' } = req.query

    // Get user data from database
    const userStmt = db.prepare(`
      SELECT id, email, full_name, username, role, permissions, location, zone, is_active, created_at, updated_at
      FROM users
      WHERE id = ?
    `)
    const user = userStmt.get(decoded.id) as any

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Get agent data if user is an agent
    let agentData = null
    if (user.role === 'agent' || user.role === 'super_agent' || user.role === 'franchise') {
      const agentStmt = db.prepare(`
        SELECT * FROM agents
        WHERE name = ? OR account_number = ?
      `)
      agentData = agentStmt.get(user.full_name, user.username) as AgentData
    }

    // Transform data based on tab
    switch (tab) {
      case 'profile':
        const profileData = {
          about: [
            { property: 'Full Name', value: user.full_name || '', icon: 'tabler:user' },
            { property: 'Status', value: user.is_active ? 'active' : 'inactive', icon: 'tabler:check' },
            { property: 'Role', value: user.role || '', icon: 'tabler:crown' },
            { property: 'Location', value: user.location || 'Not specified', icon: 'tabler:flag' },
            { property: 'Zone', value: user.zone || 'Not specified', icon: 'tabler:map-pin' }
          ],
          contacts: [
            { property: 'Email', value: user.email || '', icon: 'tabler:mail' },
            { property: 'Username', value: user.username || '', icon: 'tabler:at' },
            { property: 'Account Number', value: agentData?.account_number || 'N/A', icon: 'tabler:hash' }
          ],
          teams: agentData
            ? [
                { property: 'Agent Type', value: agentData.type, icon: 'tabler:briefcase', color: 'primary' },
                { property: 'Branch', value: agentData.branch_name, icon: 'tabler:building', color: 'info' }
              ]
            : [],
          overview: [
            {
              property: 'Member Since',
              value: new Date(user.joinDate).toLocaleDateString(),
              icon: 'tabler:calendar'
            },
            { property: 'Last Updated', value: new Date().toLocaleDateString(), icon: 'tabler:clock' },
            { property: 'Account Status', value: user.status || 'Active', icon: 'tabler:activity' }
          ],
          connections: [],
          teamsTech: []
        }

        return res.status(200).json(profileData)

      case 'profile-header':
        const headerData = {
          location: user.location || 'Not specified',
          joiningDate: new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          fullName: user.full_name,
          designation: user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' '),
          profileImg: '/images/avatars/1.png',
          designationIcon: 'tabler:color-swatch',
          coverImg: '/images/pages/profile-banner.png'
        }

        return res.status(200).json(headerData)

      case 'teams':
        // Return teams/zone data based on user role
        let teamsData: any[] = []

        if (user.zone) {
          // Get agents in the same zone
          const zoneAgentsStmt = db.prepare(`
            SELECT * FROM agents
            WHERE zone = ? AND is_active = 1
            ORDER BY type, branch_name
          `)
          const zoneAgents = zoneAgentsStmt.all(user.zone) as AgentData[]

          teamsData = zoneAgents.map((agent: any) => ({
            extraMembers: 0,
            title: `${agent.name} (${agent.type})`,
            avatar: '/images/icons/project-icons/support-label.png',
            avatarGroup: [],
            description: `${agent.type} at ${agent.branch_name} branch`,
            chips: [
              { title: agent.type, color: 'primary' },
              { title: agent.branch_name, color: 'info' }
            ]
          }))
        }

        return res.status(200).json(teamsData)

      case 'connections':
        // Return agent connections based on user role
        let connectionsData: AgentConnection[] = []

        if (agentData) {
          if (user.role === 'super_agent' || user.role === 'franchise') {
            // Get child agents connected to this super_agent/franchise
            const childAgentsStmt = db.prepare(`
              SELECT a.*, 'child' as relationship
              FROM agents a
              WHERE a.parent_agent_id = ? AND a.is_active = 1
            `)
            const childAgents = childAgentsStmt.all(agentData.id) as any[]

            connectionsData = childAgents.map(agent => ({
              id: Number(agent.id),
              agent_id: Number(agent.id),
              agent_name: agent.name,
              parent_agent_id: Number(agentData.id),
              parent_name: agentData.name,
              parent_type: user.role as 'super_agent' | 'franchise',
              relationship: 'child' as const,
              account_number: agent.account_number,
              branch_name: agent.branch_name,
              zone: agent.zone
            }))
          } else if (user.role === 'agent') {
            // Get parent connection
            if (agentData.parent_agent_id) {
              const parentAgentStmt = db.prepare(`
                SELECT * FROM agents WHERE id = ?
              `)
              const parentAgent = parentAgentStmt.get(agentData.parent_agent_id) as AgentData

              if (parentAgent) {
                connectionsData.push({
                  id: Number(parentAgent.id),
                  agent_id: Number(agentData.id),
                  agent_name: agentData.name,
                  parent_agent_id: Number(parentAgent.parent_agent_id || 0),
                  parent_name: parentAgent.name,
                  parent_type: parentAgent.type as 'super_agent' | 'franchise',
                  relationship: 'parent' as const,
                  account_number: parentAgent.account_number,
                  branch_name: parentAgent.branch_name,
                  zone: parentAgent.zone
                })
              }
            }
          }
        }

        return res.status(200).json(connectionsData)

      case 'projects':
        // Return transactions for the agent
        let transactionsData: AgentTransaction[] = []

        if (agentData) {
          const transactionsStmt = db.prepare(`
            SELECT * FROM transactions
            WHERE agent_id = ?
            ORDER BY created_at DESC
            LIMIT 50
          `)
          transactionsData = transactionsStmt.all(agentData.id) as any[]

          // Transform to match expected format
          transactionsData = transactionsData.map(tx => ({
            id: tx.id,
            transaction_id: tx.transaction_id,
            agent_id: tx.agent_id,
            agent_name: tx.agent_name,
            customer_name: tx.customer_name,
            customer_phone: tx.customer_phone,
            customer_account: tx.customer_account,
            type: tx.type as 'deposit' | 'withdrawal' | 'transfer' | 'payment',
            amount: tx.amount,
            fee: tx.fee,
            net_amount: tx.net_amount,
            commission_amount: tx.commission_amount,
            commission_eligible: tx.commission_eligible,
            status: tx.status,
            location: tx.location,
            zone: tx.zone,
            channel: tx.channel,
            narration: tx.narration,
            reference: tx.reference,
            initiated_by: tx.initiated_by,
            timestamp: tx.timestamp,
            created_at: tx.created_at
          }))
        }

        return res.status(200).json(transactionsData)

      case 'account':
        // Return user account data
        const accountData = {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          username: user.username,
          role: user.role,
          location: user.location,
          zone: user.zone,
          is_active: user.is_active,
          created_at: user.created_at,
          updated_at: user.updated_at
        }

        return res.status(200).json(accountData)

      default:
        return res.status(400).json({ message: 'Invalid tab parameter' })
    }
  } catch (error) {
    console.error('Profile API error:', error)

    return res.status(500).json({ message: 'Internal server error' })
  } finally {
    db.close()
  }
}
