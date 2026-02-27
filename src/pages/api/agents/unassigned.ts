import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const db = new Database('agent360.db')

  try {
    const {
      search = '',
      page = 1,
      limit = 25,
      sortBy = 'name',
      sortOrder = 'asc',
      super_agent_id = '',
      franchise_id = ''
    } = req.query

    const offset = (Number(page) - 1) * Number(limit)

    // Build WHERE clause for unassigned local agents
    let whereClause = "WHERE a.type = 'local_agent' AND a.parent_agent_id IS NULL"
    const params: any[] = []

    // Add search filter
    if (search) {
      whereClause += ' AND (a.name LIKE ? OR a.account_number LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    // Add context filter - only show unassigned agents when a super agent or franchise is selected
    if (super_agent_id) {
      whereClause += " AND EXISTS (SELECT 1 FROM agents sa WHERE sa.id = ? AND sa.type = 'super_agent')"
      params.push(super_agent_id)
    } else if (franchise_id) {
      whereClause += " AND EXISTS (SELECT 1 FROM agents f WHERE f.id = ? AND f.type = 'franchise')"
      params.push(franchise_id)
    }

    // Validate sort column
    const validSortColumns = ['name', 'account_number', 'type', 'created_at', 'is_active']
    const validSortOrder = ['asc', 'desc']

    const finalSortBy = validSortColumns.includes(sortBy as string) ? sortBy : 'name'
    const finalSortOrder = validSortOrder.includes(sortOrder as string) ? sortOrder : 'asc'

    // Get unassigned agents with pagination
    const agentsQuery = `
      SELECT
        a.id,
        a.name,
        a.account_number,
        a.type,
        a.is_active,
        a.parent_agent_id,
        a.created_at,
        a.email,
        a.phone,
        COALESCE(t_stats.transaction_count, 0) as transaction_count,
        COALESCE(t_stats.total_amount, 0) as total_transaction_amount
      FROM agents a
      LEFT JOIN (
        SELECT
          agent_id,
          COUNT(*) as transaction_count,
          SUM(amount) as total_amount
        FROM transactions
        WHERE status = 'completed'
        GROUP BY agent_id
      ) t_stats ON a.id = t_stats.agent_id
      ${whereClause}
      ORDER BY a.${finalSortBy} ${(finalSortOrder as string).toUpperCase()}
      LIMIT ? OFFSET ?
    `

    const agents = db.prepare(agentsQuery).all(...params, Number(limit), offset)

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total FROM agents a
      ${whereClause}
    `
    const countResult = db.prepare(countQuery).get(...params)
    const total = (countResult as any)?.total || 0

    res.status(200).json({
      success: true,
      data: agents,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Error fetching unassigned agents:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unassigned agents',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
