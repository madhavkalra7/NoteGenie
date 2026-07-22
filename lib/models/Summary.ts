import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISummary extends Document {
  id: string
  user_id: string
  title: string
  raw_text: string
  one_liner: string
  short_summary: string
  detailed_bullets: string[]
  source_type: 'text' | 'audio' | 'youtube'
  created_at: Date
}

const SummarySchema: Schema = new Schema(
  {
    user_id: { type: String, required: true, index: true },
    title: { type: String, required: true, default: 'Untitled Note' },
    raw_text: { type: String, required: true },
    one_liner: { type: String, required: true },
    short_summary: { type: String, required: true },
    detailed_bullets: { type: [String], default: [] },
    source_type: { type: String, enum: ['text', 'audio', 'youtube'], default: 'text' },
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

SummarySchema.index({ user_id: 1, created_at: -1 })

const Summary: Model<ISummary> = mongoose.models.Summary || mongoose.model<ISummary>('Summary', SummarySchema)

export default Summary
