import { NextApiRequest, NextApiResponse } from 'next/types'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // For now, return mock pricing data since we don't have pricing tables
    // This can be updated later to fetch from database when pricing tables are added
    const pricingPlans = [
      {
        id: 'basic',
        title: 'Basic',
        subtitle: 'Best for start-up',
        monthlyPrice: 0,
        currentPlan: false,
        popularPlan: false,
        img: '/images/pages/pricing-1.png',
        pricingPlanFeatures: [
          'Up to 10 Active Users',
          'Up to 30 Project Integrations',
          'Analytics Module',
          '24/7 Phone & Email Support',
          '3 Year Data Backup',
          '100 GB Cloud Storage',
          'Chat Support',
          'Time Tracking',
          'Custom Workspaces'
        ]
      },
      {
        id: 'standard',
        title: 'Standard',
        subtitle: 'Best for growing businesses',
        monthlyPrice: 99,
        currentPlan: false,
        popularPlan: true,
        img: '/images/pages/pricing-2.png',
        pricingPlanFeatures: [
          'Up to 50 Active Users',
          'Up to 100 Project Integrations',
          'Analytics Module',
          '24/7 Phone & Email Support',
          'Unlimited Data Backup',
          '1 TB Cloud Storage',
          'Chat Support',
          'Time Tracking',
          'Custom Workspaces',
          'Document Collaboration',
          'Advanced Reporting',
          'Priority Support'
        ]
      },
      {
        id: 'enterprise',
        title: 'Enterprise',
        subtitle: 'Best for big companies',
        monthlyPrice: 499,
        currentPlan: false,
        popularPlan: false,
        img: '/images/pages/pricing-3.png',
        pricingPlanFeatures: [
          'Unlimited Active Users',
          'Unlimited Project Integrations',
          'Analytics Module',
          '24/7 Phone & Email Support',
          'Unlimited Data Backup',
          'Unlimited Cloud Storage',
          'Chat Support',
          'Time Tracking',
          'Custom Workspaces',
          'Document Collaboration',
          'Advanced Reporting',
          'Priority Support',
          'Custom Branding',
          'API Access',
          'Advanced Security',
          'Dedicated Account Manager'
        ]
      }
    ]

    res.status(200).json({ pricingPlans })
  } catch (error) {
    console.error('Error fetching pricing data:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
