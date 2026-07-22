import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import Summary from '@/lib/models/Summary'
import Flashcard from '@/lib/models/Flashcard'
import Concept from '@/lib/models/Concept'
import Question from '@/lib/models/Question'
import StudyTask from '@/lib/models/StudyTask'
import UserStat from '@/lib/models/UserStat'

export async function POST(request: NextRequest) {
  try {
    const { action, payload } = await request.json()
    await connectToDatabase()

    switch (action) {
      // --- SUMMARIES ---
      case 'getSummaries': {
        const { userId } = payload
        const summaries = await Summary.find({ user_id: userId }).sort({ created_at: -1 }).lean()
        return NextResponse.json({
          data: summaries.map(s => ({
            ...s,
            id: s._id.toString(),
            created_at: s.created_at?.toISOString() || new Date().toISOString()
          })),
          error: null
        })
      }

      case 'addSummary': {
        const { summary } = payload
        const newSummary = await Summary.create({
          ...summary,
          created_at: new Date()
        })
        const obj = newSummary.toObject()
        return NextResponse.json({
          data: {
            ...obj,
            id: newSummary._id.toString(),
            created_at: newSummary.created_at.toISOString()
          },
          error: null
        })
      }

      case 'deleteSummary': {
        const { id } = payload
        await Summary.findByIdAndDelete(id)
        await Flashcard.deleteMany({ summary_id: id })
        await Concept.deleteMany({ summary_id: id })
        await Question.deleteMany({ summary_id: id })
        return NextResponse.json({ data: true, error: null })
      }

      // --- FLASHCARDS ---
      case 'getFlashcards': {
        const { userId } = payload
        const flashcards = await Flashcard.find({ user_id: userId }).sort({ created_at: -1 }).lean()
        return NextResponse.json({
          data: flashcards.map(f => ({
            ...f,
            id: f._id.toString(),
            created_at: f.created_at?.toISOString() || new Date().toISOString()
          })),
          error: null
        })
      }

      case 'getFlashcardsBySummary': {
        const { summaryId } = payload
        const flashcards = await Flashcard.find({ summary_id: summaryId }).sort({ created_at: -1 }).lean()
        return NextResponse.json({
          data: flashcards.map(f => ({
            ...f,
            id: f._id.toString(),
            created_at: f.created_at?.toISOString() || new Date().toISOString()
          })),
          error: null
        })
      }

      case 'addFlashcards': {
        const { flashcards } = payload
        const created = await Flashcard.insertMany(
          flashcards.map((f: any) => ({ ...f, created_at: new Date() }))
        )
        return NextResponse.json({
          data: created.map(f => ({
            ...f.toObject(),
            id: f._id.toString(),
            created_at: f.created_at.toISOString()
          })),
          error: null
        })
      }

      case 'updateFlashcard': {
        const { id, updates } = payload
        const updated = await Flashcard.findByIdAndUpdate(id, updates, { new: true }).lean()
        if (!updated) return NextResponse.json({ data: null, error: 'Flashcard not found' })
        return NextResponse.json({
          data: {
            ...updated,
            id: updated._id.toString(),
            created_at: updated.created_at?.toISOString() || new Date().toISOString()
          },
          error: null
        })
      }

      // --- CONCEPTS ---
      case 'getConcepts': {
        const { userId } = payload
        const concepts = await Concept.find({ user_id: userId }).sort({ created_at: -1 }).lean()
        return NextResponse.json({
          data: concepts.map(c => ({
            ...c,
            id: c._id.toString(),
            created_at: c.created_at?.toISOString() || new Date().toISOString()
          })),
          error: null
        })
      }

      case 'getConceptsBySummary': {
        const { summaryId } = payload
        const concepts = await Concept.find({ summary_id: summaryId }).sort({ created_at: -1 }).lean()
        return NextResponse.json({
          data: concepts.map(c => ({
            ...c,
            id: c._id.toString(),
            created_at: c.created_at?.toISOString() || new Date().toISOString()
          })),
          error: null
        })
      }

      case 'addConcepts': {
        const { concepts } = payload
        const created = await Concept.insertMany(
          concepts.map((c: any) => ({ ...c, created_at: new Date() }))
        )
        return NextResponse.json({
          data: created.map(c => ({
            ...c.toObject(),
            id: c._id.toString(),
            created_at: c.created_at.toISOString()
          })),
          error: null
        })
      }

      // --- QUESTIONS ---
      case 'getQuestions': {
        const { userId } = payload
        const questions = await Question.find({ user_id: userId }).sort({ created_at: -1 }).lean()
        return NextResponse.json({
          data: questions.map(q => ({
            ...q,
            id: q._id.toString(),
            created_at: q.created_at?.toISOString() || new Date().toISOString()
          })),
          error: null
        })
      }

      case 'getQuestionsBySummary': {
        const { summaryId } = payload
        const questions = await Question.find({ summary_id: summaryId }).sort({ created_at: -1 }).lean()
        return NextResponse.json({
          data: questions.map(q => ({
            ...q,
            id: q._id.toString(),
            created_at: q.created_at?.toISOString() || new Date().toISOString()
          })),
          error: null
        })
      }

      case 'addQuestions': {
        const { questions } = payload
        const created = await Question.insertMany(
          questions.map((q: any) => ({ ...q, created_at: new Date() }))
        )
        return NextResponse.json({
          data: created.map(q => ({
            ...q.toObject(),
            id: q._id.toString(),
            created_at: q.created_at.toISOString()
          })),
          error: null
        })
      }

      // --- STUDY TASKS ---
      case 'getStudyPlan': {
        const { userId } = payload
        const tasks = await StudyTask.find({ user_id: userId }).sort({ day: 1 }).lean()
        return NextResponse.json({
          data: tasks.map(t => ({
            ...t,
            id: t._id.toString(),
            created_at: t.created_at?.toISOString() || new Date().toISOString()
          })),
          error: null
        })
      }

      case 'setStudyPlan': {
        const { userId, tasks } = payload
        await StudyTask.deleteMany({ user_id: userId })
        const created = await StudyTask.insertMany(
          tasks.map((t: any) => ({ ...t, created_at: new Date() }))
        )
        return NextResponse.json({
          data: created.map(t => ({
            ...t.toObject(),
            id: t._id.toString(),
            created_at: t.created_at.toISOString()
          })),
          error: null
        })
      }

      case 'updateStudyTask': {
        const { id, updates } = payload
        const updated = await StudyTask.findByIdAndUpdate(id, updates, { new: true }).lean()
        if (!updated) return NextResponse.json({ data: null, error: 'Task not found' })
        return NextResponse.json({
          data: {
            ...updated,
            id: updated._id.toString(),
            created_at: updated.created_at?.toISOString() || new Date().toISOString()
          },
          error: null
        })
      }

      // --- STATS ---
      case 'getStats': {
        const { userId } = payload
        let stats = await UserStat.findOne({ user_id: userId }).lean()
        if (!stats) {
          const created = await UserStat.create({
            user_id: userId,
            notes_processed: 0,
            flashcards_generated: 0,
            quizzes_taken: 0,
            updated_at: new Date()
          })
          stats = created.toObject() as any
        }
        return NextResponse.json({
          data: {
            ...stats,
            id: (stats as any)._id.toString(),
            updated_at: (stats as any).updated_at?.toISOString() || new Date().toISOString()
          },
          error: null
        })
      }

      case 'updateStats': {
        const { userId, updates } = payload
        const updated = await UserStat.findOneAndUpdate(
          { user_id: userId },
          { ...updates, updated_at: new Date() },
          { new: true, upsert: true }
        ).lean()
        return NextResponse.json({
          data: {
            ...updated,
            id: updated._id.toString(),
            updated_at: updated.updated_at?.toISOString() || new Date().toISOString()
          },
          error: null
        })
      }

      // --- SUMMARY WITH RELATIONS ---
      case 'getSummaryWithRelations': {
        const { summaryId } = payload
        const [summary, flashcards, concepts, questions] = await Promise.all([
          Summary.findById(summaryId).lean(),
          Flashcard.find({ summary_id: summaryId }).lean(),
          Concept.find({ summary_id: summaryId }).lean(),
          Question.find({ summary_id: summaryId }).lean()
        ])

        return NextResponse.json({
          summary: summary ? { ...summary, id: summary._id.toString() } : null,
          flashcards: flashcards.map(f => ({ ...f, id: f._id.toString() })),
          concepts: concepts.map(c => ({ ...c, id: c._id.toString() })),
          questions: questions.map(q => ({ ...q, id: q._id.toString() }))
        })
      }

      // --- HISTORY BY DATE ---
      case 'getHistoryByDate': {
        const { userId } = payload
        const summaries = await Summary.find({ user_id: userId })
          .select('title one_liner created_at')
          .sort({ created_at: -1 })
          .lean()

        const grouped: Record<string, any[]> = {}
        summaries.forEach((item: any) => {
          const date = new Date(item.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
          if (!grouped[date]) grouped[date] = []
          grouped[date].push({
            id: item._id.toString(),
            title: item.title,
            one_liner: item.one_liner,
            created_at: item.created_at.toISOString()
          })
        })

        return NextResponse.json({ data: grouped, error: null })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Data route error:', error)
    return NextResponse.json({ data: null, error: error.message || 'Database request failed' }, { status: 500 })
  }
}
