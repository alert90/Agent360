// src/pages/api/help-center/subcategory.ts
import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { category, subcategory } = req.query

    if (!category || typeof category !== 'string') {
      return res.status(400).json({ message: 'Category parameter is required' })
    }

    // Fetch category data with subcategories using Prisma
    const categoryData = await prisma.helpCenterCategory.findFirst({
      where: {
        slug: category,
        isActive: 1
      },
      include: {
        subcategories: {
          where: { isActive: 1 },
          orderBy: { orderIndex: 'asc' },
          include: {
            articles: {
              where: { isActive: 1 },
              orderBy: { orderIndex: 'asc' },
              select: {
                id: true,
                slug: true,
                title: true,
                orderIndex: true
              }
            }
          }
        }
      }
    })

    if (!categoryData) {
      return res.status(404).json({ message: 'Category not found' })
    }

    // Transform the data to match the expected format
    const transformedCategoryData = {
      id: categoryData.id,
      slug: categoryData.slug,
      title: categoryData.title,
      icon: categoryData.icon,
      avatarColor: categoryData.avatarColor,
      subCategories: categoryData.subcategories.map(sub => ({
        id: sub.id,
        slug: sub.slug,
        title: sub.title,
        icon: sub.icon,
        articles: sub.articles.map(article => ({
          id: article.id,
          slug: article.slug,
          title: article.title,
          orderIndex: article.orderIndex
        }))
      }))
    }

    // Fetch all categories for navigation
    const allCategories = await prisma.helpCenterCategory.findMany({
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

    // Transform all categories data
    const transformedCategories = allCategories.map(cat => ({
      id: cat.id,
      slug: cat.slug,
      title: cat.title,
      icon: cat.icon,
      avatarColor: cat.avatarColor
    }))

    // Determine active tab
    const activeTab =
      subcategory && typeof subcategory === 'string'
        ? subcategory
        : transformedCategoryData.subCategories[0]?.slug || ''

    res.status(200).json({
      data: transformedCategoryData,
      categories: transformedCategories,
      activeTab
    })
  } catch (error) {
    console.error('Error fetching help center subcategory data:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
