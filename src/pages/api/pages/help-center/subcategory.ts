import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

const db = new Database('agent360.db')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { category, subcategory } = req.query

    if (!category || typeof category !== 'string') {
      return res.status(400).json({ message: 'Category parameter is required' })
    }

    // Fetch category data with subcategories
    const categoryStmt = db.prepare(`
      SELECT
        c.id, c.slug, c.title, c.icon, c.avatar_color,
        sc.id as subcategory_id, sc.slug as subcategory_slug, sc.title as subcategory_title,
        sc.icon as subcategory_icon, sc.order_index as subcategory_order_index
      FROM help_center_categories c
      LEFT JOIN help_center_subcategories sc ON c.id = sc.category_id AND sc.is_active = 1
      WHERE c.slug = ? AND c.is_active = 1
      ORDER BY sc.order_index
    `)

    const categoryRows = categoryStmt.all(category) as any[]

    if (categoryRows.length === 0) {
      return res.status(404).json({ message: 'Category not found' })
    }

    // Process category data
    const categoryData = {
      id: categoryRows[0].id,
      slug: categoryRows[0].slug,
      title: categoryRows[0].title,
      icon: categoryRows[0].icon,
      avatarColor: categoryRows[0].avatar_color,
      subCategories: categoryRows
        .filter(row => row.subcategory_id)
        .map(row => ({
          id: row.subcategory_id,
          slug: row.subcategory_slug,
          title: row.subcategory_title,
          icon: row.subcategory_icon,
          articles: [] as any[]
        }))
    }

    // Fetch articles for each subcategory
    for (const subcategory of categoryData.subCategories) {
      const articlesStmt = db.prepare(`
        SELECT id, slug, title, order_index
        FROM help_center_articles
        WHERE subcategory_id = ? AND is_active = 1
        ORDER BY order_index
      `)
      const articles = articlesStmt.all(subcategory.id) as any[]
      subcategory.articles = articles.map(article => ({
        id: article.id,
        slug: article.slug,
        title: article.title,
        orderIndex: article.order_index
      }))
    }

    // Fetch all categories for navigation
    const allCategoriesStmt = db.prepare(`
      SELECT id, slug, title, icon, avatar_color
      FROM help_center_categories
      WHERE is_active = 1
      ORDER BY order_index
    `)
    const allCategories = allCategoriesStmt.all() as any[]

    // Determine active tab
    const activeTab =
      subcategory && typeof subcategory === 'string' ? subcategory : categoryData.subCategories[0]?.slug || ''

    res.status(200).json({
      data: categoryData,
      categories: allCategories.map(cat => ({
        id: cat.id,
        slug: cat.slug,
        title: cat.title,
        icon: cat.icon,
        avatarColor: cat.avatar_color
      })),
      activeTab
    })
  } catch (error) {
    console.error('Error fetching help center subcategory data:', error)
    res.status(500).json({ message: 'Internal server error' })
  } finally {
    db.close()
  }
}
