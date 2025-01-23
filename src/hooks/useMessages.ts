import { useState, useCallback, useEffect } from 'react'
import { Message } from '@/types'
import { CONFIG } from '@/config/constants'

export function useMessages() {
  // Initialize messages from localStorage
  const [messagesByChat, setMessagesByChat] = useState<
    Record<string, Message[]>
  >(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedMessages = localStorage.getItem(CONFIG.STORAGE.MESSAGES)
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages)
          return parsedMessages
        }
      } catch (error) {
        console.error('Error parsing messages from localStorage:', error)
      }
      // Return default state if parsing fails or no saved messages
      return {
        '1': [{ id: 1, text: CONFIG.UI.DEFAULT_BOT_MESSAGE, sender: 'bot' }],
      }
    }
    return {
      '1': [{ id: 1, text: CONFIG.UI.DEFAULT_BOT_MESSAGE, sender: 'bot' }],
    }
  })

  const [activeChatId, setActiveChatId] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem('activeChatId')
      return savedId || '1'
    }
    return '1'
  })

  const [isStreaming, setIsStreaming] = useState(false)

  // Persist messages whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        CONFIG.STORAGE.MESSAGES,
        JSON.stringify(messagesByChat)
      )
    }
  }, [messagesByChat])

  // Persist active chat ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeChatId', activeChatId)
    }
  }, [activeChatId])

  // Get messages for current chat
  const messages = messagesByChat[activeChatId] || []

  const setMessages = useCallback(
    (newMessages: Message[], chatId?: string) => {
      setMessagesByChat((prev) => ({
        ...prev,
        [chatId || activeChatId]: newMessages,
      }))
    },
    [activeChatId]
  )

  const addMessage = useCallback(
    (message: Message, chatId?: string) => {
      setMessagesByChat((prev) => ({
        ...prev,
        [chatId || activeChatId]: [
          ...(prev[chatId || activeChatId] || []),
          message,
        ],
      }))
    },
    [activeChatId]
  )

  const updateLastBotMessage = useCallback(
    (text: string, chatId?: string) => {
      setMessagesByChat((prev) => {
        const currentMessages = prev[chatId || activeChatId] || []
        return {
          ...prev,
          [chatId || activeChatId]: currentMessages.map((msg, index) =>
            index === currentMessages.length - 1
              ? { ...msg, text: msg.text + text }
              : msg
          ),
        }
      })
    },
    [activeChatId]
  )

  const clearChat = useCallback((chatId: string) => {
    setMessagesByChat((prev) => {
      const newMessages = { ...prev }
      delete newMessages[chatId]
      return newMessages
    })
  }, [])

  return {
    messages,
    setMessages,
    addMessage,
    updateLastBotMessage,
    isStreaming,
    setIsStreaming,
    activeChatId,
    setActiveChatId,
    clearChat,
  }
}
