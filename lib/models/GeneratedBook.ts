import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IGeneratedBook extends Document {
  id: string
  user_id: string
  title: string
  category: string
  prompt: string
  chapter_count: number
  page_count: number
  pdf_url?: string | null
  pdf_data?: string | null
  status: 'generating' | 'completed' | 'failed'
  created_at: Date
}

const GeneratedBookSchema: Schema = new Schema(
  {
    user_id: { type: String, required: true, index: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    prompt: { type: String, required: true },
    chapter_count: { type: Number, required: true, default: 0 },
    page_count: { type: Number, required: true, default: 0 },
    pdf_url: { type: String, default: null },
    pdf_data: { type: String, default: null },
    status: { type: String, enum: ['generating', 'completed', 'failed'], default: 'generating' },
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

GeneratedBookSchema.index({ user_id: 1, created_at: -1 })

const GeneratedBook: Model<IGeneratedBook> = mongoose.models.GeneratedBook || mongoose.model<IGeneratedBook>('GeneratedBook', GeneratedBookSchema)

export default GeneratedBook
