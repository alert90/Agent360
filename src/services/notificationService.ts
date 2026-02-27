import Database from 'better-sqlite3'

export interface NotificationData {
  eventType: string
  eventName?: string
  message: string
  recipientType?: 'user' | 'role' | 'email'
  recipientValue?: string | number
  actionUrl?: string
  expiresAt?: string
  metadata?: Record<string, any>
}

export class NotificationService {
  private db: Database.Database

  constructor(dbPath: string = 'agent360.db') {
    this.db = new Database(dbPath)
  }

  /**
   * Create a notification event and send to recipients
   */
  async createNotification(data: NotificationData): Promise<void> {
    try {
      // Get the notification event
      const event = this.db.prepare(
        'SELECT id, event_name FROM notification_events WHERE event_type = ? AND is_active = 1'
      ).get(data.eventType) as any

      if (!event) {
        console.warn(`Notification event type '${data.eventType}' not found or inactive`)
        return
      }

      // Get recipients for this event
      const recipients = this.db.prepare(
        'SELECT * FROM notification_recipients WHERE event_id = ?'
      ).all(event.id) as any[]

      if (recipients.length === 0) {
        console.warn(`No recipients configured for event '${data.eventType}'`)
        return
      }

      // Create notification logs for each recipient
      const insertLogStmt = this.db.prepare(`
        INSERT INTO notification_logs (
          event_id, event_type, event_name, message, recipient_type, recipient_value,
          status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
      `)

      const insertUserNotificationStmt = this.db.prepare(`
        INSERT INTO user_notifications (
          user_id, event_id, title, message, action_url, expires_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `)

      for (const recipient of recipients) {
        // Log the notification
        insertLogStmt.run(
          event.id,
          data.eventType,
          event.event_name,
          data.message,
          recipient.recipient_type,
          recipient.recipient_value
        )

        // If recipient is a user role, create user notifications
        if (recipient.recipient_type === 'role') {
          const users = this.db.prepare(
            'SELECT id FROM users WHERE role = ? AND isActive = 1'
          ).all(recipient.recipient_value) as any[]

          for (const user of users) {
            insertUserNotificationStmt.run(
              user.id,
              event.id,
              event.event_name,
              data.message,
              data.actionUrl,
              data.expiresAt
            )
          }
        } else if (recipient.recipient_type === 'user') {
          insertUserNotificationStmt.run(
            recipient.recipient_value,
            event.id,
            event.event_name,
            data.message,
            data.actionUrl,
            data.expiresAt
          )
        }
      }

      console.log(`Notification created for event: ${data.eventType}`)
    } catch (error) {
      console.error('Error creating notification:', error)
    }
  }

  /**
   * Create agent-related notifications
   */
  async createAgentNotification(
    eventType: string,
    agentId: number,
    agentName: string,
    action: string,
    details?: Record<string, any>
  ): Promise<void> {
    let message = ''

    switch (eventType) {
      case 'agent_registration':
        message = `New agent registered: ${agentName} (${agentId})`
        break
      case 'agent_status_change':
        message = `Agent status changed: ${agentName} - ${action}`
        break
      case 'agent_type_change':
        message = `Agent type changed: ${agentName} changed to ${action}`
        break
      case 'agent_assignment':
        message = `Agent assigned: ${agentName} assigned to ${action}`
        break
      case 'agent_profile_update':
        message = `Agent profile updated: ${agentName} - ${action}`
        break
      case 'agent_suspension':
        message = `Agent suspended: ${agentName} - Reason: ${action}`
        break
      case 'agent_activation':
        message = `Agent activated: ${agentName}`
        break
      default:
        message = `Agent notification: ${agentName} - ${action}`
    }

    await this.createNotification({
      eventType,
      message,
      actionUrl: `/agents/view/${agentId}`,
      metadata: {
        agentId,
        agentName,
        action,
        ...details
      }
    })
  }

  /**
   * Mark user notification as read
   */
  markAsRead(notificationId: number): void {
    try {
      this.db.prepare(
        'UPDATE user_notifications SET is_read = 1 WHERE id = ?'
      ).run(notificationId)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  /**
   * Get unread notifications for a user
   */
  getUnreadNotifications(userId: number): any[] {
    try {
      return this.db.prepare(`
        SELECT un.*, ne.event_name
        FROM user_notifications un
        JOIN notification_events ne ON un.event_id = ne.id
        WHERE un.user_id = ? AND un.is_read = 0
        ORDER BY un.created_at DESC
        LIMIT 50
      `).all(userId) as any[]
    } catch (error) {
      console.error('Error getting unread notifications:', error)
      return []
    }
  }

  /**
   * Clean up old notifications
   */
  cleanupOldNotifications(daysOld: number = 30): void {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      this.db.prepare(`
        DELETE FROM notification_logs
        WHERE created_at < ?
      `).run(cutoffDate.toISOString())

      this.db.prepare(`
        DELETE FROM user_notifications
        WHERE created_at < ? AND is_read = 1
      `).run(cutoffDate.toISOString())

      console.log(`Cleaned up notifications older than ${daysOld} days`)
    } catch (error) {
      console.error('Error cleaning up old notifications:', error)
    }
  }

  close(): void {
    this.db.close()
  }
}

// Export singleton instance
export const notificationService = new NotificationService()