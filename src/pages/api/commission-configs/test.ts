import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])

    return res.status(405).json({ message: 'Method not allowed' })
  }

  const db = new Database('agent360.db')

  try {
    // Test creating a sample commission configuration
    const testConfig = {
      title: 'Test Commission Config',
      code: 'TEST_001',
      description: 'Test configuration for commission calculations',
      type: 'percentage',
      value: 5.0,
      agentType: 'all',
      status: 'active',
      minTransactionAmount: 100000,
      commissionRate: 0.05,
      paybandFee: 0,
      superAgentCommissionRate: 0.2,
      superAgentFixedRate: 0.3,
      superAgentVariableRate: 0.7,
      franchiseMultiplier: 4.5,
      kpiWeights: {
        activeness: 55,
        valueTransacted: 25,
        uniqueAgents: 20
      }
    }

    // Insert test configuration
    const insertQuery = `
      INSERT INTO commission_configs (
        title, code, description, type, value, agent_type, status,
        min_transaction_amount, commission_rate, payband_fee,
        super_agent_commission_rate, super_agent_fixed_rate, super_agent_variable_rate,
        franchise_multiplier, kpi_weights, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `

    const result = db.prepare(insertQuery).run(
      testConfig.title,
      testConfig.code,
      testConfig.description,
      testConfig.type,
      testConfig.value,
      testConfig.agentType,
      testConfig.status,
      testConfig.minTransactionAmount,
      testConfig.commissionRate,
      testConfig.paybandFee,
      testConfig.superAgentCommissionRate,
      testConfig.superAgentFixedRate,
      testConfig.superAgentVariableRate,
      testConfig.franchiseMultiplier,
      JSON.stringify(testConfig.kpiWeights),
      1 // is_active
    )

    // Retrieve the inserted configuration
    const savedConfig = db.prepare('SELECT * FROM commission_configs WHERE id = ?').get(result.lastInsertRowid)

    // Test retrieving active configuration
    const activeConfig = db
      .prepare(
        `
      SELECT * FROM commission_configs
      WHERE status = 'active'
      ORDER BY created_at DESC LIMIT 1
    `
      )
      .get()

    // Get all configurations
    const allConfigs = db.prepare('SELECT * FROM commission_configs ORDER BY created_at DESC').all()

    return res.status(200).json({
      success: true,
      message: 'Commission configuration test completed successfully',
      test: {
        inserted: savedConfig,
        active: activeConfig,
        all: allConfigs,
        databaseStats: {
          totalConfigs: allConfigs.length,
          activeConfigs: allConfigs.filter((c: any) => c.status === 'active').length
        }
      }
    })
  } catch (error) {
    console.error('Commission configuration test failed:', error)

    return res.status(500).json({
      success: false,
      message: 'Commission configuration test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
