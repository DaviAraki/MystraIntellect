export const CONFIG = {
  MODELS: {
    DEEPSEEK_CHAT: 'deepseek-chat',
    DEEPSEEK_REASONER: 'deepseek-reasoner',
    OPENAI_GPT4O_MINI: 'gpt-4o-mini',
    OPENAI_GPT4O: 'gpt-4o',
    QWEN_PLUS: 'qwen-plus',
    QWEN_MAX: 'qwen-max',
    QWEN_TURBO: 'qwen-turbo',
  },
  STORAGE: {
    DEEPSEEK_API_KEY: 'deepseek-api-key',
    OPENAI_API_KEY: 'openai-api-key',
    QWEN_API_KEY: 'qwen-api-key',
    ACTIVE_CHAT_ID: 'active-chat-id',
    CHAT_HISTORY: 'chat-history',
    CHATS: 'chats',
  },
  API: {
    BASE_URL: '/api',
    ENDPOINTS: {
      DEEPSEEK_CHAT: 'api/deepseek/chat',
      OPENAI_CHAT: 'api/openai/chat',
      QWEN_CHAT: 'api/qwen/chat',
      DEEPSEEK_VALIDATE_KEY: 'api/deepseek/validate-key',
      OPENAI_VALIDATE_KEY: 'api/openai/validate-key',
      QWEN_VALIDATE_KEY: 'api/qwen/validate-key',
    },
  },
  UI: {
    DEFAULT_BOT_MESSAGE: 'Hello! How can I help you today?',
  },
  DEFAULT_MODEL: 'deepseek-chat',
} as const

export type DeepSeekModel = 'deepseek-chat' | 'deepseek-reasoner'
export type OpenAIModel = 'gpt-4o-mini' | 'gpt-4o'
export type QwenModel = 'qwen-plus' | 'qwen-max' | 'qwen-turbo'
export type ModelType = DeepSeekModel | OpenAIModel | QwenModel

export const isDeepSeekModel = (model: string): model is DeepSeekModel => {
  return (
    model === CONFIG.MODELS.DEEPSEEK_CHAT ||
    model === CONFIG.MODELS.DEEPSEEK_REASONER
  )
}

export const isOpenAIModel = (model: string): model is OpenAIModel => {
  return (
    model === CONFIG.MODELS.OPENAI_GPT4O_MINI ||
    model === CONFIG.MODELS.OPENAI_GPT4O
  )
}

export const isQwenModel = (model: string): model is QwenModel => {
  return (
    model === CONFIG.MODELS.QWEN_PLUS ||
    model === CONFIG.MODELS.QWEN_MAX ||
    model === CONFIG.MODELS.QWEN_TURBO
  )
}
