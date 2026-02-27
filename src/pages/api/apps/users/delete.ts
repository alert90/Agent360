import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const db = new Database('agent360.db')

  try {
    const { id } = req.body

    if (!id) {
      return res.status(400).json({ message: 'User ID is required' })
    }

    // Check if user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE id = ?').get(id)

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Delete user
    const deleteResult = db.prepare('DELETE FROM users WHERE id = ?').run(id)

    if (deleteResult.changes === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.status(200).json({
      message: 'User deleted successfully',
      deletedId: id
    })
  } catch (error) {
    console.error('Delete user API error:', error)

    return res.status(500).json({
      message: 'Failed to delete user',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    db.close()
  }
}
