import type { NextApiRequest, NextApiResponse } from 'next/types'
import jwt from 'jsonwebtoken'
import { prisma } from '../../../lib/db'
import bcrypt from 'bcryptjs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🔐 Login API called')

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { email, password } = req.body
    console.log('📧 Login attempt for:', email)

    if (!email || !password) {
      return res.status(400).json({ error: { email: ['Email and password are required'] } })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.log('❌ User not found:', email)

      return res.status(401).json({ error: { email: ['Email or Password is Invalid'] } })
    }

    console.log('✅ User found, verifying password...')

    // Verify password
    let isPasswordValid = false
    try {
      isPasswordValid = await bcrypt.compare(password, user.password)
      console.log('🔐 Password valid:', isPasswordValid)
    } catch (bcryptError) {
      console.error('❌ Bcrypt error:', bcryptError)
    }

    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', email)

      return res.status(401).json({ error: { email: ['Email or Password is Invalid'] } })
    }

    console.log('✅ Login successful for:', email)

    // Generate JWT token
    const jwtSecret = process.env.NEXT_PUBLIC_JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured')
    }

    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username
      },
      jwtSecret,
      { expiresIn: '24h' }
    )

    // Return user data without password - use _ to ignore the password variable
    const { password: _, ...userWithoutPassword } = user

    return res.status(200).json({
      accessToken,
      userData: userWithoutPassword,
      agentData: null
    })
  } catch (error) {
    console.error('❌ Login error:', error)

    return res.status(500).json({
      error: { email: ['Something went wrong'] },
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
