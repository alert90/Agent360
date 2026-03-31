import type { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔧 Test DB endpoint called')

  try {
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connected')

    // Get user count
    const userCount = await prisma.user.count()
    console.log('📊 User count:', userCount)

    await prisma.$disconnect()

    return res.status(200).json({
      success: true,
      message: 'Database connection successful',
      userCount
    })
  } catch (error) {
    console.error('❌ Test endpoint error:', error)

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}
