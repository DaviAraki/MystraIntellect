import { CONFIG } from '@/config/constants'
import { ChatMessage } from '@/types/message'
import { isDeepSeekModel, isOpenAIModel } from '@/config/constants'

export class ChatService {
  private apiKey: string
  private provider: 'deepseek' | 'openai'

  constructor(apiKey: string, provider: 'deepseek' | 'openai') {
    this.apiKey = apiKey
    this.provider = provider
  }

  async sendMessage(messages: ChatMessage[], model: string) {
    const endpoint = isDeepSeekModel(model)
      ? CONFIG.API.ENDPOINTS.DEEPSEEK_CHAT
      : CONFIG.API.ENDPOINTS.OPENAI_CHAT

    const response = await fetch(endpoint, {
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

  static async validateApiKey(
    apiKey: string,
    provider: 'deepseek' | 'openai'
  ): Promise<boolean> {
    try {
      const endpoint =
        provider === 'deepseek'
          ? CONFIG.API.ENDPOINTS.DEEPSEEK_VALIDATE_KEY
          : CONFIG.API.ENDPOINTS.OPENAI_VALIDATE_KEY

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
      return response.status === 200
    } catch (error) {
      return false
    }
  }

  static getProviderForModel(model: string): 'deepseek' | 'openai' {
    if (isDeepSeekModel(model)) return 'deepseek'
    if (isOpenAIModel(model)) return 'openai'
    throw new Error(`Unknown model: ${model}`)
  }
}
