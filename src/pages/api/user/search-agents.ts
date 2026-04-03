// pages/api/user/search-agents.ts
import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { search = '' } = req.query

  if (!search || (search as string).length < 2) {
    return res.status(200).json([])
  }

  const agents = await prisma.agent.findMany({
    where: {
      isActive: 1,
      OR: [
        { name: { contains: search as string, mode: 'insensitive' } },
        { accountNumber: { contains: search as string, mode: 'insensitive' } },
        { branchName: { contains: search as string, mode: 'insensitive' } }
      ]
    },
    take: 20,
    select: {
      id: true,
      accountNumber: true,
      name: true,
      branchName: true,
      type: true,
      isActive: true
    }
  })

  res.status(200).json(agents)
}
