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
