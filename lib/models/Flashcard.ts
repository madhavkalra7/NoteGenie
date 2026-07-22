import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IFlashcard extends Document {
  id: string
  user_id: string
  summary_id?: string | null
  question: string
  answer: string
  concept_id?: string | null
  times_reviewed: number
  was_correct?: boolean | null
  last_reviewed?: Date | null
  created_at: Date
}

const FlashcardSchema: Schema = new Schema(
  {
    user_id: { type: String, required: true, index: true },
    summary_id: { type: String, default: null, index: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    concept_id: { type: String, default: null },
    times_reviewed: { type: Number, default: 0 },
    was_correct: { type: Boolean, default: null },
    last_reviewed: { type: Date, default: null },
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

FlashcardSchema.index({ user_id: 1, created_at: -1 })

const Flashcard: Model<IFlashcard> = mongoose.models.Flashcard || mongoose.model<IFlashcard>('Flashcard', FlashcardSchema)

export default Flashcard
