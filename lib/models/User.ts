import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUser extends Document {
  id: string
  email: string
  password?: string
  name?: string
  avatar_url?: string
  created_at: Date
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    name: { type: String, default: '' },
    avatar_url: { type: String, default: '' },
    created_at: { type: Date, default: Date.now }
  },
  {
    toJSON: {
      virtuals: true,
      transform: function (doc, ret: any) {
        ret.id = ret._id.toString()
        delete ret._id
        delete ret.__v
        delete ret.password
      }
    },
    toObject: { virtuals: true }
  }
)

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User
