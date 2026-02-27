import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Configuration ID is required' })
  }

  const db = new Database('agent360.db')

  try {
    if (req.method === 'DELETE') {
      // Check if configuration exists
      const config = db.prepare('SELECT id FROM commission_configs WHERE id = ?').get(id)
      if (!config) {
        return res.status(404).json({ message: 'Commission configuration not found' })
      }

      // Start transaction to delete configuration and assignments
      const transaction = db.transaction(() => {
        // Delete user assignments first
        db.prepare('DELETE FROM commission_user_assignments WHERE commission_config_id = ?').run(id)

        // Delete the configuration
        db.prepare('DELETE FROM commission_configs WHERE id = ?').run(id)
      })

      transaction()

      return res.status(200).json({
        success: true,
        message: 'Commission configuration deleted successfully'
      })
    } else if (req.method === 'GET') {
      // Get single configuration
      const config = db
        .prepare(
          `
        SELECT
          cc.*,
          GROUP_CONCAT(cua.user_id) as assigned_user_ids
        FROM commission_configs cc
        LEFT JOIN commission_user_assignments cua ON cc.id = cua.commission_config_id
        WHERE cc.id = ?
        GROUP BY cc.id
      `
        )
        .get(id)

      if (!config) {
        return res.status(404).json({ message: 'Commission configuration not found' })
      }

      // Transform data
      const transformedConfig = {
        ...config,
        kpi_weights: (config as any).kpi_weights ? JSON.parse((config as any).kpi_weights) : {},
        assigned_user_ids: (config as any).assigned_user_ids
          ? (config as any).assigned_user_ids.split(',').map(Number)
          : []
      }

      return res.status(200).json({
        success: true,
        data: transformedConfig
      })
    } else if (req.method === 'PUT') {
      // Update configuration
      const {
        title,
        code,
        description,
        type = 'percentage',
        value,
        agentType = 'all',
        status = 'active',
        minTransactionAmount = 100000,
        commissionRate = 0.05,
        paybandFee = 0,
        superAgentCommissionRate = 0.2,
        superAgentFixedRate = 0.3,
        superAgentVariableRate = 0.7,
        franchiseMultiplier = 4.5,
        kpiWeights = {
          activeness: 55,
          valueTransacted: 25,
          uniqueAgents: 20
        },
        assignedUsers = []
      } = req.body

      // Validate required fields
      if (!title || !code) {
        return res.status(400).json({
          message: 'Title and code are required',
          required: ['title', 'code']
        })
      }

      // Check if another configuration with the same code exists (excluding current one)
      const existingConfig = db.prepare('SELECT id FROM commission_configs WHERE code = ? AND id != ?').get(code, id)
      if (existingConfig) {
        return res.status(409).json({
          message: 'Commission configuration with this code already exists',
          code
        })
      }

      // Start transaction
      const transaction = db.transaction(() => {
        // Update configuration
        const updateQuery = `
          UPDATE commission_configs SET
            title = ?, code = ?, description = ?, type = ?, value = ?, agent_type = ?,
            status = ?, min_transaction_amount = ?, commission_rate = ?, payband_fee = ?,
            super_agent_commission_rate = ?, super_agent_fixed_rate = ?, super_agent_variable_rate = ?,
            franchise_multiplier = ?, kpi_weights = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `

        db.prepare(updateQuery).run(
          title,
          code,
          description || null,
          type,
          value,
          agentType,
          status,
          minTransactionAmount,
          commissionRate,
          paybandFee,
          superAgentCommissionRate,
          superAgentFixedRate,
          superAgentVariableRate,
          franchiseMultiplier,
          JSON.stringify(kpiWeights),
          id
        )

        // Delete existing user assignments
        db.prepare('DELETE FROM commission_user_assignments WHERE commission_config_id = ?').run(id)

        // If specific users are assigned, create new assignments
        if (assignedUsers && assignedUsers.length > 0) {
          const assignmentQuery = `
            INSERT INTO commission_user_assignments (commission_config_id, user_id, created_at, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `

          const assignmentStmt = db.prepare(assignmentQuery)
          for (const userId of assignedUsers) {
            assignmentStmt.run(id, userId)
          }
        }
      })

      transaction()

      // Get the updated configuration
      const updatedConfig = db
        .prepare(
          `
        SELECT
          cc.*,
          GROUP_CONCAT(cua.user_id) as assigned_user_ids
        FROM commission_configs cc
        LEFT JOIN commission_user_assignments cua ON cc.id = cua.commission_config_id
        WHERE cc.id = ?
        GROUP BY cc.id
      `
        )
        .get(id)

      // Transform data
      const configWithUsers = {
        ...(updatedConfig as any),
        kpi_weights: (updatedConfig as any).kpi_weights ? JSON.parse((updatedConfig as any).kpi_weights) : {},
        assigned_user_ids: (updatedConfig as any).assigned_user_ids
          ? (updatedConfig as any).assigned_user_ids.split(',').map(Number)
          : []
      }

      return res.status(200).json({
        success: true,
        message: 'Commission configuration updated successfully',
        data: configWithUsers
      })
    } else {
      return res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Commission configuration API error:', error)

    return res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
