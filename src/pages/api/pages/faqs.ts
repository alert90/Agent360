import { NextApiRequest, NextApiResponse } from 'next/types'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { q } = req.query

    // Fetch all FAQ categories
    const categories = await prisma.faqCategory.findMany({
      where: { isActive: 1 },
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        icon: true,
        subtitle: true,
        orderIndex: true
      }
    })

    const faqData: Record<string, any> = {}

    for (const category of categories) {
      let questions

      if (q && typeof q === 'string') {
        // Fetch all questions and filter in memory (case insensitive)
        const allQuestions = await prisma.faqQuestion.findMany({
          where: { categoryId: category.id, isActive: 1 },
          orderBy: { orderIndex: 'asc' },
          select: {
            slug: true,
            question: true,
            answer: true
          }
        })

        const queryLowered = q.toLowerCase()
        questions = allQuestions.filter(
          question =>
            question.question.toLowerCase().includes(queryLowered) ||
            question.answer.toLowerCase().includes(queryLowered)
        )
      } else {
        questions = await prisma.faqQuestion.findMany({
          where: { categoryId: category.id, isActive: 1 },
          orderBy: { orderIndex: 'asc' },
          select: {
            slug: true,
            question: true,
            answer: true
          }
        })
      }

      faqData[category.slug] = {
        id: category.slug,
        title: category.title,
        icon: category.icon,
        subtitle: category.subtitle,
        qandA: questions.map(q => ({
          id: q.slug,
          question: q.question,
          answer: q.answer
        }))
      }
    }

    res.status(200).json({ faqData })
  } catch (error) {
    console.error('Error fetching FAQ data:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
