import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { local_agent_id, super_agent_id, franchise_id, status } = req.body

  if (!local_agent_id) {
    return res.status(400).json({ message: 'Local agent ID is required' })
  }

  if (!super_agent_id && !franchise_id) {
    return res.status(400).json({ message: 'Either super agent ID or franchise ID is required' })
  }

  const db = new Database('agent360.db')

  try {
    // Start transaction
    const transaction = db.transaction(() => {
      // Create assignment record
      const insertAssignment = db.prepare(`
        INSERT INTO agent_assignments (
          local_agent_id,
          super_agent_id,
          franchise_id,
          status,
          assigned_at,
          assigned_by
        ) VALUES (?, ?, ?, ?, datetime('now'), 'admin')
      `)

      const result = insertAssignment.run(
        local_agent_id,
        super_agent_id || null,
        franchise_id || null,
        status || 'active'
      )

      // Update agent's parent_agent_id
      const updateAgent = db.prepare(`
        UPDATE agents
        SET parent_agent_id = ?, updated_at = datetime('now')
        WHERE id = ?
      `)

      updateAgent.run(super_agent_id || franchise_id, local_agent_id)

      return result
    })

    const result = transaction()

    res.status(200).json({
      success: true,
      message: 'Agent assigned successfully',
      data: { id: result.lastInsertRowid }
    })
  } catch (error) {
    console.error('Error assigning agent:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to assign agent',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
