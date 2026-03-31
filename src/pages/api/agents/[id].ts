import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Agent ID is required' })
  }

  const agentId = parseInt(id)

  try {
    if (req.method === 'GET') {
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
            where: { isActive: 1 },
            take: 20,
            select: {
              id: true,
              name: true,
              accountNumber: true,
              type: true,
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

      // Get transaction stats
      const transactionStats = await prisma.transaction.aggregate({
        where: { agentId: agent.id },
        _count: { id: true },
        _sum: { amount: true, commissionAmount: true }
      })

      // Transform to camelCase for frontend
      const transformedAgent = {
        id: agent.id,
        name: agent.name,
        accountNumber: agent.accountNumber,
        type: agent.type,
        isActive: agent.isActive === 1,
        parentAgentId: agent.parentAgentId,
        parentAgent: agent.parentAgent,
        childAgents: agent.childAgents,
        email: agent.email,
        phone: agent.phone,
        contact: agent.contact,
        branchCode: agent.branchCode,
        branchName: agent.branchName,
        region: agent.region,
        zone: agent.zone,
        username: agent.username,
        role: agent.role,
        commissionEligible: agent.commissionEligible === 1,
        totalTransactionAmount: agent.totalTransactionAmount || 0,
        transactionCount: agent.transactionCount || 0,
        commissionAmount: agent.commissionAmount || 0,
        payband: agent.payband || 1.0,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
        recentTransactions: recentTransactions.map(t => ({
          id: t.id,
          transactionId: t.transactionId,
          customerName: t.customerName,
          amount: t.amount,
          type: t.type,
          status: t.status,
          timestamp: t.timestamp
        })),
        stats: {
          totalTransactions: transactionStats._count.id || 0,
          totalAmount: Number(transactionStats._sum?.amount || 0),
          totalCommission: Number(transactionStats._sum?.commissionAmount || 0)
        }
      }

      res.status(200).json({
        success: true,
        data: transformedAgent
      })
    } else if (req.method === 'PUT') {
      const { name, accountNumber, type, isActive, email, phone, contact, branchCode, branchName, region, zone } =
        req.body

      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Agent name is required and cannot be empty'
        })
      }

      if (!accountNumber || accountNumber.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Account number is required and cannot be empty'
        })
      }

      const existingAgent = await prisma.agent.findUnique({
        where: { id: agentId }
      })

      if (!existingAgent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found'
        })
      }

      const updatedAgent = await prisma.agent.update({
        where: { id: agentId },
        data: {
          name,
          accountNumber,
          type: type || existingAgent.type,
          isActive: isActive !== undefined ? (isActive ? 1 : 0) : existingAgent.isActive,
          email,
          phone,
          contact,
          branchCode: branchCode || existingAgent.branchCode,
          branchName: branchName || existingAgent.branchName,
          region: region || existingAgent.region,
          zone: zone || existingAgent.zone,
          updatedAt: new Date()
        }
      })

      res.status(200).json({
        success: true,
        message: 'Agent updated successfully',
        data: updatedAgent
      })
    }
  } catch (error) {
    console.error('Error in agent API:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
