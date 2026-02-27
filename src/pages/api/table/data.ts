import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = new Database('agent360.db')

  try {
    if (req.method === 'GET') {
      const { q = '', sort = 'asc', column = 'full_name' } = req.query

      // Build where clause for search
      let whereClause = ''
      const params: any[] = []

      if (q) {
        whereClause = 'WHERE (name LIKE ? OR account_number LIKE ? OR branch_name LIKE ?)'
        params.push(`%${q}%`, `%${q}%`, `%${q}%`)
      }

      // Validate sort column
      const validColumns = ['name', 'account_number', 'type', 'branch_name', 'created_at', 'transaction_count']
      const sortColumn = validColumns.includes(column as string) ? column : 'name'
      const sortOrder = sort === 'desc' ? 'DESC' : 'ASC'

      // Get agents with transaction data
      const query = `
        SELECT
          a.id,
          a.name as full_name,
          a.account_number,
          a.email,
          a.type,
          a.branch_name,
          a.created_at as start_date,
          COALESCE(t_stats.total_amount, 0) as salary,
          COALESCE(t_stats.transaction_count, 0) as age,
          CASE
            WHEN a.is_active = 1 THEN 1
            WHEN a.type = 'super_agent' THEN 2
            WHEN a.type = 'franchise' THEN 3
            ELSE 4
          END as status,
          'avatar-1.png' as avatar
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
        ORDER BY ${sortColumn} ${sortOrder}
      `

      const agents = db.prepare(query).all(...params)

      // Transform data to match expected format
      const transformedData = agents.map(agent => ({
        ...agent,
        salary: `$${agent.salary.toLocaleString()}`,
        age: agent.age,
        status: agent.status,
        avatar: agent.avatar
      }))

      res.status(200).json({
        success: true,
        data: transformedData,
        total: transformedData.length
      })
    } else {
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Table data API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch table data',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}