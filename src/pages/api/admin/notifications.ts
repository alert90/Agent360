import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

const db = new Database('agent360.db')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { type } = req.query

      if (type === 'events') {
        // Get all notification events with their recipients
        const eventsStmt = db.prepare(`
          SELECT
            e.id, e.event_type, e.event_name, e.description, e.is_active,
            r.id as recipient_id, r.recipient_type, r.recipient_value
          FROM notification_events e
          LEFT JOIN notification_recipients r ON e.id = r.event_id
          ORDER BY e.event_name
        `)

        const rows = eventsStmt.all() as any[]

        // Group by event
        const eventsMap = new Map()

        for (const row of rows) {
          if (!eventsMap.has(row.id)) {
            eventsMap.set(row.id, {
              id: row.id,
              eventType: row.event_type,
              eventName: row.event_name,
              description: row.description,
              isActive: row.is_active,
              recipients: []
            })
          }

          const event = eventsMap.get(row.id)

          // Add recipient if it exists
          if (row.recipient_id) {
            event.recipients.push({
              id: row.recipient_id,
              recipientType: row.recipient_type,
              recipientValue: row.recipient_value
            })
          }
        }

        const events = Array.from(eventsMap.values())

        res.status(200).json({ events })
      } else if (type === 'logs') {
        // Get notification logs
        const logsStmt = db.prepare(`
          SELECT
            l.*,
            e.event_name,
            u.username as recipient_username
          FROM notification_logs l
          LEFT JOIN notification_events e ON l.event_id = e.id
          LEFT JOIN users u ON l.recipient_id = u.id
          ORDER BY l.created_at DESC
          LIMIT 100
        `)

        const logs = logsStmt.all() as any[]

        res.status(200).json({ logs })
      } else if (type === 'user-notifications') {
        // Get user notifications for the current user (this would need user authentication)
        // For now, return empty array
        res.status(200).json({ notifications: [] })
      } else {
        res.status(400).json({ message: 'Invalid type parameter' })
      }
    } catch (error) {
      console.error('Error fetching notification data:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else if (req.method === 'POST') {
    try {
      const { type, data } = req.body

      if (type === 'event') {
        // Create new notification event
        const { eventType, eventName, description } = data

        if (!eventType || !eventName) {
          return res.status(400).json({ message: 'Event type and name are required' })
        }

        const insertStmt = db.prepare(`
          INSERT INTO notification_events (event_type, event_name, description, is_active)
          VALUES (?, ?, ?, 1)
        `)

        const result = insertStmt.run(eventType, eventName, description)

        res.status(201).json({
          message: 'Notification event created successfully',
          id: result.lastInsertRowid
        })
      } else if (type === 'recipient') {
        // Add recipient to event
        const { eventId, recipientType, recipientValue } = data

        if (!eventId || !recipientType) {
          return res.status(400).json({ message: 'Event ID and recipient type are required' })
        }

        const insertStmt = db.prepare(`
          INSERT INTO notification_recipients (event_id, recipient_type, recipient_value)
          VALUES (?, ?, ?)
        `)

        const result = insertStmt.run(eventId, recipientType, recipientValue)

        res.status(201).json({
          message: 'Recipient added successfully',
          id: result.lastInsertRowid
        })
      } else {
        res.status(400).json({ message: 'Invalid type specified' })
      }
    } catch (error) {
      console.error('Error creating notification item:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else if (req.method === 'PUT') {
    try {
      const { type, id, data } = req.body

      if (type === 'event') {
        // Update notification event
        const { eventType, eventName, description, isActive } = data

        const updateStmt = db.prepare(`
          UPDATE notification_events
          SET event_type = ?, event_name = ?, description = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)

        updateStmt.run(eventType, eventName, description, isActive ? 1 : 0, id)

        res.status(200).json({ message: 'Notification event updated successfully' })
      } else {
        res.status(400).json({ message: 'Invalid type specified' })
      }
    } catch (error) {
      console.error('Error updating notification item:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else if (req.method === 'DELETE') {
    try {
      const { type, id } = req.body

      if (type === 'event') {
        // Delete event and all its recipients
        const deleteRecipientsStmt = db.prepare('DELETE FROM notification_recipients WHERE event_id = ?')
        deleteRecipientsStmt.run(id)

        const deleteEventStmt = db.prepare('DELETE FROM notification_events WHERE id = ?')
        deleteEventStmt.run(id)

        res.status(200).json({ message: 'Notification event and recipients deleted successfully' })
      } else if (type === 'recipient') {
        // Delete recipient
        const deleteStmt = db.prepare('DELETE FROM notification_recipients WHERE id = ?')
        deleteStmt.run(id)

        res.status(200).json({ message: 'Recipient removed successfully' })
      } else {
        res.status(400).json({ message: 'Invalid type specified' })
      }
    } catch (error) {
      console.error('Error deleting notification item:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}
