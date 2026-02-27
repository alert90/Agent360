import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

const db = new Database('agent360.db')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Fetch categories with subcategories and articles
    const categoriesStmt = db.prepare(`
      SELECT
        c.id, c.slug, c.title, c.icon, c.avatar_color, c.order_index,
        sc.id as subcategory_id, sc.slug as subcategory_slug, sc.title as subcategory_title,
        sc.icon as subcategory_icon, sc.order_index as subcategory_order_index,
        a.id as article_id, a.slug as article_slug, a.title as article_title, a.order_index as article_order_index
      FROM help_center_categories c
      LEFT JOIN help_center_subcategories sc ON c.id = sc.category_id AND sc.is_active = 1
      LEFT JOIN help_center_articles a ON sc.id = a.subcategory_id AND a.is_active = 1
      WHERE c.is_active = 1
      ORDER BY c.order_index, sc.order_index, a.order_index
    `)

    const rows = categoriesStmt.all() as any[]

    // Process the data into the expected structure
    const categoriesMap = new Map()
    const allArticles: any[] = []

    for (const row of rows) {
      if (!categoriesMap.has(row.id)) {
        categoriesMap.set(row.id, {
          id: row.id,
          slug: row.slug,
          title: row.title,
          icon: row.icon,
          avatarColor: row.avatar_color,
          subCategories: []
        })
      }

      const category = categoriesMap.get(row.id)

      // Add subcategory if it doesn't exist
      let subcategory = category.subCategories.find((sc: any) => sc.id === row.subcategory_id)
      if (!subcategory && row.subcategory_id) {
        subcategory = {
          id: row.subcategory_id,
          slug: row.subcategory_slug,
          title: row.subcategory_title,
          icon: row.subcategory_icon,
          articles: []
        }
        category.subCategories.push(subcategory)
      }

      // Add article if it exists
      if (row.article_id && subcategory) {
        const article = {
          id: row.article_id,
          slug: row.article_slug,
          title: row.article_title,
          orderIndex: row.article_order_index
        }
        subcategory.articles.push(article)
        allArticles.push(article)
      }
    }

    const categories = Array.from(categoriesMap.values())

    // Fetch popular articles
    const popularArticlesStmt = db.prepare(`
      SELECT slug, title, img, subtitle
      FROM popular_articles
      WHERE is_active = 1
      ORDER BY order_index
    `)
    const popularArticles = popularArticlesStmt.all() as any[]

    // Fetch keep learning articles
    const keepLearningStmt = db.prepare(`
      SELECT slug, title, img, subtitle
      FROM keep_learning_articles
      WHERE is_active = 1
      ORDER BY order_index
    `)
    const keepLearning = keepLearningStmt.all() as any[]

    res.status(200).json({
      allArticles,
      categories,
      popularArticles,
      keepLearning
    })
  } catch (error) {
    console.error('Error fetching help center data:', error)
    res.status(500).json({ message: 'Internal server error' })
  } finally {
    db.close()
  }
}
