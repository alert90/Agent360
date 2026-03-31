import { NextApiRequest, NextApiResponse } from 'next/types'
import { CommissionCalculator } from '../../../services/commission/CommissionCalculator'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { period, agentType, background = false } = req.body

    if (!period) {
      return res.status(400).json({ error: 'Period is required (YYYY-MM)' })
    }

    const calculator = new CommissionCalculator()

    if (background) {
      // Run in background - respond immediately
      res.status(202).json({
        message: 'Calculation started in background',
        period,
        status: 'processing'
      })

      // Execute in background without awaiting
      calculator.calculateMonthly(period, agentType).catch(console.error)
    } else {
      // Run synchronously
      const { results, summary } = await calculator.calculateMonthly(period, agentType)

      res.status(200).json({
        success: true,
        period,
        summary,
        results: results.slice(0, 100) // Return first 100 for preview
      })
    }
  } catch (error) {
    console.error('Commission calculation error:', error)
    res.status(500).json({
      error: 'Failed to calculate commissions',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
