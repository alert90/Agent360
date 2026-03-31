import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../lib/db'

// Assume userId from auth middleware or header
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = (req as any).userId // From middleware

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    const { read, limit = 10, page = 1 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const where: any = { userId }

    if (read === 'false') where.isRead = 0
    else if (read === 'true') where.isRead = 1

    const [notifications, total] = await Promise.all([
      prisma.userNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip,
        select: { id: true, title: true, message: true, isRead: true, actionUrl: true, createdAt: true }
      }),
      prisma.userNotification.count({ where })
    ])

    res.json({
      notifications,
      total,
      page: Number(page),
      limit: Number(limit),
      hasMore: skip + notifications.length < total
    })
  } else if (req.method === 'PATCH') {
    const { ids } = req.body

    if (!Array.isArray(ids)) {
      return res.status(400).json({ message: 'IDs array required' })
    }

    await prisma.userNotification.updateMany({
      where: { id: { in: ids }, userId },
      data: { isRead: 1 }
    })

    res.json({ success: true, updated: ids.length })
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}
