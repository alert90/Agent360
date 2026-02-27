import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id) {
    return res.status(400).json({ message: 'Assignment ID is required' })
  }

  const db = new Database('agent360.db')

  try {
    // Start transaction
    const transaction = db.transaction(() => {
      // Get the assignment to find the local agent
      const assignment = db
        .prepare(
          `
        SELECT local_agent_id FROM agent_assignments WHERE id = ?
      `
        )
        .get(id as string)

      if (!assignment) {
        throw new Error('Assignment not found')
      }

      // Update assignment status to inactive
      const updateAssignment = db.prepare(`
        UPDATE agent_assignments
        SET status = 'inactive', updated_at = datetime('now')
        WHERE id = ?
      `)

      updateAssignment.run(id)

      // Remove parent_agent_id from the agent
      const updateAgent = db.prepare(`
        UPDATE agents
        SET parent_agent_id = NULL, updated_at = datetime('now')
        WHERE id = ?
      `)

      updateAgent.run((assignment as any).local_agent_id)

      return assignment
    })

    const result = transaction()

    res.status(200).json({
      success: true,
      message: 'Agent unassigned successfully',
      data: result
    })
  } catch (error) {
    console.error('Error unassigning agent:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to unassign agent',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
