import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from 'src/lib/prisma'

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
    const activeArticle = await prisma.helpCenterArticle.findFirst({
      where: {
        slug: article,
        subcategory: {
          slug: subcategory,
          category: {
            slug: category
          }
        },
        isActive: 1
      },
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        subcategoryId: true
      }
    })

    if (!activeArticle) {
      return res.status(404).json({ message: 'Article not found' })
    }

    // Fetch the active subcategory
    const activeSubcategory = await prisma.helpCenterSubcategory.findFirst({
      where: {
        slug: subcategory,
        category: {
          slug: category
        },
        isActive: 1
      },
      select: {
        id: true,
        slug: true,
        title: true,
        icon: true
      }
    })

    // Fetch all articles in this subcategory
    const articles = await prisma.helpCenterArticle.findMany({
      where: {
        subcategoryId: activeArticle.subcategoryId,
        isActive: 1
      },
      orderBy: {
        orderIndex: 'asc'
      },
      select: {
        id: true,
        slug: true,
        title: true,
        orderIndex: true
      }
    })

    // Fetch all categories for navigation
    const categories = await prisma.helpCenterCategory.findMany({
      where: { isActive: 1 },
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        icon: true,
        avatarColor: true
      }
    })

    res.status(200).json({
      activeArticle: {
        id: activeArticle.id,
        slug: activeArticle.slug,
        title: activeArticle.title,
        content: activeArticle.content
      },
      activeSubcategory: {
        id: activeSubcategory?.id,
        slug: activeSubcategory?.slug,
        title: activeSubcategory?.title,
        icon: activeSubcategory?.icon
      },
      categories: categories.map(cat => ({
        id: cat.id,
        slug: cat.slug,
        title: cat.title,
        icon: cat.icon,
        avatarColor: cat.avatarColor
      })),
      articles: articles.map(article => ({
        id: article.id,
        slug: article.slug,
        title: article.title,
        orderIndex: article.orderIndex ?? 0
      }))
    })
  } catch (error) {
    console.error('Error fetching help center article data:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
