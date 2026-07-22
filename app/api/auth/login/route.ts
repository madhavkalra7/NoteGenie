import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import User from '@/lib/models/User'
import { comparePassword, signToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const isMatch = await comparePassword(password, user.password)
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name
    })

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name || null,
        avatar_url: user.avatar_url || null,
        created_at: user.created_at.toISOString(),
        user_metadata: {
          name: user.name || null,
          avatar_url: user.avatar_url || null
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
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to log in' },
      { status: 500 }
    )
  }
}
