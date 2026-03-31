// src/pages/api/users/count-by-role.ts
import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true
      }
    })

    const counts: Record<string, number> = {}
    usersByRole.forEach(item => {
      if (item.role) {
        counts[item.role] = item._count.id
      }
    })

    res.status(200).json(counts)
  } catch (error) {
    console.error('Error fetching user counts:', error)
    res.status(500).json({ message: 'Failed to fetch user counts' })
  }
}
