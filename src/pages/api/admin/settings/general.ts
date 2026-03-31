import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const settings = await prisma.generalSetting.findMany({
        orderBy: [{ category: 'asc' }, { label: 'asc' }]
      })

      // Group by category
      const groupedSettings: Record<string, any[]> = {}
      for (const setting of settings) {
        if (!groupedSettings[setting.category]) {
          groupedSettings[setting.category] = []
        }
        groupedSettings[setting.category].push({
          id: setting.id,
          settingKey: setting.settingKey,
          settingValue: setting.settingValue,
          settingType: setting.settingType,
          category: setting.category,
          label: setting.label,
          description: setting.description,
          isRequired: setting.isRequired === 1,
          validationRules: setting.validationRules
        })
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

      await prisma.generalSetting.upsert({
        where: { settingKey },
        update: {
          settingValue,
          settingType,
          category,
          label,
          description,
          isRequired: isRequired ? 1 : 0,
          validationRules,
          updatedAt: new Date()
        },
        create: {
          settingKey,
          settingValue,
          settingType,
          category,
          label,
          description,
          isRequired: isRequired ? 1 : 0,
          validationRules
        }
      })

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

      // Update each setting
      for (const setting of settings) {
        await prisma.generalSetting.update({
          where: { settingKey: setting.key },
          data: {
            settingValue: setting.value,
            updatedAt: new Date()
          }
        })
      }

      res.status(200).json({ message: 'Settings updated successfully' })
    } catch (error) {
      console.error('Error updating general settings:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}
