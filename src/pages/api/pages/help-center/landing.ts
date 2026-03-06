import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from 'src/lib/prisma'

interface Article {
  id: number
  slug: string
  title: string
  orderIndex: number
}

interface Subcategory {
  id: number
  slug: string
  title: string
  icon: string | null
  articles: Article[]
}

interface Category {
  id: number
  slug: string
  title: string
  icon: string | null
  avatarColor: string | null
  subCategories: Subcategory[]
}

interface PopularArticle {
  slug: string
  title: string
  img: string
  subtitle: string
}

interface KeepLearningArticle {
  slug: string
  title: string
  img: string
  subtitle: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Fetch categories with subcategories and articles
    const categories = await prisma.helpCenterCategory.findMany({
      where: { isActive: 1 },
      orderBy: { orderIndex: 'asc' },
      include: {
        subcategories: {
          where: { isActive: 1 },
          orderBy: { orderIndex: 'asc' },
          include: {
            articles: {
              where: { isActive: 1 },
              orderBy: { orderIndex: 'asc' },
              select: { id: true, slug: true, title: true, orderIndex: true }
            }
          },
          select: { id: true, slug: true, title: true, icon: true, orderIndex: true }
        }
      }
    })

    // Process the data into the expected structure
    const allArticles: Article[] = []
    const processedCategories: Category[] = categories.map(cat => {
      const subCategories = cat.subcategories.map(sub => {
        const articles = sub.articles.map(art => {
          const article: Article = {
            id: art.id,
            slug: art.slug,
            title: art.title,
            orderIndex: art.orderIndex ?? 0
          }
          allArticles.push(article)

          return article
        })

        return {
          id: sub.id,
          slug: sub.slug,
          title: sub.title,
          icon: sub.icon,
          articles
        }
      })

      return {
        id: cat.id,
        slug: cat.slug,
        title: cat.title,
        icon: cat.icon ?? null,
        avatarColor: cat.avatarColor ?? null,
        subCategories
      }
    })

    // Fetch popular articles
    const popularArticles: PopularArticle[] = await prisma.popularArticle.findMany({
      where: { isActive: 1 },
      orderBy: { orderIndex: 'asc' },
      select: { slug: true, title: true, img: true, subtitle: true }
    })

    // Fetch keep learning articles
    const keepLearning: KeepLearningArticle[] = await prisma.keepLearningArticle.findMany({
      where: { isActive: 1 },
      orderBy: { orderIndex: 'asc' },
      select: { slug: true, title: true, img: true, subtitle: true }
    })

    res.status(200).json({
      allArticles,
      categories: processedCategories,
      popularArticles,
      keepLearning
    })
  } catch (error) {
    console.error('Error fetching help center data:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
