import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../../lib/db'

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
    // Get the agent details
    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    })

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      })
    }

    // Determine agent type
    const isSuperAgentOrFranchise = agent.type === 'super_agent' || agent.type === 'franchise'

    // Threshold: 1 transaction
    const threshold = 1

    // Query to find unique agent accounts (starting with 01J7) that this agent has made deposits/transfers to
    const transactionAgents = await prisma.$queryRaw<any[]>`
      SELECT
        t."customer_account" as account_number,
        COUNT(*) as transaction_count,
        SUM(t.amount) as total_amount,
        MAX(t."timestamp") as last_transaction_date,
        STRING_AGG(DISTINCT t."type", ',') as transaction_types
      FROM "transactions" t
      WHERE t."agent_id" = ${agentId}
        AND t."type" IN ('deposit', 'transfer')
        AND t."customer_account" IS NOT NULL
        AND t."customer_account" LIKE '01J7%'
        AND t."customer_account" != ${agent.accountNumber}
      GROUP BY t."customer_account"
      HAVING COUNT(*) >= ${threshold}
      ORDER BY transaction_count DESC, total_amount DESC
    `

    const accountNumbers = transactionAgents.map((t: any) => t.account_number)

    let agentDetails: any[] = []

    if (accountNumbers.length > 0) {
      // Get agent details from the agents table
      const agentDetailsRows = await prisma.agent.findMany({
        where: {
          accountNumber: { in: accountNumbers }
        },
        select: {
          id: true,
          name: true,
          accountNumber: true,
          type: true,
          isActive: true,
          parentAgentId: true
        }
      })

      // Create a map for quick lookup
      const agentMap = new Map(agentDetailsRows.map(a => [a.accountNumber, a]))

      // Merge transaction data with agent details
      agentDetails = transactionAgents.map((t: any) => {
        const agentInfo = agentMap.get(t.account_number)

        return {
          id: agentInfo?.id || null,
          name: agentInfo?.name || t.account_number,
          account_number: t.account_number,
          type: agentInfo?.type || 'unknown',
          is_active: agentInfo?.isActive === 1,
          parent_agent_id: agentInfo?.parentAgentId,
          transaction_count: Number(t.transaction_count),
          total_amount: Number(t.total_amount),
          last_transaction_date: t.last_transaction_date,
          transaction_types: t.transaction_types,
          is_detected: true,
          is_assigned: agentInfo?.parentAgentId === agentId
        }
      })
    }

    // Auto-detect agent type based on transaction patterns
    let detectedType: string | null = null
    let isAutoDetected = false

    if (!isSuperAgentOrFranchise && transactionAgents.length > 0) {
      // Check transaction type ratio
      const typeCounts = await prisma.$queryRaw<any[]>`
        SELECT t."type", COUNT(*) as count
        FROM "transactions" t
        WHERE t."agent_id" = ${agentId}
          AND t."type" IN ('deposit', 'transfer')
          AND t."customer_account" IS NOT NULL
          AND t."customer_account" LIKE '01J7%'
          AND t."customer_account" != ${agent.accountNumber}
        GROUP BY t."type"
      `

      let depositCount = 0
      let transferCount = 0

      typeCounts.forEach((row: any) => {
        if (row.type === 'deposit') depositCount = Number(row.count)
        if (row.type === 'transfer') transferCount = Number(row.count)
      })

      if (depositCount > transferCount) {
        detectedType = 'franchise'
      } else {
        detectedType = 'super_agent'
      }
      isAutoDetected = true
    }

    // Count assigned vs unassigned
    const assignedCount = agentDetails.filter(a => a.is_assigned).length
    const unassignedCount = agentDetails.length - assignedCount

    res.status(200).json({
      success: true,
      data: agentDetails,
      meta: {
        threshold,
        agent_type: agent.type,
        detected_type: detectedType,
        is_auto_detected: isAutoDetected,
        total_detected: agentDetails.length,
        assigned_count: assignedCount,
        unassigned_count: unassignedCount
      }
    })
  } catch (error) {
    console.error('Error fetching transaction agents:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction agents',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
