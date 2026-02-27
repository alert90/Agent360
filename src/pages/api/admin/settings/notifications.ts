import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

const db = new Database('agent360.db')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Get all notification settings
      const settingsStmt = db.prepare(`
        SELECT * FROM notification_settings
        WHERE is_active = 1
        ORDER BY name
      `)
      const settings = settingsStmt.all() as any[]

      res.status(200).json(settings)
    } catch (error) {
      console.error('Error fetching notification settings:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else if (req.method === 'POST') {
    try {
      const { name, label, description, emailEnabled, smsEnabled, pushEnabled, emailTemplate, smsTemplate } = req.body

      if (!name || !label) {
        return res.status(400).json({ message: 'Missing required fields' })
      }

      const insertStmt = db.prepare(`
        INSERT OR REPLACE INTO notification_settings
        (name, label, description, email_enabled, sms_enabled, push_enabled, email_template, sms_template, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `)

      insertStmt.run(
        name,
        label,
        description,
        emailEnabled ? 1 : 0,
        smsEnabled ? 1 : 0,
        pushEnabled ? 1 : 0,
        emailTemplate,
        smsTemplate
      )

      res.status(200).json({ message: 'Notification setting updated successfully' })
    } catch (error) {
      console.error('Error updating notification setting:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else if (req.method === 'PUT') {
    try {
      const { settings } = req.body

      if (!Array.isArray(settings)) {
        return res.status(400).json({ message: 'Settings must be an array' })
      }

      const updateStmt = db.prepare(`
        UPDATE notification_settings
        SET email_enabled = ?, sms_enabled = ?, push_enabled = ?, updated_at = CURRENT_TIMESTAMP
        WHERE name = ?
      `)

      const transaction = db.transaction(() => {
        for (const setting of settings) {
          updateStmt.run(
            setting.emailEnabled ? 1 : 0,
            setting.smsEnabled ? 1 : 0,
            setting.pushEnabled ? 1 : 0,
            setting.name
          )
        }
      })

      transaction()

      res.status(200).json({ message: 'Notification settings updated successfully' })
    } catch (error) {
      console.error('Error updating notification settings:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}
