import { NextApiRequest, NextApiResponse } from 'next/types'
import jwt from 'jsonwebtoken'
import { prisma } from '../../../lib/db'
import { AgentConnection, AgentTransaction } from 'src/types/apps/userTypes'

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
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        username: true,
        role: true,
        permissions: true,
        location: true,
        zone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Get agent data if user is an agent
    let agentData = null
    if (user.role === 'agent' || user.role === 'super_agent' || user.role === 'franchise') {
      agentData = await prisma.agent.findFirst({
        where: {
          OR: [{ name: user.fullName ?? '' }, { accountNumber: user.username ?? '' }]
        }
      })
    }

    // Transform data based on tab
    switch (tab) {
      case 'profile':
        const profileData = {
          about: [
            { property: 'Full Name', value: user.fullName ?? '', icon: 'tabler:user' },
            { property: 'Status', value: user.isActive ? 'active' : 'inactive', icon: 'tabler:check' },
            { property: 'Role', value: user.role ?? '', icon: 'tabler:crown' },
            { property: 'Location', value: user.location ?? 'Not specified', icon: 'tabler:flag' },
            { property: 'Zone', value: user.zone ?? 'Not specified', icon: 'tabler:map-pin' }
          ],
          contacts: [
            { property: 'Email', value: user.email ?? '', icon: 'tabler:mail' },
            { property: 'Username', value: user.username ?? '', icon: 'tabler:at' },
            { property: 'Account Number', value: agentData?.accountNumber ?? 'N/A', icon: 'tabler:hash' }
          ],
          teams: agentData
            ? [
                { property: 'Agent Type', value: agentData.type, icon: 'tabler:briefcase', color: 'primary' },
                { property: 'Branch', value: agentData.branchName, icon: 'tabler:building', color: 'info' }
              ]
            : [],
          overview: [
            {
              property: 'Member Since',
              value: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown',
              icon: 'tabler:calendar'
            },
            { property: 'Last Updated', value: new Date().toLocaleDateString(), icon: 'tabler:clock' },
            { property: 'Account Status', value: user.isActive ? 'Active' : 'Inactive', icon: 'tabler:activity' }
          ],
          connections: [],
          teamsTech: []
        }

        return res.status(200).json(profileData)

      case 'profile-header':
        const headerData = {
          location: user.location ?? 'Not specified',
          joiningDate: user.createdAt
            ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : 'Unknown',
          fullName: user.fullName,
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
          const zoneAgents = await prisma.agent.findMany({
            where: { zone: user.zone, isActive: 1 },
            orderBy: [{ type: 'asc' }, { branchName: 'asc' }]
          })

          teamsData = zoneAgents.map(agent => ({
            extraMembers: 0,
            title: `${agent.name} (${agent.type})`,
            avatar: '/images/icons/project-icons/support-label.png',
            avatarGroup: [],
            description: `${agent.type} at ${agent.branchName} branch`,
            chips: [
              { title: agent.type, color: 'primary' },
              { title: agent.branchName, color: 'info' }
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
            const childAgents = await prisma.agent.findMany({
              where: { parentAgentId: agentData.id, isActive: 1 }
            })

            connectionsData = childAgents.map(agent => ({
              id: agent.id,
              agent_id: agent.id,
              agent_name: agent.name,
              parent_agent_id: agentData.id,
              parent_name: agentData.name,
              parent_type: user.role as 'super_agent' | 'franchise',
              relationship: 'child' as const,
              account_number: agent.accountNumber,
              branch_name: agent.branchName,
              zone: agent.zone ?? ''
            }))
          } else if (user.role === 'agent') {
            // Get parent connection
            if (agentData.parentAgentId) {
              const parentAgent = await prisma.agent.findUnique({
                where: { id: agentData.parentAgentId }
              })

              if (parentAgent) {
                connectionsData.push({
                  id: parentAgent.id,
                  agent_id: agentData.id,
                  agent_name: agentData.name,
                  parent_agent_id: parentAgent.parentAgentId ?? 0,
                  parent_name: parentAgent.name,
                  parent_type: parentAgent.type as 'super_agent' | 'franchise',
                  relationship: 'parent' as const,
                  account_number: parentAgent.accountNumber,
                  branch_name: parentAgent.branchName,
                  zone: parentAgent.zone ?? ''
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
          const transactions = await prisma.transaction.findMany({
            where: { agentId: agentData.id },
            orderBy: { createdAt: 'desc' },
            take: 50
          })

          transactionsData = transactions.map(tx => ({
            id: tx.id,
            transaction_id: tx.transactionId,
            agent_id: tx.agentId ?? 0,
            agent_name: tx.agentName,
            customer_name: tx.customerName,
            customer_phone: tx.customerPhone ?? '',
            customer_account: tx.customerAccount ?? '',
            type: tx.type as 'deposit' | 'withdrawal' | 'transfer' | 'payment',
            amount: tx.amount,
            fee: tx.fee ?? 0,
            net_amount: tx.netAmount ?? 0,
            commission_amount: tx.commissionAmount ?? 0,
            commission_eligible: !!(tx.commissionEligible ?? 0),
            status: tx.status ?? 'pending',
            location: tx.location ?? '',
            zone: tx.zone ?? '',
            channel: tx.channel ?? '',
            narration: tx.narration ?? '',
            reference: tx.reference ?? '',
            initiated_by: tx.initiatedBy ?? 'customer',
            timestamp: tx.timestamp ? new Date(tx.timestamp).toISOString() : new Date().toISOString(),
            created_at: tx.createdAt ? new Date(tx.createdAt).toISOString() : new Date().toISOString()
          }))
        }

        return res.status(200).json(transactionsData)

      case 'account':
        // Return user account data
        const accountData = {
          id: user.id,
          email: user.email,
          full_name: user.fullName ?? '',
          username: user.username ?? '',
          role: user.role,
          location: user.location ?? '',
          zone: user.zone ?? '',
          is_active: user.isActive ?? true,
          created_at: user.createdAt ?? new Date(),
          updated_at: user.updatedAt ?? new Date()
        }

        return res.status(200).json(accountData)

      default:
        return res.status(400).json({ message: 'Invalid tab parameter' })
    }
  } catch (error) {
    console.error('Profile API error:', error)

    return res.status(500).json({ message: 'Internal server error' })
  }
}
