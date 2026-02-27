import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const db = new Database('agent360.db')

  try {
    const { data } = req.body

    if (!data) {
      return res.status(400).json({ message: 'User data is required' })
    }

    // Check if user already exists
    const existingUser = db
      .prepare(
        `
      SELECT id FROM users
      WHERE email = ? OR username = ?
    `
      )
      .get(data.email, data.username)

    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email or username already exists'
      })
    }

    // Insert new user
    const insertResult = db
      .prepare(
        `
      INSERT INTO users (
        email, username, full_name, role, company, country,
        contact, billing, current_plan, permissions,
        location, zone, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `
      )
      .run(
        data.email,
        data.username,
        data.fullName,
        data.role || 'subscriber',
        data.company,
        data.country,
        data.contact,
        data.billing,
        data.currentPlan || 'basic',
        JSON.stringify([]), // empty permissions array
        data.location || '',
        data.zone || ''
      )

    // Get the created user
    const newUser = db
      .prepare(
        `
      SELECT
        id,
        email,
        username,
        full_name as fullName,
        role,
        company,
        country,
        contact,
        billing,
        current_plan as currentPlan,
        permissions,
        location,
        zone,
        is_active as isActive,
        created_at as createdAt,
        updated_at as updatedAt
      FROM users
      WHERE id = ?
    `
      )
      .get(insertResult.lastInsertRowid) as any

    // Transform to expected format
    const transformedUser = {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      fullName: newUser.fullName,
      role: newUser.role,
      company: newUser.company,
      country: newUser.country,
      contact: newUser.contact,
      billing: newUser.billing,
      currentPlan: newUser.currentPlan,
      permissions: newUser.permissions ? JSON.parse(newUser.permissions) : [],
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
  } finally {
    db.close()
  }
}
