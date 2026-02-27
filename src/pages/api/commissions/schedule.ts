import { NextApiRequest, NextApiResponse } from 'next'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const db = new Database('agent360.db')

  try {
    const { frequency, dayOfMonth, calculationType } = req.body

    // For now, we'll store the schedule in a simple table
    // In a real implementation, you'd use a job scheduler like node-cron or agenda.js

    const scheduleData = {
      frequency,
      dayOfMonth: dayOfMonth || 1,
      calculationType: calculationType || 'all',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Check if schedule already exists
    const existing = db.prepare('SELECT id FROM commission_schedules WHERE is_active = 1').get()

    if (existing) {
      // Update existing
      db.prepare(`
        UPDATE commission_schedules
        SET frequency = ?, day_of_month = ?, calculation_type = ?, updated_at = ?
        WHERE id = ?
      `).run(frequency, dayOfMonth, calculationType, scheduleData.updatedAt, existing.id)
    } else {
      // Insert new
      db.prepare(`
        INSERT INTO commission_schedules (frequency, day_of_month, calculation_type, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(frequency, dayOfMonth, calculationType, 1, scheduleData.createdAt, scheduleData.updatedAt)
    }

    res.status(200).json({
      success: true,
      message: 'Commission calculation scheduled successfully',
      schedule: scheduleData
    })
  } catch (error) {
    console.error('Error scheduling commission calculation:', error)
    res.status(500).json({ error: 'Failed to schedule commission calculation' })
  } finally {
    db.close()
  }
}