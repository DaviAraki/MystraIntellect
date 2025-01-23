export interface Message {
  id: number
  text: string
  sender: 'user' | 'bot'
}

export interface CodeFile {
  content: string
  language?: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
}
