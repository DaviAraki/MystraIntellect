export interface Message {
  id: number
  text: string
  sender: 'user' | 'bot'
  chatId: string
  timestamp: number
  formatted?: boolean
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface CodeFile {
  content: string
  language?: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
}
