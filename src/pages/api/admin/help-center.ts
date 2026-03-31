import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
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
                orderBy: { orderIndex: 'asc' }
              }
            }
          }
        }
      })

      const formattedCategories = categories.map(c => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        icon: c.icon,
        avatarColor: c.avatarColor,
        orderIndex: c.orderIndex,
        isActive: c.isActive === 1,
        subcategories: c.subcategories.map(s => ({
          id: s.id,
          slug: s.slug,
          title: s.title,
          icon: s.icon,
          orderIndex: s.orderIndex,
          isActive: s.isActive === 1,
          articles: s.articles.map(a => ({
            id: a.id,
            slug: a.slug,
            title: a.title,
            content: a.content,
            orderIndex: a.orderIndex,
            isActive: a.isActive === 1
          }))
        }))
      }))

      res.status(200).json({ categories: formattedCategories })
    } catch (error) {
      console.error('Error fetching help center data:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else if (req.method === 'POST') {
    try {
      const { type, data } = req.body

      if (type === 'category') {
        const { slug, title, icon, avatarColor, orderIndex } = data

        if (!slug || !title) {
          return res.status(400).json({ message: 'Slug and title are required' })
        }

        const category = await prisma.helpCenterCategory.create({
          data: {
            slug,
            title,
            icon: icon || 'tabler:help',
            avatarColor: avatarColor || 'primary',
            orderIndex: orderIndex || 0,
            isActive: 1
          }
        })

        res.status(201).json({
          message: 'Category created successfully',
          id: category.id
        })
      } else if (type === 'subcategory') {
        const { categoryId, slug, title, icon, orderIndex } = data

        if (!categoryId || !slug || !title) {
          return res.status(400).json({ message: 'Category ID, slug, and title are required' })
        }

        const subcategory = await prisma.helpCenterSubcategory.create({
          data: {
            categoryId,
            slug,
            title,
            icon: icon || 'tabler:circle',
            orderIndex: orderIndex || 0,
            isActive: 1
          }
        })

        res.status(201).json({
          message: 'Subcategory created successfully',
          id: subcategory.id
        })
      } else if (type === 'article') {
        const { subcategoryId, slug, title, content, orderIndex } = data

        if (!subcategoryId || !slug || !title || !content) {
          return res.status(400).json({ message: 'Subcategory ID, slug, title, and content are required' })
        }

        const article = await prisma.helpCenterArticle.create({
          data: {
            subcategoryId,
            slug,
            title,
            content,
            orderIndex: orderIndex || 0,
            isActive: 1
          }
        })

        res.status(201).json({
          message: 'Article created successfully',
          id: article.id
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
        const { slug, title, icon, avatarColor, orderIndex, isActive } = data

        await prisma.helpCenterCategory.update({
          where: { id },
          data: {
            slug,
            title,
            icon,
            avatarColor,
            orderIndex,
            isActive: isActive ? 1 : 0,
            updatedAt: new Date()
          }
        })

        res.status(200).json({ message: 'Category updated successfully' })
      } else if (type === 'subcategory') {
        const { categoryId, slug, title, icon, orderIndex, isActive } = data

        await prisma.helpCenterSubcategory.update({
          where: { id },
          data: {
            categoryId,
            slug,
            title,
            icon,
            orderIndex,
            isActive: isActive ? 1 : 0,
            updatedAt: new Date()
          }
        })

        res.status(200).json({ message: 'Subcategory updated successfully' })
      } else if (type === 'article') {
        const { subcategoryId, slug, title, content, orderIndex, isActive } = data

        await prisma.helpCenterArticle.update({
          where: { id },
          data: {
            subcategoryId,
            slug,
            title,
            content,
            orderIndex,
            isActive: isActive ? 1 : 0,
            updatedAt: new Date()
          }
        })

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
        await prisma.helpCenterArticle.deleteMany({
          where: {
            subcategory: {
              categoryId: id
            }
          }
        })
        await prisma.helpCenterSubcategory.deleteMany({
          where: { categoryId: id }
        })
        await prisma.helpCenterCategory.delete({
          where: { id }
        })
        res.status(200).json({ message: 'Category and all related content deleted successfully' })
      } else if (type === 'subcategory') {
        await prisma.helpCenterArticle.deleteMany({
          where: { subcategoryId: id }
        })
        await prisma.helpCenterSubcategory.delete({
          where: { id }
        })
        res.status(200).json({ message: 'Subcategory and its articles deleted successfully' })
      } else if (type === 'article') {
        await prisma.helpCenterArticle.delete({
          where: { id }
        })
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
