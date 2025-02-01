import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface OpenAIError extends Error {
  status?: number
  code?: string
  param?: string
  type?: string
}

const ASSISTANT_INSTRUCTIONS = `
You are an expert software developer AI assistant. Your primary focus is on helping with coding, software architecture, best practices, and problem-solving in various programming languages and frameworks. 
- Provide concise, accurate, and efficient solutions.
- Explain complex concepts clearly and suggest improvements when appropriate.
- Be aware of modern development practices, design patterns, and performance considerations.
- If asked about a specific technology, framework, or language, tailor your responses accordingly.
- When providing code solutions, specify the file names for each code block using the format: [filename: file name] inside the markdown text on code block.
- If multiple files are needed, provide them in separate code blocks with their respective filenames.
- Follow the rules of clean code, DRY, KISS and SOLID principles.
`

// Cache for storing assistant IDs
let cachedAssistantId: string | null = null

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get('Authorization')?.split(' ')[1]
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      )
    }

    const { threadId, messages, model } = await req.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          details: { message: 'Messages must be a non-empty array' },
        },
        { status: 400 }
      )
    }

    const lastMessage = messages[messages.length - 1]
    if (
      !lastMessage ||
      typeof lastMessage.content !== 'string' ||
      lastMessage.content.trim() === ''
    ) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          details: { message: 'Last message must have non-empty content' },
        },
        { status: 400 }
      )
    }

    const openai = new OpenAI({ apiKey })

    // Get or create assistant
    let assistantId = cachedAssistantId
    if (!assistantId) {
      const assistant = await openai.beta.assistants.create({
        instructions: ASSISTANT_INSTRUCTIONS,
        name: 'Mystra',
        tools: [{ type: 'code_interpreter' }],
        model: model ?? 'gpt-4o-mini',
      })
      assistantId = assistant.id
      cachedAssistantId = assistantId
    }

    try {
      // Get or create thread
      const thread = threadId
        ? await openai.beta.threads.retrieve(threadId)
        : await openai.beta.threads.create()

      // Add the new message to the thread
      await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: lastMessage.content,
      })

      // Create and run the assistant
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistantId,
      })

      // Set up streaming response
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Send thread ID first
            controller.enqueue(JSON.stringify({ threadId: thread.id }) + '\n')

            // Helper function to get run status
            const checkRunStatus = async () => {
              const runStatus = await openai.beta.threads.runs.retrieve(
                thread.id,
                run.id
              )
              return runStatus.status
            }

            // Helper function to get messages
            const getNewMessages = async () => {
              const messages = await openai.beta.threads.messages.list(
                thread.id,
                {
                  limit: 1,
                  order: 'desc',
                }
              )
              return messages.data[0]
            }

            // Poll for completion
            while (true) {
              const status = await checkRunStatus()

              if (status === 'completed') {
                const message = await getNewMessages()
                if (message.role === 'assistant') {
                  if (Array.isArray(message.content)) {
                    for (const content of message.content) {
                      if (content.type === 'text') {
                        controller.enqueue(content.text.value)
                      }
                    }
                  }
                }
                break
              } else if (
                status === 'failed' ||
                status === 'cancelled' ||
                status === 'expired'
              ) {
                throw new Error(`Run ${status}`)
              }

              // Wait before next poll
              await new Promise((resolve) => setTimeout(resolve, 1000))
            }

            controller.close()
          } catch (error) {
            console.error('Streaming error:', error)
            controller.error(error)
          }
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      })
    } catch (error: unknown) {
      const openaiError = error as OpenAIError
      console.error('OpenAI API error:', openaiError)
      return NextResponse.json(
        {
          error: 'Error communicating with OpenAI API',
          details: openaiError.message,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Server error:', error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Internal Server Error: ${error.message}` },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: 'Internal Server Error: Unknown error' },
      { status: 500 }
    )
  }
}
