export const CONFIG = {
  API: {
    BASE_URL: '/api/openai',
    ENDPOINTS: {
      CHAT: '/chat',
      VALIDATE_KEY: '/validate-key'
    }
  },
  STORAGE: {
    API_KEY: 'mystraIntellectApiKey'
  },
  MODELS: {
    GPT4_MINI: 'gpt-4o-mini',
    GPT4: 'gpt-4o'
  },
  UI: {
    DEFAULT_BOT_MESSAGE: 'Welcome to MystraIntellect!'
  }
} as const; 