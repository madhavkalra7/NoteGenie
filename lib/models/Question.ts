import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IQuestion extends Document {
  id: string
  user_id: string
  summary_id?: string | null
  question: string
  type: 'mcq' | 'short' | 'truefalse'
  options?: string[] | null
  correct_answer: string
  difficulty: 'easy' | 'medium' | 'hard'
  created_at: Date
}

const QuestionSchema: Schema = new Schema(
  {
    user_id: { type: String, required: true, index: true },
    summary_id: { type: String, default: null, index: true },
    question: { type: String, required: true },
    type: { type: String, enum: ['mcq', 'short', 'truefalse'], required: true },
    options: { type: [String], default: null },
    correct_answer: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    created_at: { type: Date, default: Date.now }
  },
  {
    toJSON: {
      virtuals: true,
      transform: function (doc, ret: any) {
        ret.id = ret._id.toString()
        delete ret._id
        delete ret.__v
      }
    },
    toObject: { virtuals: true }
  }
)

QuestionSchema.index({ user_id: 1, created_at: -1 })

const Question: Model<IQuestion> = mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema)

export default Question
