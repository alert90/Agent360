import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from 'src/lib/prisma'
import jwt from 'jsonwebtoken'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify JWT token
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET!) as any
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    const { id } = req.query
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Agent ID is required' })
    }

    const agentId = parseInt(id)

    if (req.method === 'GET') {
      // Get agent with transaction stats
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        include: {
          parentAgent: {
            select: {
              id: true,
              name: true,
              accountNumber: true,
              type: true
            }
          },
          childAgents: {
            select: {
              id: true,
              name: true,
              accountNumber: true,
              type: true,
              branchName: true,
              isActive: true,
              totalTransactionAmount: true,
              transactionCount: true
            }
          }
        }
      })

      if (!agent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found'
        })
      }

      // Get recent transactions
      const recentTransactions = await prisma.transaction.findMany({
        where: { agentId: agent.id },
        orderBy: { timestamp: 'desc' },
        take: 10
      })

      // Get transaction summary by type
      const transactionSummary = await prisma.transaction.groupBy({
        by: ['type'],
        where: { agentId: agent.id },
        _count: { type: true },
        _sum: { amount: true, commissionAmount: true },
        orderBy: { _sum: { amount: 'desc' } }
      })

      // Get monthly performance (last 6 months)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const monthlyPerformance = await prisma.$queryRaw`
        SELECT
          TO_CHAR(DATE_TRUNC('month', timestamp), 'YYYY-MM') as month,
          COUNT(*)::integer as transaction_count,
          COALESCE(SUM(amount), 0)::numeric as total_amount,
          COALESCE(SUM(commission_amount), 0)::numeric as total_commission
        FROM transactions
        WHERE agent_id = ${agentId}
          AND timestamp >= ${sixMonthsAgo}
        GROUP BY DATE_TRUNC('month', timestamp)
        ORDER BY month DESC
      `

      // Get recent transactions count and amount (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const recentStats = await prisma.transaction.aggregate({
        where: {
          agentId: agent.id,
          timestamp: { gte: thirtyDaysAgo }
        },
        _count: { id: true },
        _sum: { amount: true }
      })

      // Transform to match frontend interface
      const formattedAgent = {
        id: agent.id,
        account_number: agent.accountNumber,
        name: agent.name,
        username: agent.username,
        email: agent.email,
        phone: agent.phone,
        contact: agent.contact,
        role: agent.role,
        type: agent.type,
        branch_code: agent.branchCode,
        branch_name: agent.branchName,
        region: agent.region,
        zone: agent.zone,
        parent_agent_id: agent.parentAgentId,
        is_active: agent.isActive === 1,
        status: agent.isActive === 1 ? 'active' : 'inactive',
        total_transaction_amount: agent.totalTransactionAmount || 0,
        transaction_count: agent.transactionCount || 0,
        commission_amount: agent.commissionAmount || 0,
        commission_eligible: agent.commissionEligible === 1,
        payband: agent.payband || 1.0,
        created_at: agent.createdAt?.toISOString(),
        updated_at: agent.updatedAt?.toISOString(),
        recent_transactions: recentStats._count.id || 0,
        recent_amount: recentStats._sum.amount || 0,
        parent_agent: agent.parentAgent
          ? {
              id: agent.parentAgent.id,
              name: agent.parentAgent.name,
              account_number: agent.parentAgent.accountNumber,
              type: agent.parentAgent.type
            }
          : null,
        child_agents: agent.childAgents.map(ca => ({
          id: ca.id,
          name: ca.name,
          account_number: ca.accountNumber,
          type: ca.type,
          branch_name: ca.branchName,
          is_active: ca.isActive === 1,
          transaction_count: ca.transactionCount || 0,
          total_amount: ca.totalTransactionAmount || 0
        })),
        recent_transactions_data: recentTransactions.map(t => ({
          id: t.id,
          transaction_id: t.transactionId,
          customer_name: t.customerName,
          customer_phone: t.customerPhone,
          type: t.type,
          amount: t.amount,
          commission_amount: t.commissionAmount,
          status: t.status,
          timestamp: t.timestamp
        })),
        transaction_summary: transactionSummary.map(ts => ({
          type: ts.type,
          count: ts._count.type,
          total_amount: ts._sum.amount || 0,
          total_commission: ts._sum.commissionAmount || 0
        })),
        monthly_performance: monthlyPerformance
      }

      res.status(200).json({
        success: true,
        data: formattedAgent
      })
    } else if (req.method === 'PUT') {
      const {
        name,
        username,
        email,
        phone,
        contact,
        role,
        region,
        zone,
        account_number,
        type,
        branch_name,
        branch_code,
        is_active
      } = req.body

      // Check if agent exists
      const existingAgent = await prisma.agent.findUnique({
        where: { id: agentId }
      })

      if (!existingAgent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found'
        })
      }

      // Update agent
      const updatedAgent = await prisma.agent.update({
        where: { id: agentId },
        data: {
          name: name || existingAgent.name,
          username: username || existingAgent.username,
          email: email || existingAgent.email,
          phone: phone || existingAgent.phone,
          contact: contact || existingAgent.contact,
          role: role || existingAgent.role,
          region: region || existingAgent.region,
          zone: zone || existingAgent.zone,
          accountNumber: account_number || existingAgent.accountNumber,
          type: type || existingAgent.type,
          branchName: branch_name || existingAgent.branchName,
          branchCode: branch_code || existingAgent.branchCode,
          isActive: is_active !== undefined ? (is_active ? 1 : 0) : existingAgent.isActive,
          updatedAt: new Date()
        }
      })

      res.status(200).json({
        success: true,
        message: 'Agent updated successfully',
        data: updatedAgent
      })
    } else {
      res.setHeader('Allow', ['GET', 'PUT'])
      res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Agent account API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to process agent account request',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
