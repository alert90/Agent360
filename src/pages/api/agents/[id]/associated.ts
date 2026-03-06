import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from 'src/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id) {
    return res.status(400).json({ message: 'Agent ID is required' })
  }

  const agentId = parseInt(id as string)

  try {
    // First get the agent to check their type
    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    })

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      })
    }

    // Only super_agent and franchise can have associated agents
    if (agent.type !== 'super_agent' && agent.type !== 'franchise') {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Local agents cannot have associated agents'
      })
    }

    // Query for assigned agents
    const associatedAgents = await prisma.$queryRaw<
      {
        id: number
        name: string
        account_number: string
        type: string
        is_active: boolean
        assigned_at: Date
        total_transactions: bigint
        total_amount: number
      }[]
    >`
      SELECT
        a."id",
        a."name",
        a."accountNumber" as account_number,
        a."type",
        a."isActive" as is_active,
        a."createdAt" as assigned_at,  -- Using createdAt as proxy for assigned_at; adjust if there's a better field
        COUNT(t."id") as total_transactions,
        COALESCE(SUM(t."amount")::float, 0) as total_amount
      FROM "agents" a
      LEFT JOIN "transactions" t ON t."agentId" = a."id"
      WHERE a."parentAgentId" = ${agentId}
      GROUP BY a."id"
      ORDER BY total_transactions DESC, total_amount DESC
    `

    // Map to match frontend interface (convert bigint to number)
    const formattedAgents = associatedAgents.map(agent => ({
      ...agent,
      is_active: agent.is_active === 1, // Assuming isActive is stored as 1/0
      total_transactions: Number(agent.total_transactions),
      total_amount: agent.total_amount,
      assigned_at: agent.assigned_at.toISOString()
    }))

    res.status(200).json({
      success: true,
      data: formattedAgents
    })
  } catch (error) {
    console.error('Error fetching associated agents:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch associated agents',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
