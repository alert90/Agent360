import { NextApiRequest, NextApiResponse } from 'next/types'
import jwt from 'jsonwebtoken'
import { prisma } from '../../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Get the authenticated user from JWT token
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET!) as {
      id: number
      email: string
      role: string
    }

    const { fullName, username, location, zone } = req.body

    // Validate input
    if (!fullName || !username) {
      return res.status(400).json({ message: 'Full name and username are required' })
    }

    // Check if username is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        username,
        id: { not: decoded.id }
      }
    })

    if (existingUser) {
      return res.status(400).json({ message: 'Username is already taken' })
    }

    // Update user profile
    await prisma.user.update({
      where: { id: decoded.id },
      data: {
        fullName,
        username,
        location: location ?? null,
        zone: zone ?? null,
        updatedAt: new Date()
      }
    })

    // Also update agent data if user is an agent
    if (decoded.role === 'agent' || decoded.role === 'super_agent' || decoded.role === 'franchise') {
      await prisma.agent.updateMany({
        where: {
          OR: [{ name: fullName }, { accountNumber: username }]
        },
        data: {
          name: fullName,
          zone: zone ?? null,
          updatedAt: new Date()
        }
      })
    }

    // Get updated user data
    const updatedUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        username: true,
        role: true,
        permissions: true,
        location: true,
        zone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Remove sensitive data (though permissions might be needed, but following original)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { permissions: _permissions, ...userResponse } = updatedUser

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: userResponse
    })
  } catch (error) {
    console.error('Profile update error:', error)

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token' })
    }

    return res.status(500).json({ message: 'Internal server error' })
  }
}
