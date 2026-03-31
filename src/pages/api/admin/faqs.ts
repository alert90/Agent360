import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const categories = await prisma.faqCategory.findMany({
        where: { isActive: 1 },
        orderBy: { orderIndex: 'asc' },
        include: {
          questions: {
            where: { isActive: 1 },
            orderBy: { orderIndex: 'asc' }
          }
        }
      })

      const formattedCategories = categories.map(c => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        icon: c.icon,
        subtitle: c.subtitle,
        orderIndex: c.orderIndex,
        isActive: c.isActive === 1,
        questions: c.questions.map(q => ({
          id: q.id,
          slug: q.slug,
          question: q.question,
          answer: q.answer,
          orderIndex: q.orderIndex,
          isActive: q.isActive === 1
        }))
      }))

      res.status(200).json({ categories: formattedCategories })
    } catch (error) {
      console.error('Error fetching FAQ data:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else if (req.method === 'POST') {
    try {
      const { type, data } = req.body

      if (type === 'category') {
        const { slug, title, icon, subtitle, orderIndex } = data

        if (!slug || !title) {
          return res.status(400).json({ message: 'Slug and title are required' })
        }

        const category = await prisma.faqCategory.create({
          data: {
            slug,
            title,
            icon: icon || 'tabler:help',
            subtitle: subtitle || '',
            orderIndex: orderIndex || 0,
            isActive: 1
          }
        })

        res.status(201).json({
          message: 'Category created successfully',
          id: category.id
        })
      } else if (type === 'question') {
        const { categoryId, slug, question, answer, orderIndex } = data

        if (!categoryId || !slug || !question || !answer) {
          return res.status(400).json({ message: 'Category ID, slug, question, and answer are required' })
        }

        const newQuestion = await prisma.faqQuestion.create({
          data: {
            categoryId,
            slug,
            question,
            answer,
            orderIndex: orderIndex || 0,
            isActive: 1
          }
        })

        res.status(201).json({
          message: 'Question created successfully',
          id: newQuestion.id
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
        const { slug, title, icon, subtitle, orderIndex, isActive } = data

        await prisma.faqCategory.update({
          where: { id },
          data: {
            slug,
            title,
            icon,
            subtitle,
            orderIndex,
            isActive: isActive ? 1 : 0,
            updatedAt: new Date()
          }
        })

        res.status(200).json({ message: 'Category updated successfully' })
      } else if (type === 'question') {
        const { categoryId, slug, question, answer, orderIndex, isActive } = data

        await prisma.faqQuestion.update({
          where: { id },
          data: {
            categoryId,
            slug,
            question,
            answer,
            orderIndex,
            isActive: isActive ? 1 : 0,
            updatedAt: new Date()
          }
        })

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
        await prisma.faqQuestion.deleteMany({
          where: { categoryId: id }
        })
        await prisma.faqCategory.delete({
          where: { id }
        })
        res.status(200).json({ message: 'Category and its questions deleted successfully' })
      } else if (type === 'question') {
        await prisma.faqQuestion.delete({
          where: { id }
        })
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
