import { ChatMessage } from '@/types/message'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const VALID_MODELS = ['deepseek-chat', 'deepseek-reasoner'] as const

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header must start with Bearer' },
        { status: 401 }
      )
    }

    const apiKey = authHeader.split(' ')[1]
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 })
    }

    const { messages = [], model } = await req.json()

    if (!VALID_MODELS.includes(model as (typeof VALID_MODELS)[number])) {
      return NextResponse.json(
        { error: `Invalid model. Use: ${VALID_MODELS.join(', ')}` },
        { status: 400 }
      )
    }

    const openai = new OpenAI({
      apiKey,
      baseURL: 'https://api.deepseek.com', // Correct base URL
    })

    const formattedMessages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content:
          'You are an expert software developer. Follow these rules:\n' +
          '- Use markdown code blocks with [filename] headers\n' +
          '- Explain concepts clearly\n' +
          '- Provide complete solutions',
      },
      ...messages.map((m: ChatMessage) => ({
        role: m.role,
        content: m.content,
      })),
    ]

    const stream = await openai.chat.completions.create({
      model,
      messages: formattedMessages,
      stream: true,
    })

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            controller.enqueue(new TextEncoder().encode(content))
          }
          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        }
      },
    })

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error: unknown) {
    console.error('API Error:', error)

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          type: error.type,
        },
        { status: error.status || 500 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'API request failed' },
      { status: 500 }
    )
  }
}
