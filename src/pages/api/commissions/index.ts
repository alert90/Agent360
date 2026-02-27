import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const db = new Database('agent360.db')

  try {
    const { period } = req.query

    let query = `
      SELECT
        cc.*,
        GROUP_CONCAT(cua.user_id) as assigned_user_ids
      FROM commission_configs cc
      LEFT JOIN commission_user_assignments cua ON cc.id = cua.commission_config_id
    `

    const params: any[] = []

    if (period) {
      query += ` WHERE cc.created_at LIKE ? OR cc.updated_at LIKE ?`
      params.push(`%${period}%`, `%${period}%`)
    }

    query += ` GROUP BY cc.id ORDER BY cc.created_at DESC`

    const configs = db.prepare(query).all(...params)

    // Transform data
    const transformedConfigs = configs.map((config: any) => ({
      ...config,
      kpi_weights: config.kpi_weights ? JSON.parse(config.kpi_weights) : {},
      assigned_user_ids: config.assigned_user_ids ? config.assigned_user_ids.split(',').map(Number) : []
    }))

    return res.status(200).json({
      success: true,
      data: transformedConfigs,
      period: period || 'all'
    })
  } catch (error) {
    console.error('Failed to fetch commission configurations:', error)

    return res.status(500).json({
      message: 'Failed to fetch commission configurations',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
