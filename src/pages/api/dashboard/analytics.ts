import { NextApiRequest, NextApiResponse } from 'next/types'
import jwt from 'jsonwebtoken'
import { prisma } from '../../../lib/db'
import { Prisma } from '@prisma/client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token
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

    const { period = 'monthly', transactionType = 'all', startDate, endDate } = req.query

    const whereClause: any = {}

    if (user.role === 'agent') {
      whereClause.agentId = user.id
    } else if (user.role === 'super_agent' || user.role === 'franchise') {
      const userAgents = await prisma.agent.findMany({
        where: { parentAgentId: user.id, isActive: 1 },
        select: { id: true }
      })
      if (userAgents.length > 0) {
        whereClause.agentId = { in: userAgents.map(a => a.id) }
      } else {
        whereClause.id = -1
      }
    }

    if (transactionType !== 'all') {
      whereClause.type = transactionType
    }

    const dateFilter: any = {}
    if (startDate) dateFilter.gte = new Date(startDate as string)
    if (endDate) dateFilter.lte = new Date(endDate as string)
    if (Object.keys(dateFilter).length > 0) {
      whereClause.timestamp = dateFilter
    }

    const stats = await prisma.transaction.aggregate({
      where: whereClause,
      _count: { id: true },
      _sum: { amount: true, commissionAmount: true },
      _avg: { amount: true }
    })

    const userCounts: any = { superAgentCount: 0, agentCount: 0, franchiseCount: 0 }

    if (user.role === 'super_agent') {
      userCounts.agentCount = await prisma.agent.count({
        where: { parentAgentId: user.id, type: 'local_agent', isActive: 1 }
      })
    } else if (user.role === 'franchise') {
      const [superAgents, localAgents] = await Promise.all([
        prisma.agent.count({ where: { parentAgentId: user.id, type: 'super_agent', isActive: 1 } }),
        prisma.agent.count({ where: { parentAgentId: user.id, type: 'local_agent', isActive: 1 } })
      ])
      userCounts.superAgentCount = superAgents
      userCounts.agentCount = localAgents
    } else if (user.role === 'admin' || user.role === 'analyst') {
      const [superAgents, localAgents, franchises] = await Promise.all([
        prisma.agent.count({ where: { type: 'super_agent', isActive: 1 } }),
        prisma.agent.count({ where: { type: 'local_agent', isActive: 1 } }),
        prisma.agent.count({ where: { type: 'franchise', isActive: 1 } })
      ])
      userCounts.superAgentCount = superAgents
      userCounts.agentCount = localAgents
      userCounts.franchiseCount = franchises
    }

    // Build WHERE clause for raw SQL - simplified approach
    let timeSeriesData: any[] = []

    if (period === 'daily') {
      timeSeriesData = await prisma.$queryRaw`
        SELECT
          DATE(t."timestamp") as date,
          COUNT(*)::integer as transactions,
          COALESCE(SUM(t."amount"), 0)::numeric as amount,
          COALESCE(SUM(t."commissionAmount"), 0)::numeric as commission
        FROM "transactions" t
        WHERE 1=1
        ${
          whereClause.agentId
            ? Prisma.sql`AND t."agentId" IN (${Prisma.join(
                Array.isArray(whereClause.agentId.in) ? whereClause.agentId.in : [whereClause.agentId]
              )})`
            : Prisma.empty
        }
        ${whereClause.type ? Prisma.sql`AND t."type" = ${whereClause.type}` : Prisma.empty}
        ${whereClause.timestamp?.gte ? Prisma.sql`AND t."timestamp" >= ${whereClause.timestamp.gte}` : Prisma.empty}
        ${whereClause.timestamp?.lte ? Prisma.sql`AND t."timestamp" <= ${whereClause.timestamp.lte}` : Prisma.empty}
        GROUP BY DATE(t."timestamp")
        ORDER BY DATE(t."timestamp") DESC
        LIMIT 30
      `
    } else if (period === 'weekly') {
      timeSeriesData = await prisma.$queryRaw`
        SELECT
          TO_CHAR(DATE_TRUNC('week', t."timestamp"), 'YYYY-IW') as week,
          COUNT(*)::integer as transactions,
          COALESCE(SUM(t."amount"), 0)::numeric as amount,
          COALESCE(SUM(t."commissionAmount"), 0)::numeric as commission
        FROM "transactions" t
        WHERE 1=1
        ${
          whereClause.agentId
            ? Prisma.sql`AND t."agentId" IN (${Prisma.join(
                Array.isArray(whereClause.agentId.in) ? whereClause.agentId.in : [whereClause.agentId]
              )})`
            : Prisma.empty
        }
        ${whereClause.type ? Prisma.sql`AND t."type" = ${whereClause.type}` : Prisma.empty}
        ${whereClause.timestamp?.gte ? Prisma.sql`AND t."timestamp" >= ${whereClause.timestamp.gte}` : Prisma.empty}
        ${whereClause.timestamp?.lte ? Prisma.sql`AND t."timestamp" <= ${whereClause.timestamp.lte}` : Prisma.empty}
        GROUP BY DATE_TRUNC('week', t."timestamp")
        ORDER BY DATE_TRUNC('week', t."timestamp") DESC
        LIMIT 12
      `
    } else {
      timeSeriesData = await prisma.$queryRaw`
        SELECT
          TO_CHAR(DATE_TRUNC('month', t."timestamp"), 'YYYY-MM') as month,
          COUNT(*)::integer as transactions,
          COALESCE(SUM(t."amount"), 0)::numeric as amount,
          COALESCE(SUM(t."commissionAmount"), 0)::numeric as commission
        FROM "transactions" t
        WHERE 1=1
        ${
          whereClause.agentId
            ? Prisma.sql`AND t."agentId" IN (${Prisma.join(
                Array.isArray(whereClause.agentId.in) ? whereClause.agentId.in : [whereClause.agentId]
              )})`
            : Prisma.empty
        }
        ${whereClause.type ? Prisma.sql`AND t."type" = ${whereClause.type}` : Prisma.empty}
        ${whereClause.timestamp?.gte ? Prisma.sql`AND t."timestamp" >= ${whereClause.timestamp.gte}` : Prisma.empty}
        ${whereClause.timestamp?.lte ? Prisma.sql`AND t."timestamp" <= ${whereClause.timestamp.lte}` : Prisma.empty}
        GROUP BY DATE_TRUNC('month', t."timestamp")
        ORDER BY DATE_TRUNC('month', t."timestamp") DESC
        LIMIT 12
      `
    }

    res.status(200).json({
      success: true,
      data: {
        totalTransactions: stats._count.id || 0,
        totalAmount: Number(stats._sum?.amount || 0),
        totalCommission: Number(stats._sum?.commissionAmount || 0),
        avgTransactionAmount: Number(stats._avg?.amount || 0),
        userCounts,
        timeSeriesData
      }
    })
  } catch (error) {
    console.error('Dashboard analytics API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
