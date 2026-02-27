import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { period, agentId } = req.query

    if (!period || typeof period !== 'string') {
      return res.status(400).json({ message: 'Period parameter is required (YYYY-MM format)' })
    }

    const db = new Database('agent360.db')

    // Get commission calculations for the period
    let query = `
      SELECT cc.*,
             a.account_number,
             a.name as agent_name,
             a.type as agent_type,
             a.branch_name,
             a.is_active
      FROM commission_calculations cc
      JOIN agents a ON cc.agent_id = a.id
      WHERE cc.period = ?
    `

    const params: any[] = [period]

    if (agentId && typeof agentId === 'string') {
      query += ' AND cc.agent_id = ?'
      params.push(agentId)
    }

    query += ' ORDER BY cc.final_commission DESC'

    const calculations = db.prepare(query).all(...params)

    // Get summary statistics
    const summaryQuery = `
      SELECT
        COUNT(*) as total_agents,
        SUM(cc.final_commission) as total_commission,
        SUM(cc.total_amount) as total_amount,
        SUM(cc.transaction_count) as total_transactions,
        AVG(cc.commission_rate) as avg_commission_rate
      FROM commission_calculations cc
      WHERE cc.period = ?
    `

    const summaryResult: any = db.prepare(summaryQuery).get(period)

    const summary = {
      total_agents: Number(summaryResult?.total_agents || 0),
      total_commission: Number(summaryResult?.total_commission || 0),
      total_amount: Number(summaryResult?.total_amount || 0),
      total_transactions: Number(summaryResult?.total_transactions || 0),
      avg_commission_rate: Number(summaryResult?.avg_commission_rate || 0)
    }

    // Get agent type breakdown
    const breakdownQuery = `
      SELECT
        a.type as agent_type,
        COUNT(*) as agent_count,
        SUM(cc.final_commission) as total_commission,
        AVG(cc.final_commission) as avg_commission
      FROM commission_calculations cc
      JOIN agents a ON cc.agent_id = a.id
      WHERE cc.period = ?
      GROUP BY a.type
    `

    const breakdownResult: any[] = db.prepare(breakdownQuery).all(period)

    const breakdown = breakdownResult.map(item => ({
      agent_type: item.agent_type,
      agent_count: Number(item.agent_count),
      total_commission: Number(item.total_commission),
      avg_commission: Number(item.avg_commission)
    }))

    db.close()

    return res.status(200).json({
      period,
      summary,
      breakdown,
      calculations: calculations.map((calc: any) => ({
        id: calc.id,
        agent_id: calc.agent_id,
        agent_name: calc.agent_name,
        agent_type: calc.agent_type,
        account_number: calc.account_number,
        branch_name: calc.branch_name,
        period: calc.period,
        total_amount: Number(calc.total_amount),
        transaction_count: Number(calc.transaction_count),
        eligible_amount: Number(calc.eligible_amount),
        commission_rate: Number(calc.commission_rate),
        commission_amount: Number(calc.commission_amount),
        payband: Number(calc.payband),
        final_commission: Number(calc.final_commission),
        is_active: calc.is_active === 1
      }))
    })
  } catch (error) {
    console.error('Monthly commission error:', error)

    return res.status(500).json({
      message: 'Failed to fetch monthly commission data',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
