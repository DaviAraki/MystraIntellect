import { CONFIG } from '@/config/constants'
import { ChatMessage } from '@/types/message'

export class ChatService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async sendMessage(messages: ChatMessage[], model: string) {
    const response = await fetch(CONFIG.API.ENDPOINTS.CHAT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        messages,
        model,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API Error: ${error.slice(0, 200)}`)
    }

    return response.body
  }

  static async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(CONFIG.API.ENDPOINTS.VALIDATE_KEY, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
      return response.status === 200
    } catch (error) {
      return false
    }
  }
}
