import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import User from '@/lib/models/User'
import UserStat from '@/lib/models/UserStat'
import { hashPassword, signToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)
    const newUser = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name || '',
      avatar_url: '',
      created_at: new Date()
    })

    // Initialize stats record for user
    await UserStat.create({
      user_id: newUser._id.toString(),
      notes_processed: 0,
      flashcards_generated: 0,
      quizzes_taken: 0,
      updated_at: new Date()
    })

    const token = signToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name
    })

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name || null,
        avatar_url: newUser.avatar_url || null,
        created_at: newUser.created_at.toISOString(),
        user_metadata: {
          name: newUser.name || null,
          avatar_url: newUser.avatar_url || null
        }
      }
    })

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response
  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sign up' },
      { status: 500 }
    )
  }
}
