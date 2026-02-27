import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

const db = new Database('agent360.db')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Get all general settings grouped by category
      const settingsStmt = db.prepare(`
        SELECT * FROM general_settings
        ORDER BY category, label
      `)
      const settings = settingsStmt.all() as any[]

      // Group by category
      const groupedSettings: Record<string, any[]> = {}
      for (const setting of settings) {
        if (!groupedSettings[setting.category]) {
          groupedSettings[setting.category] = []
        }
        groupedSettings[setting.category].push(setting)
      }

      res.status(200).json(groupedSettings)
    } catch (error) {
      console.error('Error fetching general settings:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else if (req.method === 'POST') {
    try {
      const { settingKey, settingValue, settingType, category, label, description, isRequired, validationRules } =
        req.body

      if (!settingKey || !settingType || !category || !label) {
        return res.status(400).json({ message: 'Missing required fields' })
      }

      const insertStmt = db.prepare(`
        INSERT OR REPLACE INTO general_settings
        (setting_key, setting_value, setting_type, category, label, description, is_required, validation_rules, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `)

      insertStmt.run(
        settingKey,
        settingValue,
        settingType,
        category,
        label,
        description,
        isRequired ? 1 : 0,
        validationRules
      )

      res.status(200).json({ message: 'Setting updated successfully' })
    } catch (error) {
      console.error('Error updating general setting:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else if (req.method === 'PUT') {
    try {
      const { settings } = req.body

      if (!Array.isArray(settings)) {
        return res.status(400).json({ message: 'Settings must be an array' })
      }

      const updateStmt = db.prepare(`
        UPDATE general_settings
        SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = ?
      `)

      const transaction = db.transaction(() => {
        for (const setting of settings) {
          updateStmt.run(setting.value, setting.key)
        }
      })

      transaction()

      res.status(200).json({ message: 'Settings updated successfully' })
    } catch (error) {
      console.error('Error updating general settings:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}
