import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const settings = await prisma.notificationSetting.findMany({
        where: { isActive: 1 },
        orderBy: { name: 'asc' }
      })

      const formattedSettings = settings.map(s => ({
        id: s.id,
        name: s.name,
        label: s.label,
        description: s.description,
        emailEnabled: s.emailEnabled === 1,
        smsEnabled: s.smsEnabled === 1,
        pushEnabled: s.pushEnabled === 1,
        emailTemplate: s.emailTemplate,
        smsTemplate: s.smsTemplate,
        isActive: s.isActive === 1
      }))

      res.status(200).json(formattedSettings)
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

      await prisma.notificationSetting.upsert({
        where: { name },
        update: {
          label,
          description,
          emailEnabled: emailEnabled ? 1 : 0,
          smsEnabled: smsEnabled ? 1 : 0,
          pushEnabled: pushEnabled ? 1 : 0,
          emailTemplate,
          smsTemplate,
          updatedAt: new Date()
        },
        create: {
          name,
          label,
          description,
          emailEnabled: emailEnabled ? 1 : 0,
          smsEnabled: smsEnabled ? 1 : 0,
          pushEnabled: pushEnabled ? 1 : 0,
          emailTemplate,
          smsTemplate,
          isActive: 1
        }
      })

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

      for (const setting of settings) {
        await prisma.notificationSetting.update({
          where: { name: setting.name },
          data: {
            emailEnabled: setting.emailEnabled ? 1 : 0,
            smsEnabled: setting.smsEnabled ? 1 : 0,
            pushEnabled: setting.pushEnabled ? 1 : 0,
            updatedAt: new Date()
          }
        })
      }

      res.status(200).json({ message: 'Notification settings updated successfully' })
    } catch (error) {
      console.error('Error updating notification settings:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}
