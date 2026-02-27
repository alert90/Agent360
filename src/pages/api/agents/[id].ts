import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id) {
    return res.status(400).json({ message: 'Agent ID is required' })
  }

  const db = new Database('agent360.db')

  try {
    if (req.method === 'GET') {
      const agent = db
        .prepare(
          `
        SELECT
        id,
        name,
        account_number,
        type,
        is_active,
        parent_agent_id,
        email,
        phone,
        contact as address,
        branch_code,
        branch_name,
        region,
        zone,
        created_at,
        updated_at
      FROM agents
      WHERE id = ?
    `
        )
        .get(id as string)

      if (!agent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found'
        })
      }

      res.status(200).json({
        success: true,
        data: agent
      })
    } else if (req.method === 'PUT') {
      const { name, account_number, type, is_active, email, phone, contact, branch_code, branch_name, region, zone } =
        req.body

      console.log('Agent update request:', { id, name, account_number, type, is_active })

      // Validate required fields
      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Agent name is required and cannot be empty'
        })
      }

      if (!account_number || account_number.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Account number is required and cannot be empty'
        })
      }

      // Validate type if provided
      if (type && type.trim() !== '' && !['local_agent', 'super_agent', 'franchise'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid agent type: "${type}". Must be local_agent, super_agent, or franchise`
        })
      }

      // Check if agent exists
      const existingAgent = db.prepare('SELECT id FROM agents WHERE id = ?').get(id as string)
      if (!existingAgent) {
        return res.status(404).json({
          success: false,
          message: 'Agent not found'
        })
      }

      // Update agent
      const updateStmt = db.prepare(`
        UPDATE agents SET
          name = ?,
          account_number = ?,
          type = ?,
          is_active = ?,
          email = ?,
          phone = ?,
          contact = ?,
          branch_code = ?,
          branch_name = ?,
          region = ?,
          zone = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)

      const result = updateStmt.run(
        name,
        account_number,
        type,
        is_active ? 1 : 0,
        email || null,
        phone || null,
        contact || null,
        branch_code || null,
        branch_name || null,
        region || null,
        zone || null,
        id as string
      )

      if (result.changes > 0) {
        // Auto-populate branch data if missing
        if (!branch_code || !branch_name) {
          const branchDataStmt = db
            .prepare(
              `
            SELECT branch_code, location as branch_name
            FROM transactions
            WHERE agent_id = ?
            ORDER BY created_at DESC
            LIMIT 1
          `
            )
            .get(id as string) as any

          if (branchDataStmt && (branchDataStmt.branch_code || branchDataStmt.branch_name)) {
            const updateBranchStmt = db.prepare(`
              UPDATE agents SET
                branch_code = COALESCE(branch_code, ?),
                branch_name = COALESCE(branch_name, ?),
                updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `)
            updateBranchStmt.run(branchDataStmt.branch_code, branchDataStmt.branch_name, id as string)
            console.log(`Auto-populated branch data for agent ${id}`)
          }
        }

        res.status(200).json({
          success: true,
          message: 'Agent updated successfully',
          data: {
            id: id as string,
            name,
            account_number,
            type,
            is_active,
            email,
            phone,
            contact,
            branch_code,
            branch_name,
            region,
            zone
          }
        })
      } else {
        res.status(400).json({
          success: false,
          message: 'No changes made to agent'
        })
      }
    }
  } catch (error) {
    console.error('Error in agent API:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
