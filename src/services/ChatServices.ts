import { CONFIG } from '@/config/constants'
import { ChatMessage } from '@/types'
import { isDeepSeekModel, isOpenAIModel, isQwenModel } from '@/config/constants'

export class ChatService {
  private apiKey: string
  private provider: 'deepseek' | 'openai' | 'qwen'

  constructor(apiKey: string, provider: 'deepseek' | 'openai' | 'qwen') {
    this.apiKey = apiKey
    this.provider = provider
  }

  async sendMessage(messages: ChatMessage[], model: string, threadId?: string) {
    const isOpenAI = isOpenAIModel(model)
    const endpoint = isDeepSeekModel(model)
      ? CONFIG.API.ENDPOINTS.DEEPSEEK_CHAT
      : isOpenAIModel(model)
      ? CONFIG.API.ENDPOINTS.OPENAI_CHAT
      : CONFIG.API.ENDPOINTS.QWEN_CHAT

    console.log('ChatService sendMessage - Starting request:', {
      provider: this.provider,
      model,
      endpoint,
      hasApiKey: !!this.apiKey,
      messagesCount: messages.length,
      threadId,
    })

    const requestBody = {
      messages,
      model,
      ...(isOpenAI && threadId ? { threadId } : {}),
    }
    console.log('ChatService sendMessage - Request body:', requestBody)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    console.log('ChatService sendMessage - Response:', {
      ok: response.ok,
      status: response.status,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('ChatService sendMessage - Error response:', error)
      throw new Error(`API Error: ${error.slice(0, 200)}`)
    }

    return response.body
  }

  static async validateApiKey(
    apiKey: string,
    provider: 'deepseek' | 'openai' | 'qwen'
  ): Promise<boolean> {
    try {
      console.log('ChatService validateApiKey:', {
        provider,
        hasApiKey: !!apiKey,
      })

      const endpoint =
        provider === 'deepseek'
          ? CONFIG.API.ENDPOINTS.DEEPSEEK_VALIDATE_KEY
          : provider === 'openai'
          ? CONFIG.API.ENDPOINTS.OPENAI_VALIDATE_KEY
          : CONFIG.API.ENDPOINTS.QWEN_VALIDATE_KEY

      console.log('ChatService validation endpoint:', endpoint)

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      const isValid = response.status === 200
      console.log('ChatService validation result:', {
        status: response.status,
        isValid,
      })

      return isValid
    } catch (error) {
      console.error('ChatService validation error:', error)
      return false
    }
  }

  static getProviderForModel(model: string): 'deepseek' | 'openai' | 'qwen' {
    if (isDeepSeekModel(model)) return 'deepseek'
    if (isOpenAIModel(model)) return 'openai'
    if (isQwenModel(model)) return 'qwen'
    throw new Error(`Unknown model: ${model}`)
  }
}
