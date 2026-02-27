import { NextApiRequest, NextApiResponse } from 'next/types'
import { SimplifiedCommissionService } from '../../../services/simplifiedCommissionService'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { period } = req.query

  if (!period) {
    return res.status(400).json({ message: 'Period is required (e.g., "2025-01")' })
  }

  try {
    const results = SimplifiedCommissionService.getCommissionReport(period as string)

    if (results.length === 0) {
      // If no saved results, calculate on the fly
      const calculatedResults = SimplifiedCommissionService.calculateCommissionForPeriod(period as string)

      res.status(200).json({
        success: true,
        message: `Commission report for period ${period}`,
        data: calculatedResults,
        summary: {
          totalAgents: calculatedResults.length,
          totalCommission: calculatedResults.reduce((sum, r) => sum + r.commissionAmount, 0),
          localAgents: calculatedResults.filter(r => r.agentType === 'local_agent').length,
          superAgents: calculatedResults.filter(r => r.agentType === 'super_agent').length,
          franchises: calculatedResults.filter(r => r.agentType === 'franchise').length
        }
      })
    } else {
      res.status(200).json({
        success: true,
        message: `Commission report for period ${period}`,
        data: results,
        summary: {
          totalAgents: results.length,
          totalCommission: results.reduce((sum, r) => sum + r.commissionAmount, 0),
          localAgents: results.filter(r => r.agentType === 'local_agent').length,
          superAgents: results.filter(r => r.agentType === 'super_agent').length,
          franchises: results.filter(r => r.agentType === 'franchise').length
        }
      })
    }
  } catch (error) {
    console.error('Error fetching commission report:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commission report',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
