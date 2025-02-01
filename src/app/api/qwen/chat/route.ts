import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'
export const maxDuration = 60
interface ExtendedDelta
  extends OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta {
  reasoning_content?: string | null
}

const VALID_MODELS = ['qwen-plus', 'qwen-max', 'qwen-turbo'] as const

const getSystemPrompt = () => {
  const basePrompt = `You are an expert software developer. 
                      respond in the following format:
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

  return basePrompt
}

export async function POST(req: Request) {
  try {
    console.log('Qwen chat - Request received')
    const authHeader = req.headers.get('Authorization')
    console.log('Qwen chat - Auth header present:', !!authHeader)

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header must use Bearer scheme' },
        { status: 401 }
      )
    }

    const apiKey = authHeader.split(' ')[1]
    console.log('Qwen chat - API key present:', !!apiKey)

    if (!apiKey?.trim()) {
      return NextResponse.json(
        { error: 'Valid API key required' },
        { status: 401 }
      )
    }

    const { messages = [], model } = await req.json()
    console.log('Qwen chat - Request data:', {
      messagesCount: messages.length,
      model,
    })

    if (!VALID_MODELS.includes(model as (typeof VALID_MODELS)[number])) {
      console.log('Qwen chat - Invalid model:', model)
      return NextResponse.json(
        { error: `Invalid model. Valid options: ${VALID_MODELS.join(', ')}` },
        { status: 400 }
      )
    }

    console.log('Qwen chat - Creating OpenAI instance')
    const openai = new OpenAI({
      apiKey,
      baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    })

    const conversationHistory: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: getSystemPrompt(),
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

    console.log('Qwen chat - Creating completion with:', {
      model,
      messagesCount: conversationHistory.length,
    })

    const stream = await openai.chat.completions.create({
      model,
      messages: conversationHistory,
      stream: true,
      temperature: 0.4,
      max_tokens: 8192,
    })

    console.log('Qwen chat - Stream created successfully')

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          let isInThinking = false

          for await (const chunk of stream) {
            const chunkDelta = chunk.choices[0]?.delta as ExtendedDelta
            const chunkContent = chunkDelta?.content || ''
            const reasoningContent = chunkDelta?.reasoning_content || ''

            if (reasoningContent) {
              if (!isInThinking) {
                controller.enqueue(new TextEncoder().encode('<think>'))
                isInThinking = true
              }
              controller.enqueue(new TextEncoder().encode(reasoningContent))
            } else {
              if (isInThinking) {
                controller.enqueue(new TextEncoder().encode('</think>'))
                isInThinking = false
              }
              if (chunkContent) {
                controller.enqueue(new TextEncoder().encode(chunkContent))
              }
            }
          }

          if (isInThinking) {
            controller.enqueue(new TextEncoder().encode('</think>'))
          }

          controller.close()
        } catch (error) {
          console.error('Qwen chat - Stream error:', error)
          controller.error(error)
        }
      },
      cancel() {
        stream.controller.abort()
      },
    })

    console.log('Qwen chat - Returning response stream')
    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error: unknown) {
    console.error('Qwen chat - API Error:', error)

    if (error instanceof OpenAI.APIError) {
      console.error('Qwen chat - OpenAI error details:', {
        message: error.message,
        code: error.code,
        type: error.type,
        status: error.status,
      })
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
