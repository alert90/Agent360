import { NextApiRequest, NextApiResponse } from 'next/types'
import Database from 'better-sqlite3'

const db = new Database('agent360.db')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { q } = req.query

    // Fetch all FAQ categories
    const categoriesStmt = db.prepare(`
      SELECT id, slug, title, icon, subtitle, order_index
      FROM faq_categories
      WHERE is_active = 1
      ORDER BY order_index
    `)
    const categories = categoriesStmt.all() as any[]

    const faqData: Record<string, any> = {}

    for (const category of categories) {
      // Fetch questions for this category
      let questionsStmt
      let questions

      if (q && typeof q === 'string') {
        // Search in questions and answers
        const queryLowered = q.toLowerCase()
        questionsStmt = db.prepare(`
          SELECT slug, question, answer
          FROM faq_questions
          WHERE category_id = ? AND is_active = 1
          ORDER BY order_index
        `)
        questions = questionsStmt.all(category.id) as any[]

        // Filter questions based on search
        questions = questions.filter(
          (question: any) =>
            question.question.toLowerCase().includes(queryLowered) ||
            question.answer.toLowerCase().includes(queryLowered)
        )
      } else {
        questionsStmt = db.prepare(`
          SELECT slug, question, answer
          FROM faq_questions
          WHERE category_id = ? AND is_active = 1
          ORDER BY order_index
        `)
        questions = questionsStmt.all(category.id) as any[]
      }

      faqData[category.slug] = {
        id: category.slug,
        title: category.title,
        icon: category.icon,
        subtitle: category.subtitle,
        qandA: questions.map((q: any) => ({
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

  // Note: Don't close the database connection here as it may interfere with the response
}
