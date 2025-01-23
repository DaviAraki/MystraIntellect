import { CONFIG } from '@/config/constants'

export class ChatService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async sendMessage(message: string, model: string, threadId?: string) {
    const assistantId = localStorage.getItem(CONFIG.STORAGE.ASSISTANT_ID)

    const response = await fetch('/api/openai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'X-Assistant-Id': assistantId || '',
      },
      body: JSON.stringify({
        message,
        model,
        threadId,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to send message')
    }

    const stream = response.body
    if (!stream) {
      throw new Error('No response stream received')
    }

    // Get threadId from the first line of the stream
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    const { value, done } = await reader.read()
    if (done) throw new Error('Stream ended unexpectedly')

    const firstLine = decoder.decode(value).split('\n')[0]
    const { threadId: newThreadId } = JSON.parse(firstLine)

    return {
      threadId: newThreadId,
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue(value)
          reader
            .read()
            .then(function processText({
              done,
              value,
            }: ReadableStreamReadResult<Uint8Array>): Promise<void> | void {
              if (done) {
                controller.close()
                return
              }
              controller.enqueue(value)
              return reader.read().then(processText)
            })
        },
        cancel() {
          reader.cancel()
        },
      }),
    }
  }

  async getThreadHistory(threadId: string) {
    const response = await fetch(`/api/openai/chat?threadId=${threadId}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to load thread history')
    }

    return response.json()
  }

  static async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${CONFIG.API.BASE_URL}${CONFIG.API.ENDPOINTS.VALIDATE_KEY}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      )

      if (!response.ok) {
        return false
      }

      const data = await response.json()
      return data.valid
    } catch (error) {
      console.error('Error validating API key:', error)
      return false
    }
  }
}
