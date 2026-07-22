import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUserStat extends Document {
  id: string
  user_id: string
  notes_processed: number
  flashcards_generated: number
  quizzes_taken: number
  updated_at: Date
}

const UserStatSchema: Schema = new Schema(
  {
    user_id: { type: String, required: true, unique: true, index: true },
    notes_processed: { type: Number, default: 0 },
    flashcards_generated: { type: Number, default: 0 },
    quizzes_taken: { type: Number, default: 0 },
    updated_at: { type: Date, default: Date.now }
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

const UserStat: Model<IUserStat> = mongoose.models.UserStat || mongoose.model<IUserStat>('UserStat', UserStatSchema)

export default UserStat
