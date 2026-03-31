import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../../lib/db'
import bcrypt from 'bcryptjs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { data } = req.body

    if (!data) {
      return res.status(400).json({ message: 'User data is required' })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }]
      }
    })

    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email or username already exists'
      })
    }

    // Hash password with bcrypt (same as login)
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash('default123', salt)

    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        fullName: data.fullName,
        role: data.role || 'subscriber',
        permissions: JSON.stringify([]),
        location: data.location || '',
        zone: data.zone || '',
        isActive: true,
        phoneNumber: data.contact,
        address: data.company || data.address
      }
    })

    const transformedUser = {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      fullName: newUser.fullName,
      role: newUser.role,
      company: data.company,
      country: data.country,
      contact: data.contact,
      billing: data.billing,
      currentPlan: data.currentPlan || 'basic',
      permissions: [],
      location: newUser.location,
      zone: newUser.zone,
      status: newUser.isActive ? 'active' : 'inactive',
      avatar: '',
      avatarColor: 'primary',
      joinDate: newUser.createdAt,
      lastLogin: null,
      parentId: null,
      kpiScore: null,
      performanceRating: null
    }

    return res.status(201).json(transformedUser)
  } catch (error) {
    console.error('Add user API error:', error)

    return res.status(500).json({
      message: 'Failed to add user',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
