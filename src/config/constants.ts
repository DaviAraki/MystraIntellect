export const CONFIG = {
  MODELS: {
    DEEPSEEK_CHAT: 'deepseek-chat',
    DEEPSEEK_REASONER: 'deepseek-reasoner',
  },
  STORAGE: {
    API_KEY: 'deepseek-api-key',
    ACTIVE_CHAT_ID: 'active-chat-id',
    CHAT_HISTORY: 'chat-history',
    CHATS: 'chats',
  },
  API: {
    BASE_URL: '/api',
    ENDPOINTS: {
      CHAT: '/deepseek/chat',
      VALIDATE_KEY: '/validate-key',
    },
  },
  UI: {
    DEFAULT_BOT_MESSAGE: 'Hello! How can I help you today?',
  },
  DEFAULT_MODEL: 'deepseek-chat',
} as const

export type DeepSeekModel = (typeof CONFIG.MODELS)[keyof typeof CONFIG.MODELS]
