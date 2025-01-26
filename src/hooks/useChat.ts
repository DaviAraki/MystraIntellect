'use client'

import { useState, useEffect, useCallback } from 'react'
import { Message } from '@/types/message'
import { CONFIG } from '@/config/constants'

export function useChat() {
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [activeChatId, setActiveChatId] = useState('')
  const [inputMessage, setInputMessage] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiKeySet, setApiKeySet] = useState(false)

  useEffect(() => {
    const loadState = () => {
      try {
        const key = localStorage.getItem(CONFIG.STORAGE.API_KEY)
        setApiKeySet(!!key)

        const chatId = localStorage.getItem(CONFIG.STORAGE.ACTIVE_CHAT_ID) || ''
        setActiveChatId(chatId)

        const savedMessages = chatId
          ? JSON.parse(localStorage.getItem(`chat-${chatId}`) || '[]')
          : []
        setMessages(savedMessages)
      } catch (error) {
        console.error('Load error:', error)
      } finally {
        setLoading(false)
      }
    }

    loadState()
  }, [])

  const createNewChat = useCallback(() => {
    const newChatId = `chat-${Date.now()}`
    localStorage.setItem(CONFIG.STORAGE.ACTIVE_CHAT_ID, newChatId)
    setActiveChatId(newChatId)
    setMessages([])
  }, [])

  const switchChat = useCallback((id: string) => {
    localStorage.setItem(CONFIG.STORAGE.ACTIVE_CHAT_ID, id)
    setActiveChatId(id)
    setMessages(JSON.parse(localStorage.getItem(`chat-${id}`) || '[]'))
  }, [])

  const sendMessage = useCallback(
    async (message: string, model: string) => {
      try {
        setIsStreaming(true)
        setError(null)

        // Create user message
        const userMessage: Message = {
          id: Date.now(),
          text: message,
          sender: 'user',
          chatId: activeChatId,
          timestamp: Date.now(),
        }

        // Create temporary bot message
        const botMessage: Message = {
          id: Date.now() + 1,
          text: '', // Start with empty text
          sender: 'bot',
          chatId: activeChatId,
          timestamp: Date.now(),
        }

        // Update state immediately
        setMessages((prev) => {
          const updated = [...prev, userMessage, botMessage]
          localStorage.setItem(`chat-${activeChatId}`, JSON.stringify(updated))
          return updated
        })

        // Prepare API messages
        const apiMessages = messages
          .filter((msg) => msg.sender !== 'bot') // Remove previous bot responses
          .map((msg) => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text,
          }))

        // Add new user message to history
        apiMessages.push({ role: 'user', content: message })

        // Get API key
        const apiKey = localStorage.getItem(CONFIG.STORAGE.API_KEY) || ''

        // API Request
        const response = await fetch('/api/deepseek/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            messages: apiMessages,
            model,
          }),
        })

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`)
        if (!response.body) throw new Error('No response body')

        // Stream processing
        const reader = response.body.getReader()
        let responseText = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          responseText += new TextDecoder().decode(value)
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1]
            return lastMessage.sender === 'bot'
              ? [...prev.slice(0, -1), { ...lastMessage, text: responseText }]
              : [...prev, { ...botMessage, text: responseText }]
          })
        }

        // Final update with complete response
        setMessages((prev) => {
          const updated = prev.map((msg) =>
            msg.id === botMessage.id ? { ...msg, text: responseText } : msg
          )
          localStorage.setItem(`chat-${activeChatId}`, JSON.stringify(updated))
          return updated
        })
      } catch (error) {
        console.error('Chat error:', error)
        setError(
          error instanceof Error ? error.message : 'Failed to send message'
        )
        // Remove incomplete bot message on error
        setMessages((prev) => prev.filter((msg) => msg.text !== ''))
      } finally {
        setIsStreaming(false)
      }
    },
    [activeChatId, messages]
  )

  return {
    loading,
    messages,
    inputMessage,
    setInputMessage,
    sendMessage,
    isStreaming,
    error,
    apiKeySet,
    activeChatId,
    createNewChat,
    switchChat,
    clearApiKey: () => {
      localStorage.removeItem(CONFIG.STORAGE.API_KEY)
      window.location.reload()
    },
  }
}
