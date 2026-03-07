import { NextApiRequest, NextApiResponse } from 'next/types'
import { CommissionCalculationService } from '../../../services/commissionCalculationService'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const commissionService = new CommissionCalculationService()

  try {
    const { period } = req.query

    if (!period || typeof period !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Period is required (format: YYYY-MM)'
      })
    }

    const report = await commissionService.getCommissionReport(period)

    res.status(200).json({
      success: true,
      data: report
    })
  } catch (error) {
    console.error('Commission report error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commission report',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
