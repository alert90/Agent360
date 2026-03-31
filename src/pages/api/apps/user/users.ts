import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { id } = req.query

    if (!id) {
      return res.status(400).json({ message: 'User ID is required' })
    }

    const userId = parseInt(id as string)

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        address: true,
        avatar: true
      }
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const transformedUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName || 'Unknown User',
      role: user.role || 'user',
      avatar: user.avatar || '',
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
    }

    return res.status(200).json(transformedUser)
  } catch (error) {
    console.error('User API error:', error)

    return res.status(500).json({
      message: 'Failed to fetch user',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
