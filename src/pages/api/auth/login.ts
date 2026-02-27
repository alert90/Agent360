import type { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'
import jwt from 'jsonwebtoken'

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const db = new Database('agent360.db')

  try {
    const { email, password } = req.body

    // Find user by email
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?')
    const user = stmt.get(email) as any

    if (!user || user.password !== password) {
      return res.status(401).json({
        error: { email: ['Email or Password is Invalid'] }
      })
    }

    // Parse user agent for device info
    const userAgent = req.headers['user-agent'] || ''
    const deviceInfo = parseUserAgent(userAgent)

    // Get IP address and convert IPv6-mapped IPv4 to regular IPv4
    const getRealIP = (ip: string) => {
      // Handle IPv6-mapped IPv4 addresses (::ffff:192.168.1.1)
      if (ip.startsWith('::ffff:')) {
        return ip.substring(7) // Remove ::ffff: prefix
      }

      return ip
    }

    const rawIP =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.headers['x-real-ip']?.toString() ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      '127.0.0.1'

    const ipAddress = getRealIP(rawIP)

    // Create/update login session
    const sessionId = `session_${user.id}_${Date.now()}`
    const deviceName = `${deviceInfo.browser} on ${deviceInfo.os}`

    // Insert or update login session
    const sessionStmt = db.prepare(`
      INSERT OR REPLACE INTO user_login_sessions
      (user_id, session_id, ip_address, user_agent, location, browser, os, device_type, device_name, is_active, last_activity, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `)

    // Real-time IP geolocation using free API service
    const getLocationFromIP = async (ip: string) => {
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
      const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout

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

            // Format location string
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
      } catch (error: any) {
        console.log('Geolocation API error:', error?.message || 'Unknown error')
      }

      // Final fallback
      return 'Unknown Location'
    }

    const location = await getLocationFromIP(ipAddress)

    sessionStmt.run(
      user.id,
      sessionId,
      ipAddress,
      userAgent,
      location,
      deviceInfo.browser,
      deviceInfo.os,
      deviceInfo.deviceType,
      deviceName,
      new Date().toISOString(),
      new Date().toISOString()
    )

    // Generate JWT token
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.NEXT_PUBLIC_JWT_SECRET!,
      { expiresIn: process.env.NEXT_PUBLIC_JWT_EXPIRATION }
    )

    // Transform field names to match frontend types and exclude password
    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      fullName: user.full_name, // Transform snake_case to camelCase
      username: user.username,
      role: user.role,
      permissions: user.permissions,
      location: user.location,
      zone: user.zone,
      phoneNumber: user.phone_number,
      address: user.address,
      zipCode: user.zip_code,
      avatar: user.avatar,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at
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
  } finally {
    db.close()
  }
}
