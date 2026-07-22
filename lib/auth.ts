import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import connectToDatabase from './mongodb'
import User from './models/User'

const JWT_SECRET = process.env.JWT_SECRET || 'notegenie-secret-key-change-in-production'
const COOKIE_NAME = 'notegenie_token'

export interface JWTPayload {
  userId: string
  email: string
  name?: string
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

export async function getSessionUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (!token) {
      return null
    }

    const payload = verifyToken(token)
    if (!payload?.userId) {
      return null
    }

    await connectToDatabase()
    const user = await User.findById(payload.userId).lean()
    if (!user) {
      return null
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name || null,
      avatar_url: user.avatar_url || null,
      created_at: user.created_at?.toISOString() || new Date().toISOString(),
      user_metadata: {
        name: user.name || null,
        avatar_url: user.avatar_url || null
      }
    }
  } catch (error) {
    return null
  }
}

export { COOKIE_NAME }
