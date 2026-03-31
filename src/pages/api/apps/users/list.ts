import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { q, role, status, currentPlan, page = '1', limit = '25' } = req.query

    const offset = (Number(page) - 1) * Number(limit)

    const whereClause: any = {}

    if (q) {
      whereClause.OR = [
        { fullName: { contains: q as string, mode: 'insensitive' } },
        { email: { contains: q as string, mode: 'insensitive' } },
        { username: { contains: q as string, mode: 'insensitive' } }
      ]
    }

    if (role) {
      whereClause.role = role as string
    }

    if (status) {
      whereClause.isActive = status === 'active'
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: Number(limit),
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          role: true,
          permissions: true,
          location: true,
          zone: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          phoneNumber: true,
          address: true
        }
      }),
      prisma.user.count({ where: whereClause })
    ])

    const transformedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName || 'Unknown User',
      role: user.role || 'user',
      avatar: '',
      avatarColor: 'primary',
      currentPlan: 'basic',
      billing: 'Active',
      status: user.isActive ? 'active' : 'inactive',
      permissions: user.permissions ? JSON.parse(user.permissions) : [],
      location: user.location || '',
      zone: user.zone || '',
      phoneNumber: user.phoneNumber,
      address: user.address,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }))

    return res.status(200).json({
      users: transformedUsers,
      allData: transformedUsers,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      params: { q, role, status, currentPlan }
    })
  } catch (error) {
    console.error('Users list API error:', error)

    return res.status(500).json({
      message: 'Failed to fetch users',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
