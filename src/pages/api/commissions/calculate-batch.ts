import { NextApiRequest, NextApiResponse } from 'next/types'
import { CommissionTemplateService, CalculationProgress } from 'src/services/commissionTemplateService'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const commissionService = new CommissionTemplateService()

  try {
    const { period, calculationType, agentIds } = req.body

    if (!period) {
      return res.status(400).json({
        success: false,
        message: 'Period is required (format: YYYY-MM)'
      })
    }

    if (!calculationType || !['super_agent', 'franchise', 'all'].includes(calculationType)) {
      return res.status(400).json({
        success: false,
        message: 'Calculation type must be: super_agent, franchise, or all'
      })
    }

    // Get active template
    const template = commissionService.getActiveTemplate()
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'No active commission configuration found'
      })
    }

    // Calculate commissions with progress tracking
    const calculations = await commissionService.calculateBatchCommissions(
      period,
      calculationType,
      agentIds || [],
      (progress: CalculationProgress) => {
        console.log(`Progress: ${progress.percentage.toFixed(1)}% - ${progress.stage} - ${progress.currentAgent}`)
      }
    )

    // Get summary statistics
    const summary = {
      totalCalculations: calculations.length,
      totalCommission: calculations.reduce((sum, calc) => sum + calc.commissionAmount, 0),
      avgCommission:
        calculations.length > 0
          ? calculations.reduce((sum, calc) => sum + calc.commissionAmount, 0) / calculations.length
          : 0,
      maxCommission: calculations.length > 0 ? Math.max(...calculations.map(calc => calc.commissionAmount)) : 0,
      minCommission: calculations.length > 0 ? Math.min(...calculations.map(calc => calc.commissionAmount)) : 0,
      totalTransactions: calculations.reduce((sum, calc) => sum + calc.transactionCount, 0),
      totalAmount: calculations.reduce((sum, calc) => sum + calc.totalAmount, 0)
    }

    res.status(200).json({
      success: true,
      message: `Calculated commissions for ${calculations.length} agents using template: ${template.title}`,
      data: {
        period,
        template: {
          id: template.id,
          title: template.title,
          code: template.code,
          description: template.description
        },
        calculations: calculations.map(calc => ({
          agent: calc.agent,
          period: calc.period,
          transactionCount: calc.transactionCount,
          totalAmount: calc.totalAmount,
          commissionAmount: calc.commissionAmount,
          calculationDetails: calc.calculationDetails
        })),
        summary
      }
    })
  } catch (error) {
    console.error('Batch commission calculation API error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to calculate commissions',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    commissionService.close()
  }
}
