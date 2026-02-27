import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = new Database('agent360.db')

  try {
    if (req.method === 'GET') {
      const { search = '', page = 1, limit = 25, type = '', sortBy = 'created_at', sortOrder = 'desc' } = req.query

      const offset = (Number(page) - 1) * Number(limit)
      let whereClause = 'WHERE is_active = 1'
      const params: any[] = []

      // Add search filter
      if (search) {
        whereClause += ' AND (name LIKE ? OR account_number LIKE ? OR branch_name LIKE ?)'
        params.push(`%${search}%`, `%${search}%`, `%${search}%`)
      }

      // Add type filter
      if (type) {
        whereClause += ' AND type = ?'
        params.push(type)
      }

      // Validate sort column
      const validSortColumns = [
        'name',
        'account_number',
        'type',
        'branch_name',
        'created_at',
        'transaction_count',
        'total_transaction_amount',
        'commission_amount'
      ]
      const validSortOrder = ['asc', 'desc']

      const finalSortBy = validSortColumns.includes(sortBy as string) ? sortBy : 'created_at'
      const finalSortOrder = validSortOrder.includes(sortOrder as string) ? sortOrder : 'desc'

      // Get agents with real-time transaction counts and amounts
      // Sort by agent type priority first (super_agent, franchise, local_agent), then by selected field
      const agentsQuery = `
        SELECT
          a.*,
          COALESCE(t_stats.transaction_count, 0) as transaction_count,
          COALESCE(t_stats.total_amount, 0) as total_transaction_amount,
          COALESCE(t_stats.commission_amount, 0) as commission_amount,
          CASE
            WHEN a.type = 'super_agent' THEN 1
            WHEN a.type = 'franchise' THEN 2
            WHEN a.type = 'local_agent' THEN 3
            ELSE 4
          END as type_priority
        FROM agents a
        LEFT JOIN (
          SELECT
            agent_id,
            COUNT(*) as transaction_count,
            SUM(amount) as total_amount,
            SUM(commission_amount) as commission_amount
          FROM transactions
          WHERE status = 'completed'
          GROUP BY agent_id
        ) t_stats ON a.id = t_stats.agent_id
        ${whereClause}
        ORDER BY type_priority ASC, ${finalSortBy} ${(finalSortOrder as string).toUpperCase()}
        LIMIT ? OFFSET ?
      `

      const agents = db.prepare(agentsQuery).all(...params, Number(limit), offset)

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total FROM agents
        ${whereClause}
      `
      const countResult = db.prepare(countQuery).get(...params)
      const total = (countResult as any)?.total || 0

      // Get unique types for filter
      const typesQuery = `
        SELECT DISTINCT type
        FROM agents
        WHERE type IS NOT NULL AND type != ''
        ORDER BY type
      `
      const types = db.prepare(typesQuery).all() as any[]

      // Get statistics
      const statsQuery = `
        SELECT
          COUNT(*) as totalAgents,
          SUM(CASE WHEN type = 'franchise' THEN 1 ELSE 0 END) as totalFranchise,
          SUM(CASE WHEN type = 'super_agent' THEN 1 ELSE 0 END) as totalSuperAgents,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as activeAgents
        FROM agents
      `
      const stats = db.prepare(statsQuery).get() as any

      res.status(200).json({
        success: true,
        data: agents,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        },
        filters: {
          types: types.map((t: any) => t.type)
        },
        stats: {
          totalAgents: stats.totalAgents || 0,
          totalFranchise: stats.totalFranchise || 0,
          totalSuperAgents: stats.totalSuperAgents || 0,
          activeAgents: stats.activeAgents || 0
        }
      })
    } else {
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Agents list API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agents',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
