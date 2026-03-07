import { NextApiRequest, NextApiResponse } from 'next/types'
import { CommissionCalculationService } from '../../../services/commissionCalculationService'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const commissionService = new CommissionCalculationService()

  try {
    const { period, agentType } = req.body

    if (!period) {
      return res.status(400).json({
        success: false,
        message: 'Period is required (format: YYYY-MM)'
      })
    }

    // Validate period format
    if (!/^\d{4}-\d{2}$/.test(period)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid period format. Use YYYY-MM (e.g., 2026-01)'
      })
    }

    // Get active configuration
    const config = await commissionService.getActiveConfig()
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'No active commission configuration found. Please create one first.'
      })
    }

    // Calculate commissions
    const calculations = await commissionService.calculatePeriodCommissions(period, agentType as any)

    // Save to database
    await commissionService.saveCommissionCalculations(period, calculations)

    // Get summary
    const report = await commissionService.getCommissionReport(period)

    res.status(200).json({
      success: true,
      message: `Commission calculations completed for ${calculations.length} agents`,
      data: {
        period,
        config: {
          id: config.id,
          title: config.title,
          code: config.code
        },
        calculations,
        summary: report.summary
      }
    })
  } catch (error) {
    console.error('Commission calculation error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to calculate commissions',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
