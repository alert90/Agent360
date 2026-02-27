import { NextApiRequest, NextApiResponse } from 'next/types'
import { SimplifiedCommissionService } from '../../../services/simplifiedCommissionService'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { period } = req.body

  if (!period) {
    return res.status(400).json({ message: 'Period is required (e.g., "2025-01")' })
  }

  try {
    // Calculate and save commission for the period
    const success = SimplifiedCommissionService.saveCommissionCalculations(period)

    if (success) {
      // Get the calculated results
      const results = SimplifiedCommissionService.calculateCommissionForPeriod(period)

      res.status(200).json({
        success: true,
        message: `Commission calculated successfully for period ${period}`,
        data: results,
        summary: {
          totalAgents: results.length,
          totalCommission: results.reduce((sum, r) => sum + r.commissionAmount, 0),
          localAgents: results.filter(r => r.agentType === 'local_agent').length,
          superAgents: results.filter(r => r.agentType === 'super_agent').length,
          franchises: results.filter(r => r.agentType === 'franchise').length
        }
      })
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to calculate commission'
      })
    }
  } catch (error) {
    console.error('Error calculating commission:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to calculate commission',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
