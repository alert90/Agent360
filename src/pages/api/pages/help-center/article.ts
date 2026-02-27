import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

const db = new Database('agent360.db')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { article, category, subcategory } = req.query

    if (!article || typeof article !== 'string') {
      return res.status(400).json({ message: 'Article parameter is required' })
    }

    if (!category || typeof category !== 'string') {
      return res.status(400).json({ message: 'Category parameter is required' })
    }

    if (!subcategory || typeof subcategory !== 'string') {
      return res.status(400).json({ message: 'Subcategory parameter is required' })
    }

    // Fetch the active article
    const articleStmt = db.prepare(`
      SELECT a.id, a.slug, a.title, a.content, a.subcategory_id
      FROM help_center_articles a
      JOIN help_center_subcategories sc ON a.subcategory_id = sc.id
      JOIN help_center_categories c ON sc.category_id = c.id
      WHERE a.slug = ? AND sc.slug = ? AND c.slug = ? AND a.is_active = 1
    `)

    const activeArticle = articleStmt.get(article, subcategory, category) as any

    if (!activeArticle) {
      return res.status(404).json({ message: 'Article not found' })
    }

    // Fetch the active subcategory
    const subcategoryStmt = db.prepare(`
      SELECT sc.id, sc.slug, sc.title, sc.icon, sc.category_id
      FROM help_center_subcategories sc
      JOIN help_center_categories c ON sc.category_id = c.id
      WHERE sc.slug = ? AND c.slug = ? AND sc.is_active = 1
    `)

    const activeSubcategory = subcategoryStmt.get(subcategory, category) as any

    // Fetch all articles in this subcategory
    const articlesStmt = db.prepare(`
      SELECT id, slug, title, order_index
      FROM help_center_articles
      WHERE subcategory_id = ? AND is_active = 1
      ORDER BY order_index
    `)

    const articles = articlesStmt.all(activeArticle.subcategory_id) as any[]

    // Fetch all categories for navigation
    const categoriesStmt = db.prepare(`
      SELECT id, slug, title, icon, avatar_color
      FROM help_center_categories
      WHERE is_active = 1
      ORDER BY order_index
    `)
    const categories = categoriesStmt.all() as any[]

    res.status(200).json({
      activeArticle: {
        id: activeArticle.id,
        slug: activeArticle.slug,
        title: activeArticle.title,
        content: activeArticle.content
      },
      activeSubcategory: {
        id: activeSubcategory.id,
        slug: activeSubcategory.slug,
        title: activeSubcategory.title,
        icon: activeSubcategory.icon
      },
      categories: categories.map(cat => ({
        id: cat.id,
        slug: cat.slug,
        title: cat.title,
        icon: cat.icon,
        avatarColor: cat.avatar_color
      })),
      articles: articles.map(article => ({
        id: article.id,
        slug: article.slug,
        title: article.title,
        orderIndex: article.order_index
      }))
    })
  } catch (error) {
    console.error('Error fetching help center article data:', error)
    res.status(500).json({ message: 'Internal server error' })
  } finally {
    db.close()
  }
}
