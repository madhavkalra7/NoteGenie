import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IStudyTask extends Document {
  id: string
  user_id: string
  day: number
  topics: string[]
  duration: number
  priority: 'high' | 'medium' | 'low'
  completed: boolean
  date: string
  created_at: Date
}

const StudyTaskSchema: Schema = new Schema(
  {
    user_id: { type: String, required: true, index: true },
    day: { type: Number, required: true },
    topics: { type: [String], default: [] },
    duration: { type: Number, required: true },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    completed: { type: Boolean, default: false },
    date: { type: String, required: true },
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

StudyTaskSchema.index({ user_id: 1, day: 1 })

const StudyTask: Model<IStudyTask> = mongoose.models.StudyTask || mongoose.model<IStudyTask>('StudyTask', StudyTaskSchema)

export default StudyTask
