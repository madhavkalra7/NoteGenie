import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function POST(request: NextRequest) {
  try {
    const { userId, name, email } = await request.json()

    if (!userId || !name) {
      return NextResponse.json(
        { error: 'Missing userId or name' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    let user = await User.findById(userId)

    if (user) {
      user.name = name.trim()
      if (email) user.email = email.toLowerCase()
      await user.save()
    } else {
      user = await User.create({
        _id: userId,
        email: email ? email.toLowerCase() : '',
        name: name.trim(),
        created_at: new Date()
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    )
  }
}
