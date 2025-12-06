import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create admin client with service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { userId, name, email } = await request.json()

    if (!userId || !name) {
      return NextResponse.json(
        { error: 'Missing userId or name' },
        { status: 400 }
      )
    }

    // First check if profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    let error

    if (existingProfile) {
      // Profile exists, just update
      const result = await supabaseAdmin
        .from('profiles')
        .update({ name: name.trim() })
        .eq('id', userId)
      error = result.error
    } else {
      // Profile doesn't exist, insert it
      const result = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          name: name.trim()
        })
      error = result.error
    }

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
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
