import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const configs = await prisma.commissionConfig.findMany({ orderBy: { createdAt: 'desc' } })
    res.json(configs)
  } else if (req.method === 'POST') {
    const data = req.body
    const config = await prisma.commissionConfig.create({ data })
    res.status(201).json(config)
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}
