export interface Message {
  role: 'user' | 'assistant'
  content: string
  id?: number
  timestamp?: number
  formatted?: boolean
}

export type ChatMessage = Message
