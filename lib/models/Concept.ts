import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IConcept extends Document {
  id: string
  user_id: string
  summary_id?: string | null
  term: string
  definition: string
  category?: string | null
  difficulty: 'easy' | 'medium' | 'hard'
  created_at: Date
}

const ConceptSchema: Schema = new Schema(
  {
    user_id: { type: String, required: true, index: true },
    summary_id: { type: String, default: null, index: true },
    term: { type: String, required: true },
    definition: { type: String, required: true },
    category: { type: String, default: null },
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

ConceptSchema.index({ user_id: 1, created_at: -1 })

const Concept: Model<IConcept> = mongoose.models.Concept || mongoose.model<IConcept>('Concept', ConceptSchema)

export default Concept
