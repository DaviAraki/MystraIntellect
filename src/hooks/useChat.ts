// hooks/useChat.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Message } from '@/types/message'
import { CONFIG } from '@/config/constants'
import { ChatService } from '@/services/ChatServices'
import { useApiKey } from '@/hooks/useApiKey'

export function useChat() {
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [activeChatId, setActiveChatId] = useState('')
  const [inputMessage, setInputMessage] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { apiKeys, isApiKeySet } = useApiKey()

  useEffect(() => {
    const loadState = () => {
      try {
        let chatId = localStorage.getItem(CONFIG.STORAGE.ACTIVE_CHAT_ID)
        if (!chatId) {
          chatId = `chat-${Date.now()}`
          localStorage.setItem(CONFIG.STORAGE.ACTIVE_CHAT_ID, chatId)
          localStorage.setItem(chatId, JSON.stringify([]))
        }
        setActiveChatId(chatId)
        const savedMessages = JSON.parse(localStorage.getItem(chatId) || '[]')
        setMessages(savedMessages)
      } catch (error) {
        console.error('Load error:', error)
      } finally {
        setLoading(false)
      }
    }

    loadState()
  }, [])

  const sendMessage = useCallback(
    async (content: string, model: string) => {
      if (!content.trim()) return

      const provider = ChatService.getProviderForModel(model)
      if (!isApiKeySet[provider]) {
        setError(`Please set your ${provider} API key first`)
        return
      }

      const userMessage: Message = {
        role: 'user',
        content,
        timestamp: Date.now(),
      }

      // Update messages with user message
      setMessages((prev) => {
        const newMessages = [...prev, userMessage]
        localStorage.setItem(activeChatId, JSON.stringify(newMessages))
        return newMessages
      })

      try {
        setIsStreaming(true)
        setError(null)

        const chatService = new ChatService(apiKeys[provider], provider)
        const response = await chatService.sendMessage(
          [...messages, userMessage],
          model
        )

        if (!response) {
          throw new Error('No response from API')
        }

        const reader = response.getReader()
        const decoder = new TextDecoder()
        let assistantMessage = ''

        // Add initial assistant message
        const initialAssistantMessage: Message = {
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
        }

        setMessages((prev) => {
          const newMessages = [...prev, initialAssistantMessage]
          return newMessages
        })

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          assistantMessage += chunk

          // Update the last message content
          setMessages((prev) => {
            const newMessages = [...prev]
            if (newMessages.length > 0) {
              newMessages[newMessages.length - 1] = {
                ...newMessages[newMessages.length - 1],
                content: assistantMessage,
              }
            }
            return newMessages
          })
        }

        // Save final messages to localStorage
        setMessages((prev) => {
          localStorage.setItem(activeChatId, JSON.stringify(prev))
          return prev
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        // Remove the last assistant message if there was an error
        setMessages((prev) => {
          const newMessages = prev.slice(0, -1)
          localStorage.setItem(activeChatId, JSON.stringify(newMessages))
          return newMessages
        })
      } finally {
        setIsStreaming(false)
      }
    },
    [activeChatId, apiKeys, isApiKeySet, messages]
  )

  const loadThreadHistory = useCallback((chatId: string) => {
    try {
      const savedMessages = JSON.parse(localStorage.getItem(chatId) || '[]')
      setMessages(savedMessages)
    } catch (error) {
      console.error('Error loading thread history:', error)
      setError('Failed to load chat history')
    }
  }, [])

  const clearMessages = useCallback((chatId: string) => {
    setMessages([])
    localStorage.setItem(chatId, JSON.stringify([]))
  }, [])

  return {
    loading,
    messages,
    error,
    isStreaming,
    sendMessage,
    inputMessage,
    setInputMessage,
    activeChatId,
    setActiveChatId,
    loadThreadHistory,
    clearMessages,
    setIsStreaming,
  }
}
