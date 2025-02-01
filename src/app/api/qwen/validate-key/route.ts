import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization')
    console.log(
      'Qwen validation - Auth header:',
      authHeader?.startsWith('Bearer ')
    )

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
    console.log('Qwen validation - API key present:', !!apiKey)

    if (!apiKey) {
      return NextResponse.json(
        { valid: false, error: 'Empty API key' },
        { status: 401 }
      )
    }

    console.log('Qwen validation - Creating OpenAI instance')
    const openai = new OpenAI({
      apiKey,
      baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    })

    console.log('Qwen validation - Testing API key with completion request')
    const testCompletion = await openai.chat.completions.create({
      model: 'qwen-turbo',
      messages: [{ role: 'user', content: 'API key validation test' }],
      max_tokens: 1,
      stream: false,
    })

    console.log(
      'Qwen validation - Got completion response:',
      !!testCompletion?.id
    )
    if (!testCompletion || !testCompletion.id) {
      throw new Error('Invalid API response')
    }

    return NextResponse.json({
      valid: true,
      model: testCompletion.model,
    })
  } catch (error: unknown) {
    console.error('Qwen validation error:', error)

    if (error instanceof OpenAI.APIError) {
      console.error('Qwen OpenAI error details:', {
        message: error.message,
        code: error.code,
        type: error.type,
        status: error.status,
      })
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
