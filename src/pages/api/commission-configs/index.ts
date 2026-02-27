import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const db = new Database('agent360.db')

  try {
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

    // Check if code already exists
    const existingConfig = db.prepare('SELECT id FROM commission_configs WHERE code = ?').get(code)
    if (existingConfig) {
      return res.status(409).json({
        message: 'Commission configuration with this code already exists',
        code
      })
    }

    // Start transaction
    const transaction = db.transaction(() => {
      // Insert new commission configuration
      const insertQuery = `
        INSERT INTO commission_configs (
          title, code, description, type, value, agent_type, status,
          min_transaction_amount, commission_rate, payband_fee,
          super_agent_commission_rate, super_agent_fixed_rate, super_agent_variable_rate,
          franchise_multiplier, kpi_weights, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `

      const result = db.prepare(insertQuery).run(
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
        1 // is_active
      )

      const configId = result.lastInsertRowid

      // If specific users are assigned, create user assignments
      if (assignedUsers && assignedUsers.length > 0) {
        const assignmentQuery = `
          INSERT INTO commission_user_assignments (commission_config_id, user_id, created_at, updated_at)
          VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `

        const assignmentStmt = db.prepare(assignmentQuery)
        for (const userId of assignedUsers) {
          assignmentStmt.run(configId, userId)
        }
      }

      return configId
    })

    const configId = transaction()

    if (configId) {
      return res.status(201).json({
        success: true,
        message: 'Commission configuration saved successfully',
        configId
      })
    } else {
      return res.status(500).json({
        message: 'Failed to save commission configuration'
      })
    }
  } catch (error) {
    console.error('Failed to save commission configuration:', error)

    return res.status(500).json({
      message: 'Failed to save commission configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
