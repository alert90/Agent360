import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  const numId = Number(id)

  if (isNaN(numId)) return res.status(400).json({ message: 'Invalid ID' })

  if (req.method === 'GET') {
    const config = await prisma.commissionConfig.findUnique({ where: { id: numId } })
    res.json(config || null)
  } else if (req.method === 'PUT') {
    const data = req.body
    const config = await prisma.commissionConfig.update({
      where: { id: numId },
      data
    })
    res.json(config)
  } else if (req.method === 'DELETE') {
    await prisma.commissionConfig.delete({ where: { id: numId } })
    res.json({ success: true })
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}
