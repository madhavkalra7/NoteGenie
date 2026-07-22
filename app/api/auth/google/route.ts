import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import User from '@/lib/models/User'
import UserStat from '@/lib/models/UserStat'
import { signToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json()

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Missing access token' },
        { status: 400 }
      )
    }

    // Verify token & fetch user profile directly from Google API
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    if (!googleRes.ok) {
      const errText = await googleRes.text()
      console.error('Google token verification failed:', errText)
      return NextResponse.json(
        { error: 'Failed to verify Google identity' },
        { status: 401 }
      )
    }

    const googleUser = await googleRes.json()
    const { email, name, picture } = googleUser

    if (!email) {
      return NextResponse.json(
        { error: 'Google account did not return an email address' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    let user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      user = await User.create({
        email: email.toLowerCase(),
        name: name || '',
        avatar_url: picture || '',
        created_at: new Date()
      })

      // Initialize stats for new user
      await UserStat.create({
        user_id: user._id.toString(),
        notes_processed: 0,
        flashcards_generated: 0,
        quizzes_taken: 0,
        updated_at: new Date()
      })
    } else {
      // Update profile info if changed
      let updated = false
      if (name && (!user.name || user.name !== name)) {
        user.name = name
        updated = true
      }
      if (picture && (!user.avatar_url || user.avatar_url !== picture)) {
        user.avatar_url = picture
        updated = true
      }
      if (updated) {
        await user.save()
      }
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name
    })

    const dbUser = {
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

    const response = NextResponse.json({
      success: true,
      user: dbUser
    })

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response
  } catch (error: any) {
    console.error('Google auth error:', error)
    return NextResponse.json(
      { error: error.message || 'Google authentication failed' },
      { status: 500 }
    )
  }
}
