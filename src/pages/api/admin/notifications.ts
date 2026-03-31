import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { type } = req.query

      if (type === 'events') {
        const events = await prisma.notificationEvent.findMany({
          where: { isActive: 1 },
          orderBy: { eventName: 'asc' },
          include: {
            recipients: true
          }
        })

        const formattedEvents = events.map(e => ({
          id: e.id,
          eventType: e.eventType,
          eventName: e.eventName,
          description: e.description,
          isActive: e.isActive === 1,
          recipients: e.recipients.map(r => ({
            id: r.id,
            recipientType: r.recipientType,
            recipientValue: r.recipientValue
          }))
        }))

        res.status(200).json({ events: formattedEvents })
      } else if (type === 'logs') {
        const logs = await prisma.notificationLog.findMany({
          take: 100,
          orderBy: { createdAt: 'desc' },
          include: {
            event: {
              select: {
                eventName: true
              }
            }
          }
        })

        const formattedLogs = logs.map(l => ({
          id: l.id,
          eventType: l.eventType,
          eventName: l.event?.eventName,
          message: l.message,
          recipientId: l.recipientId,
          recipientType: l.recipientType,
          status: l.status,
          sentAt: l.sentAt,
          createdAt: l.createdAt
        }))

        res.status(200).json({ logs: formattedLogs })
      } else if (type === 'user-notifications') {
        // For user notifications, you'd need the user ID from auth
        // Return empty for now
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
        const { eventType, eventName, description } = data

        if (!eventType || !eventName) {
          return res.status(400).json({ message: 'Event type and name are required' })
        }

        const event = await prisma.notificationEvent.create({
          data: {
            eventType,
            eventName,
            description,
            isActive: 1
          }
        })

        res.status(201).json({
          message: 'Notification event created successfully',
          id: event.id
        })
      } else if (type === 'recipient') {
        const { eventId, recipientType, recipientValue } = data

        if (!eventId || !recipientType) {
          return res.status(400).json({ message: 'Event ID and recipient type are required' })
        }

        const recipient = await prisma.notificationRecipient.create({
          data: {
            eventId,
            recipientType,
            recipientValue
          }
        })

        res.status(201).json({
          message: 'Recipient added successfully',
          id: recipient.id
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
        const { eventType, eventName, description, isActive } = data

        await prisma.notificationEvent.update({
          where: { id },
          data: {
            eventType,
            eventName,
            description,
            isActive: isActive ? 1 : 0,
            updatedAt: new Date()
          }
        })

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
        await prisma.notificationRecipient.deleteMany({
          where: { eventId: id }
        })
        await prisma.notificationEvent.delete({
          where: { id }
        })
        res.status(200).json({ message: 'Notification event and recipients deleted successfully' })
      } else if (type === 'recipient') {
        await prisma.notificationRecipient.delete({
          where: { id }
        })
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
