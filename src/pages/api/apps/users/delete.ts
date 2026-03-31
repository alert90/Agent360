import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { id } = req.query

    if (!id) {
      return res.status(400).json({ message: 'User ID is required' })
    }

    const userId = parseInt(id as string)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId }
    })

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Delete user API error:', error)

    return res.status(500).json({
      message: 'Failed to delete user',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
