import type { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from 'src/lib/prisma'
import jwt from 'jsonwebtoken'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ message: 'Token is required' })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET!) as { id: number }

    // Get user by ID
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Transform field names to match frontend types and exclude password
    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      username: user.username,
      role: user.role,
      permissions: user.permissions ? JSON.parse(user.permissions) : [],
      location: user.location,
      zone: user.zone,
      phoneNumber: user.phoneNumber,
      address: user.address,
      zipCode: user.zipCode,
      avatar: user.avatar,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }

    return res.status(200).json({
      userData: userWithoutPassword
    })
  } catch (error) {
    console.error('Token verification error:', error)

    return res.status(401).json({ message: 'Invalid token' })
  }
}
