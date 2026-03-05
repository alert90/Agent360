import type { NextApiRequest, NextApiResponse } from 'next/types'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

// Create Prisma client with PostgreSQL adapter
const createPrismaClient = () => {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  const pool = new pg.Pool({ connectionString: databaseUrl })
  const adapter = new PrismaPg(pool)

  return new PrismaClient({ adapter })
}

const prisma = createPrismaClient()

// Helper function to parse user agent
function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase()

  // Browser detection
  let browser = 'Unknown'
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome'
  else if (ua.includes('firefox')) browser = 'Firefox'
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari'
  else if (ua.includes('edg')) browser = 'Edge'

  // OS detection
  let os = 'Unknown'
  if (ua.includes('windows')) os = 'Windows'
  else if (ua.includes('macintosh') || ua.includes('mac os x')) os = 'macOS'
  else if (ua.includes('linux')) os = 'Linux'
  else if (ua.includes('android')) os = 'Android'
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS'

  // Device type detection
  let deviceType = 'Desktop'
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    deviceType = 'Mobile'
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'Tablet'
  }

  return { browser, os, deviceType }
}

// Helper to get real IP address
function getRealIP(ip: string): string {
  // Handle IPv6-mapped IPv4 addresses (::ffff:192.168.1.1)
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7)
  }

  return ip
}

// Helper to get location from IP
async function getLocationFromIP(ip: string): Promise<string> {
  // Handle localhost/private IPs without API call
  const parts = ip.split('.')
  if (parts.length === 4) {
    const [a, b] = parts.map(Number)
    if (a === 127 || a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) {
      return 'Local Network'
    }
  }

  // Create AbortController for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 3000)

  try {
    // Use ip-api.com free service (no API key required)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,regionName&lang=en`, {
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      if (data.status === 'success') {
        const city = data.city || ''
        const region = data.regionName || ''
        const country = data.country || ''

        if (city && country) {
          return `${city}, ${country}`
        } else if (region && country) {
          return `${region}, ${country}`
        } else if (country) {
          return country
        }
      }
    }

    // Fallback to alternative service if first fails
    const backupController = new AbortController()
    const backupTimeoutId = setTimeout(() => backupController.abort(), 3000)

    const backupResponse = await fetch(`http://ipapi.co/${ip}/json/`, {
      signal: backupController.signal
    })

    clearTimeout(backupTimeoutId)

    if (backupResponse.ok) {
      const backupData = await backupResponse.json()
      if (!backupData.error) {
        const city = backupData.city || ''
        const region = backupData.region || ''
        const country = backupData.country_name || ''

        if (city && country) {
          return `${city}, ${country}`
        } else if (region && country) {
          return `${region}, ${country}`
        } else if (country) {
          return country
        }
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.log('Geolocation API error:', errorMessage)
  }

  return 'Unknown Location'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: { email: ['Email and password are required'] }
      })
    }

    // Find user by email using Prisma
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(401).json({
        error: { email: ['Email or Password is Invalid'] }
      })
    }

    // Verify password using bcrypt
    const isPasswordValid = password.trim() === user.password.trim()

    if (!isPasswordValid) {
      console.log('Password mismatch')

      return res.status(401).json({
        error: { email: ['Email or Password is Invalid'] }
      })
    }

    // Parse user agent for device info
    const userAgent = req.headers['user-agent'] || ''
    const deviceInfo = parseUserAgent(userAgent)

    // Get IP address
    const rawIP =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.headers['x-real-ip']?.toString() ||
      req.socket.remoteAddress ||
      '127.0.0.1'

    const ipAddress = getRealIP(rawIP)

    // Create session ID
    const sessionId = `session_${user.id}_${Date.now()}`
    const deviceName = `${deviceInfo.browser} on ${deviceInfo.os}`

    // Get location from IP
    const location = await getLocationFromIP(ipAddress)

    // Store login session in PostgreSQL using Prisma
    await prisma.user_login_sessions.create({
      data: {
        user_id: user.id,
        session_id: sessionId,
        ip_address: ipAddress,
        user_agent: userAgent,
        location,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        device_type: deviceInfo.deviceType,
        device_name: deviceName,
        is_active: 1,
        last_activity: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    })

    // Generate JWT token
    const jwtSecret = process.env.NEXT_PUBLIC_JWT_SECRET || process.env.JWT_SECRET
    const jwtExpiration = process.env.NEXT_PUBLIC_JWT_EXPIRATION || '24h'

    if (!jwtSecret) {
      console.error('JWT Secret is missing. Environment variables:', {
        NEXT_PUBLIC_JWT_SECRET: process.env.NEXT_PUBLIC_JWT_SECRET ? 'set' : 'not set',
        JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'not set'
      })
      throw new Error('JWT_SECRET is not configured. Please set NEXT_PUBLIC_JWT_SECRET in your .env file')
    }

    console.log('JWT Secret found, length:', jwtSecret.length)

    const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, jwtSecret, {
      expiresIn: jwtExpiration
    })

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
      accessToken,
      userData: userWithoutPassword
    })
  } catch (error) {
    console.error('Login error:', error)

    return res.status(500).json({
      error: { email: ['Something went wrong'] }
    })
  }
}
