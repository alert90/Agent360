import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const db = new Database('agent360.db')

  try {
    // Get performance metrics
    const totalTransactions = db.prepare('SELECT COUNT(*) as count FROM transactions').get() as { count: number }
    const totalAmount = db.prepare('SELECT SUM(amount) as total FROM transactions').get() as { total: number }
    const totalAgents = db.prepare('SELECT COUNT(*) as count FROM agents').get() as { count: number }
    const activeAgents = db.prepare('SELECT COUNT(*) as count FROM agents WHERE is_active = 1').get() as {
      count: number
    }

    // Get monthly trends
    const monthlyTrends = db
      .prepare(
        `
      SELECT
        strftime('%Y-%m', timestamp) as month,
        COUNT(*) as transactions,
        SUM(amount) as totalAmount,
        AVG(amount) as avgAmount
      FROM transactions
      WHERE timestamp >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', timestamp)
      ORDER BY month DESC
    `
      )
      .all()

    // Get top performing agents
    const topAgents = db
      .prepare(
        `
      SELECT
        a.name,
        a.account_number,
        COUNT(t.id) as transactionCount,
        SUM(t.amount) as totalAmount,
        AVG(t.amount) as avgAmount
      FROM agents a
      LEFT JOIN transactions t ON a.id = t.agent_id
      WHERE t.timestamp >= date('now', '-30 days')
      GROUP BY a.id
      ORDER BY totalAmount DESC
      LIMIT 10
    `
      )
      .all()

    // Get transaction types breakdown
    const transactionTypes = db
      .prepare(
        `
      SELECT
        type,
        COUNT(*) as count,
        SUM(amount) as total
      FROM transactions
      WHERE timestamp >= date('now', '-30 days')
      GROUP BY type
    `
      )
      .all()

    // Get zone performance
    const zonePerformance = db
      .prepare(
        `
      SELECT
        zone,
        COUNT(*) as transactions,
        SUM(amount) as totalAmount
      FROM transactions
      WHERE timestamp >= date('now', '-30 days') AND zone IS NOT NULL
      GROUP BY zone
      ORDER BY totalAmount DESC
    `
      )
      .all()

    // Get commission summary
    const commissionSummary = db
      .prepare(
        `
      SELECT
        COUNT(*) as calculations,
        SUM(final_commission) as totalCommission,
        AVG(final_commission) as avgCommission
      FROM commission_calculations
      WHERE period >= strftime('%Y-%m', date('now', '-6 months'))
    `
      )
      .get() as any

    const performance = {
      overview: {
        totalTransactions: totalTransactions.count,
        totalAmount: totalAmount?.total || 0,
        totalAgents: totalAgents.count,
        activeAgents: activeAgents.count,
        avgTransactionAmount: totalAmount?.total ? totalAmount.total / totalTransactions.count : 0
      },
      trends: {
        monthly: monthlyTrends.map((trend: any) => ({
          month: trend.month,
          transactions: trend.transactions,
          totalAmount: trend.totalAmount || 0,
          avgAmount: trend.avgAmount || 0
        }))
      },
      topAgents: topAgents.map((agent: any) => ({
        name: agent.name,
        accountNumber: agent.account_number,
        transactionCount: agent.transactionCount,
        totalAmount: agent.totalAmount || 0,
        avgAmount: agent.avgAmount || 0
      })),
      transactionTypes: transactionTypes.map((type: any) => ({
        type: type.type,
        count: type.count,
        total: type.total || 0
      })),
      zonePerformance: zonePerformance.map((zone: any) => ({
        zone: zone.zone || 'Unknown',
        transactions: zone.transactions,
        totalAmount: zone.totalAmount || 0
      })),
      commissions: {
        calculations: commissionSummary?.calculations || 0,
        totalCommission: commissionSummary?.totalCommission || 0,
        avgCommission: commissionSummary?.avgCommission || 0
      }
    }

    return res.status(200).json(performance)
  } catch (error) {
    console.error('Performance API error:', error)

    return res.status(500).json({
      message: 'Failed to fetch performance data',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
