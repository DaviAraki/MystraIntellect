import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const VALID_MODELS = ['deepseek-chat', 'deepseek-reasoner'] as const

const getSystemPrompt = (model: (typeof VALID_MODELS)[number]) => {
  const basePrompt = 'You are an expert software developer. '
  const reasonerAddition = `Respond using this structure:
**Analysis**
- Breakdown of the problem
- Key considerations

**Solution Approach**
- Step-by-step methodology
- Technology choices

**Implementation**
\`\`\`[language]
// Code solution
\`\`\`
- Explanation of key parts`

  return model === 'deepseek-reasoner'
    ? basePrompt + reasonerAddition
    : basePrompt +
        'Provide clear, concise answers with markdown code blocks when appropriate.'
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header must use Bearer scheme' },
        { status: 401 }
      )
    }

    const apiKey = authHeader.split(' ')[1]
    if (!apiKey?.trim()) {
      return NextResponse.json(
        { error: 'Valid API key required' },
        { status: 401 }
      )
    }

    const { messages = [], model } = await req.json()

    if (!VALID_MODELS.includes(model as (typeof VALID_MODELS)[number])) {
      return NextResponse.json(
        { error: `Invalid model. Valid options: ${VALID_MODELS.join(', ')}` },
        { status: 400 }
      )
    }

    const openai = new OpenAI({
      apiKey,
      baseURL: 'https://api.deepseek.com',
    })

    const conversationHistory: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: getSystemPrompt(model),
      },
      ...messages
        .filter(
          (msg: { role: string; content: unknown }) =>
            ['user', 'assistant'].includes(msg.role) &&
            typeof msg.content === 'string'
        )
        .map((msg: { role: 'user' | 'assistant'; content: string }) => ({
          role: msg.role,
          content: msg.content,
        })),
    ]

    const stream = await openai.chat.completions.create({
      model,
      messages: conversationHistory,
      stream: true,
      temperature: model === 'deepseek-reasoner' ? 0.3 : 0.7,
      max_tokens: model === 'deepseek-reasoner' ? 2048 : 1024,
    })

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              controller.enqueue(new TextEncoder().encode(content))
            }
          }
          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        }
      },
      cancel() {
        stream.controller.abort()
      },
    })

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
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
