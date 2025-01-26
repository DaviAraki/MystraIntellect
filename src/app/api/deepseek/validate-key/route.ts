import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid Authorization format. Use: Bearer <key>',
        },
        { status: 401 }
      )
    }

    const apiKey = authHeader.split(' ')[1]
    if (!apiKey) {
      return NextResponse.json(
        { valid: false, error: 'Empty API key' },
        { status: 401 }
      )
    }

    const openai = new OpenAI({
      apiKey,
      baseURL: 'https://api.deepseek.com', // Correct base URL
    })

    // Test with minimal request
    const testCompletion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: 'API key validation test' }],
      max_tokens: 1,
    })

    return NextResponse.json({
      valid: true,
      model: testCompletion.model,
    })
  } catch (error: unknown) {
    console.error('DeepSeek validation error:', error)

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        {
          valid: false,
          error: error.message,
          code: error.code,
          type: error.type,
        },
        { status: error.status || 500 }
      )
    }

    return NextResponse.json(
      { valid: false, error: 'API validation failed' },
      { status: 500 }
    )
  }
}

