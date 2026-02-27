import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { eventType, title, message, recipients, data } = req.body

    // Get the notification event
    const event = await prisma.notificationEvent.findFirst({
      where: { eventType, isActive: true },
      include: { recipients: true }
    })

    if (!event) {
      return res.status(404).json({ error: 'Notification event not found' })
    }

    const notifications = []

    // Send to specified recipients
    for (const recipient of recipients) {
      let userId = null
      let recipientType = 'user'

      if (typeof recipient === 'string') {
        // Role-based recipient
        if (['admin', 'analyst', 'super_agent', 'franchise', 'regional_manager'].includes(recipient)) {
          recipientType = 'role'
        } else {
          // Assume it's a user ID
          userId = parseInt(recipient)
        }
      } else {
        userId = recipient
      }

      // Create user notification
      if (userId) {
        const notification = await prisma.userNotification.create({
          data: {
            userId,
            eventId: event.id,
            title,
            message,
            actionUrl: data?.actionUrl || null,
            expiresAt: data?.expiresAt || null
          }
        })
        notifications.push(notification)
      } else if (recipientType === 'role') {
        // Get all users with this role
        const users = await prisma.user.findMany({
          where: { role: recipient, isActive: true }
        })

        for (const user of users) {
          const notification = await prisma.userNotification.create({
            data: {
              userId: user.id,
              eventId: event.id,
              title,
              message,
              actionUrl: data?.actionUrl || null,
              expiresAt: data?.expiresAt || null
            }
          })
          notifications.push(notification)
        }
      }
    }

    // Log the notification event
    await prisma.notificationLog.create({
      data: {
        eventId: event.id,
        eventType: event.eventType,
        eventName: event.eventName,
        message: `${title}: ${message}`,
        status: 'sent'
      }
    })

    res.status(200).json({
      success: true,
      message: 'Notifications sent successfully',
      count: notifications.length
    })
  } catch (error) {
    console.error('Error sending notifications:', error)
    res.status(500).json({ error: 'Failed to send notifications' })
  }
}