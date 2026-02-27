import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const db = new Database('agent360.db')

  try {
    const { period, agentType, lastMonths } = req.query

    // Calculate date 3 months ago
    const monthsBack = lastMonths ? parseInt(lastMonths as string) : 3
    const dateLimit = new Date()
    dateLimit.setMonth(dateLimit.getMonth() - monthsBack)
    const dateLimitStr = dateLimit.toISOString().split('T')[0] // YYYY-MM-DD format

    let query = `
      SELECT
        cc.id,
        cc.agent_id,
        cc.agent_name,
        cc.agent_type,
        cc.period,
        cc.total_amount,
        cc.transaction_count,
        cc.eligible_amount,
        cc.commission_rate,
        cc.commission_amount,
        cc.payband,
        cc.final_commission,
        cc.created_at,
        cc.updated_at,
        a.account_number,
        a.branch_code,
        a.branch_name
      FROM commission_calculations cc
      LEFT JOIN agents a ON cc.agent_id = a.id
    `

    const params: any[] = []
    const conditions: string[] = []

    // Always filter for last N months unless specific period requested
    if (!period) {
      conditions.push('cc.created_at >= ?')
      params.push(dateLimitStr)
    }

    if (period) {
      conditions.push('cc.period = ?')
      params.push(period)
    }

    if (agentType) {
      conditions.push('cc.agent_type = ?')
      params.push(agentType)
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += ' ORDER BY cc.created_at DESC'

    const calculations = db.prepare(query).all(...params) as any[]

    // Get KPI data for super agents
    const kpiData: any[] = []
    for (const calc of calculations) {
      if (calc.agent_type === 'super_agent') {
        const kpi = db
          .prepare(
            `
          SELECT
            activeness_score,
            value_transacted_score,
            unique_agents_score,
            total_score
          FROM super_agent_kpis
          WHERE super_agent_id = ? AND period = ?
        `
          )
          .get(calc.agent_id, calc.period) as any

        if (kpi) {
          kpiData.push({
            agentId: calc.agent_id,
            period: calc.period,
            ...kpi
          })
        }
      }
    }

    // Get franchise data
    const franchiseData: any[] = []
    for (const calc of calculations) {
      if (calc.agent_type === 'franchise') {
        const franchise = db
          .prepare(
            `
          SELECT
            agent_to_customer_value,
            expected_turnover,
            actual_turnover,
            clawback_amount,
            final_commission as franchise_final_commission
          FROM franchise_calculations
          WHERE franchise_id = ? AND period = ?
        `
          )
          .get(calc.agent_id, calc.period) as any

        if (franchise) {
          franchiseData.push({
            agentId: calc.agent_id,
            period: calc.period,
            ...franchise
          })
        }
      }
    }

    // Transform data to match frontend types
    const transformedCalculations = calculations.map(calc => {
      const kpiInfo = kpiData.find(k => k.agentId === calc.agent_id && k.period === calc.period)
      const franchiseInfo = franchiseData.find(f => f.agentId === calc.agent_id && f.period === calc.period)

      return {
        id: calc.id.toString(),
        agentId: calc.agent_id.toString(),
        agentName: calc.agent_name,
        agentType: calc.agent_type,
        accountNumber: calc.account_number,
        branchCode: calc.branch_code,
        branchName: calc.branch_name,
        period: calc.period,
        totalAmount: calc.total_amount,
        transactionCount: calc.transaction_count,
        eligibleAmount: calc.eligible_amount,
        commissionRate: calc.commission_rate,
        commissionAmount: calc.commission_amount,
        payband: calc.payband,
        finalCommission: calc.final_commission,
        createdAt: calc.created_at,
        updatedAt: calc.updated_at,

        // Additional data for detailed view
        kpiScores: kpiInfo
          ? {
              activeness: kpiInfo.activeness_score,
              valueTransacted: kpiInfo.value_transacted_score,
              uniqueAgents: kpiInfo.unique_agents_score,
              total: kpiInfo.total_score
            }
          : null,
        franchiseData: franchiseInfo || null
      }
    })

    // Get summary statistics
    const summary = db
      .prepare(
        `
      SELECT
        COUNT(*) as total_records,
        COUNT(DISTINCT agent_type) as agent_types,
        SUM(final_commission) as total_commission,
        AVG(final_commission) as avg_commission,
        MAX(final_commission) as max_commission,
        MIN(final_commission) as min_commission,
        SUM(transaction_count) as total_transactions,
        SUM(total_amount) as total_amount
      FROM commission_calculations
      ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
    `
      )
      .get(...params) as any

    return res.status(200).json({
      success: true,
      data: transformedCalculations,
      summary: {
        totalRecords: summary?.total_records || 0,
        agentTypes: summary?.agent_types || 0,
        totalCommission: summary?.total_commission || 0,
        avgCommission: summary?.avg_commission || 0,
        maxCommission: summary?.max_commission || 0,
        minCommission: summary?.min_commission || 0,
        totalTransactions: summary?.total_transactions || 0,
        totalAmount: summary?.total_amount || 0
      },
      filters: {
        period: period || 'all',
        agentType: agentType || 'all'
      }
    })
  } catch (error) {
    console.error('Failed to fetch commission history:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch commission history',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
