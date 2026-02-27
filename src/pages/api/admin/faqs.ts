import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

const db = new Database('agent360.db')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Get all FAQ categories with their questions
      const categoriesStmt = db.prepare(`
        SELECT
          c.id, c.slug, c.title, c.icon, c.subtitle, c.order_index, c.is_active,
          q.id as question_id, q.slug as question_slug, q.question, q.answer, q.order_index as question_order, q.is_active as question_active
        FROM faq_categories c
        LEFT JOIN faq_questions q ON c.id = q.category_id
        ORDER BY c.order_index, q.order_index
      `)

      const rows = categoriesStmt.all() as any[]

      // Process the data into the expected structure
      const categoriesMap = new Map()

      for (const row of rows) {
        if (!categoriesMap.has(row.id)) {
          categoriesMap.set(row.id, {
            id: row.id,
            slug: row.slug,
            title: row.title,
            icon: row.icon,
            subtitle: row.subtitle,
            orderIndex: row.order_index,
            isActive: row.is_active,
            questions: []
          })
        }

        const category = categoriesMap.get(row.id)

        // Add question if it exists
        if (row.question_id) {
          category.questions.push({
            id: row.question_id,
            slug: row.question_slug,
            question: row.question,
            answer: row.answer,
            orderIndex: row.question_order,
            isActive: row.question_active
          })
        }
      }

      const categories = Array.from(categoriesMap.values())

      res.status(200).json({ categories })
    } catch (error) {
      console.error('Error fetching FAQ data:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else if (req.method === 'POST') {
    try {
      const { type, data } = req.body

      if (type === 'category') {
        // Create new category
        const { slug, title, icon, subtitle, orderIndex } = data

        if (!slug || !title) {
          return res.status(400).json({ message: 'Slug and title are required' })
        }

        const insertStmt = db.prepare(`
          INSERT INTO faq_categories (slug, title, icon, subtitle, order_index, is_active)
          VALUES (?, ?, ?, ?, ?, 1)
        `)

        const result = insertStmt.run(slug, title, icon || 'tabler:help', subtitle || '', orderIndex || 0)

        res.status(201).json({
          message: 'Category created successfully',
          id: result.lastInsertRowid
        })
      } else if (type === 'question') {
        // Create new question
        const { categoryId, slug, question, answer, orderIndex } = data

        if (!categoryId || !slug || !question || !answer) {
          return res.status(400).json({ message: 'Category ID, slug, question, and answer are required' })
        }

        const insertStmt = db.prepare(`
          INSERT INTO faq_questions (category_id, slug, question, answer, order_index, is_active)
          VALUES (?, ?, ?, ?, ?, 1)
        `)

        const result = insertStmt.run(categoryId, slug, question, answer, orderIndex || 0)

        res.status(201).json({
          message: 'Question created successfully',
          id: result.lastInsertRowid
        })
      } else {
        res.status(400).json({ message: 'Invalid type specified' })
      }
    } catch (error) {
      console.error('Error creating FAQ item:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else if (req.method === 'PUT') {
    try {
      const { type, id, data } = req.body

      if (type === 'category') {
        // Update category
        const { slug, title, icon, subtitle, orderIndex, isActive } = data

        const updateStmt = db.prepare(`
          UPDATE faq_categories
          SET slug = ?, title = ?, icon = ?, subtitle = ?, order_index = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)

        updateStmt.run(slug, title, icon, subtitle, orderIndex, isActive ? 1 : 0, id)

        res.status(200).json({ message: 'Category updated successfully' })
      } else if (type === 'question') {
        // Update question
        const { categoryId, slug, question, answer, orderIndex, isActive } = data

        const updateStmt = db.prepare(`
          UPDATE faq_questions
          SET category_id = ?, slug = ?, question = ?, answer = ?, order_index = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)

        updateStmt.run(categoryId, slug, question, answer, orderIndex, isActive ? 1 : 0, id)

        res.status(200).json({ message: 'Question updated successfully' })
      } else {
        res.status(400).json({ message: 'Invalid type specified' })
      }
    } catch (error) {
      console.error('Error updating FAQ item:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else if (req.method === 'DELETE') {
    try {
      const { type, id } = req.body

      if (type === 'category') {
        // Delete category (this will cascade delete questions due to foreign key, but let's be explicit)
        const deleteQuestionsStmt = db.prepare('DELETE FROM faq_questions WHERE category_id = ?')
        deleteQuestionsStmt.run(id)

        const deleteCategoryStmt = db.prepare('DELETE FROM faq_categories WHERE id = ?')
        deleteCategoryStmt.run(id)

        res.status(200).json({ message: 'Category and its questions deleted successfully' })
      } else if (type === 'question') {
        // Delete question
        const deleteStmt = db.prepare('DELETE FROM faq_questions WHERE id = ?')
        deleteStmt.run(id)

        res.status(200).json({ message: 'Question deleted successfully' })
      } else {
        res.status(400).json({ message: 'Invalid type specified' })
      }
    } catch (error) {
      console.error('Error deleting FAQ item:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}
