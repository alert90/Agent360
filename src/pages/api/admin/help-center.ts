import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

const db = new Database('agent360.db')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Get all help center data with full hierarchy
      const categoriesStmt = db.prepare(`
        SELECT
          c.id, c.slug, c.title, c.icon, c.avatar_color, c.order_index, c.is_active,
          s.id as subcategory_id, s.slug as subcategory_slug, s.title as subcategory_title, s.icon as subcategory_icon, s.order_index as subcategory_order, s.is_active as subcategory_active,
          a.id as article_id, a.slug as article_slug, a.title as article_title, a.content as article_content, a.order_index as article_order, a.is_active as article_active
        FROM help_center_categories c
        LEFT JOIN help_center_subcategories s ON c.id = s.category_id
        LEFT JOIN help_center_articles a ON s.id = a.subcategory_id
        WHERE c.is_active = 1
        ORDER BY c.order_index, s.order_index, a.order_index
      `)

      const rows = categoriesStmt.all() as any[]

      // Process the data into hierarchical structure
      const categoriesMap = new Map()

      for (const row of rows) {
        // Process categories
        if (!categoriesMap.has(row.id)) {
          categoriesMap.set(row.id, {
            id: row.id,
            slug: row.slug,
            title: row.title,
            icon: row.icon,
            avatarColor: row.avatar_color,
            orderIndex: row.order_index,
            isActive: row.is_active,
            subcategories: []
          })
        }

        const category = categoriesMap.get(row.id)

        // Process subcategories
        if (row.subcategory_id) {
          let subcategory = category.subcategories.find((s: any) => s.id === row.subcategory_id)
          if (!subcategory) {
            subcategory = {
              id: row.subcategory_id,
              slug: row.subcategory_slug,
              title: row.subcategory_title,
              icon: row.subcategory_icon,
              orderIndex: row.subcategory_order,
              isActive: row.subcategory_active,
              articles: []
            }
            category.subcategories.push(subcategory)
          }

          // Process articles
          if (row.article_id) {
            subcategory.articles.push({
              id: row.article_id,
              slug: row.article_slug,
              title: row.article_title,
              content: row.article_content,
              orderIndex: row.article_order,
              isActive: row.article_active
            })
          }
        }
      }

      const categories = Array.from(categoriesMap.values())

      res.status(200).json({ categories })
    } catch (error) {
      console.error('Error fetching help center data:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else if (req.method === 'POST') {
    try {
      const { type, data } = req.body

      if (type === 'category') {
        // Create new category
        const { slug, title, icon, avatarColor, orderIndex } = data

        if (!slug || !title) {
          return res.status(400).json({ message: 'Slug and title are required' })
        }

        const insertStmt = db.prepare(`
          INSERT INTO help_center_categories (slug, title, icon, avatar_color, order_index, is_active)
          VALUES (?, ?, ?, ?, ?, 1)
        `)

        const result = insertStmt.run(slug, title, icon || 'tabler:help', avatarColor || 'primary', orderIndex || 0)

        res.status(201).json({
          message: 'Category created successfully',
          id: result.lastInsertRowid
        })
      } else if (type === 'subcategory') {
        // Create new subcategory
        const { categoryId, slug, title, icon, orderIndex } = data

        if (!categoryId || !slug || !title) {
          return res.status(400).json({ message: 'Category ID, slug, and title are required' })
        }

        const insertStmt = db.prepare(`
          INSERT INTO help_center_subcategories (category_id, slug, title, icon, order_index, is_active)
          VALUES (?, ?, ?, ?, ?, 1)
        `)

        const result = insertStmt.run(categoryId, slug, title, icon || 'tabler:circle', orderIndex || 0)

        res.status(201).json({
          message: 'Subcategory created successfully',
          id: result.lastInsertRowid
        })
      } else if (type === 'article') {
        // Create new article
        const { subcategoryId, slug, title, content, orderIndex } = data

        if (!subcategoryId || !slug || !title || !content) {
          return res.status(400).json({ message: 'Subcategory ID, slug, title, and content are required' })
        }

        const insertStmt = db.prepare(`
          INSERT INTO help_center_articles (subcategory_id, slug, title, content, order_index, is_active)
          VALUES (?, ?, ?, ?, ?, 1)
        `)

        const result = insertStmt.run(subcategoryId, slug, title, content, orderIndex || 0)

        res.status(201).json({
          message: 'Article created successfully',
          id: result.lastInsertRowid
        })
      } else {
        res.status(400).json({ message: 'Invalid type specified' })
      }
    } catch (error) {
      console.error('Error creating help center item:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else if (req.method === 'PUT') {
    try {
      const { type, id, data } = req.body

      if (type === 'category') {
        // Update category
        const { slug, title, icon, avatarColor, orderIndex, isActive } = data

        const updateStmt = db.prepare(`
          UPDATE help_center_categories
          SET slug = ?, title = ?, icon = ?, avatar_color = ?, order_index = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)

        updateStmt.run(slug, title, icon, avatarColor, orderIndex, isActive ? 1 : 0, id)

        res.status(200).json({ message: 'Category updated successfully' })
      } else if (type === 'subcategory') {
        // Update subcategory
        const { categoryId, slug, title, icon, orderIndex, isActive } = data

        const updateStmt = db.prepare(`
          UPDATE help_center_subcategories
          SET category_id = ?, slug = ?, title = ?, icon = ?, order_index = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)

        updateStmt.run(categoryId, slug, title, icon, orderIndex, isActive ? 1 : 0, id)

        res.status(200).json({ message: 'Subcategory updated successfully' })
      } else if (type === 'article') {
        // Update article
        const { subcategoryId, slug, title, content, orderIndex, isActive } = data

        const updateStmt = db.prepare(`
          UPDATE help_center_articles
          SET subcategory_id = ?, slug = ?, title = ?, content = ?, order_index = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)

        updateStmt.run(subcategoryId, slug, title, content, orderIndex, isActive ? 1 : 0, id)

        res.status(200).json({ message: 'Article updated successfully' })
      } else {
        res.status(400).json({ message: 'Invalid type specified' })
      }
    } catch (error) {
      console.error('Error updating help center item:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else if (req.method === 'DELETE') {
    try {
      const { type, id } = req.body

      if (type === 'category') {
        // Delete category and all its subcategories and articles
        const deleteArticlesStmt = db.prepare(`
          DELETE FROM help_center_articles
          WHERE subcategory_id IN (
            SELECT id FROM help_center_subcategories WHERE category_id = ?
          )
        `)
        deleteArticlesStmt.run(id)

        const deleteSubcategoriesStmt = db.prepare('DELETE FROM help_center_subcategories WHERE category_id = ?')
        deleteSubcategoriesStmt.run(id)

        const deleteCategoryStmt = db.prepare('DELETE FROM help_center_categories WHERE id = ?')
        deleteCategoryStmt.run(id)

        res.status(200).json({ message: 'Category and all related content deleted successfully' })
      } else if (type === 'subcategory') {
        // Delete subcategory and all its articles
        const deleteArticlesStmt = db.prepare('DELETE FROM help_center_articles WHERE subcategory_id = ?')
        deleteArticlesStmt.run(id)

        const deleteSubcategoryStmt = db.prepare('DELETE FROM help_center_subcategories WHERE id = ?')
        deleteSubcategoryStmt.run(id)

        res.status(200).json({ message: 'Subcategory and its articles deleted successfully' })
      } else if (type === 'article') {
        // Delete article
        const deleteStmt = db.prepare('DELETE FROM help_center_articles WHERE id = ?')
        deleteStmt.run(id)

        res.status(200).json({ message: 'Article deleted successfully' })
      } else {
        res.status(400).json({ message: 'Invalid type specified' })
      }
    } catch (error) {
      console.error('Error deleting help center item:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}
