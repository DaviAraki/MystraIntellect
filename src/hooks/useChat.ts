// hooks/useChat.ts
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

        // Get active chat ID or create a new one if none exists
        let chatId = localStorage.getItem(CONFIG.STORAGE.ACTIVE_CHAT_ID)
        if (!chatId) {
          chatId = `chat-${Date.now()}`
          localStorage.setItem(CONFIG.STORAGE.ACTIVE_CHAT_ID, chatId)
          localStorage.setItem(chatId, JSON.stringify([]))
        }
        setActiveChatId(chatId)

        // Load messages for active chat
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

  const createNewChat = useCallback(() => {
    const newChatId = `chat-${Date.now()}`
    localStorage.setItem(CONFIG.STORAGE.ACTIVE_CHAT_ID, newChatId)
    localStorage.setItem(newChatId, JSON.stringify([]))
    // Store default chat name
    localStorage.setItem(`${newChatId}-name`, 'New Chat')
    setActiveChatId(newChatId)
    setMessages([])
  }, [])

  const updateChatName = useCallback((chatId: string, newName: string) => {
    localStorage.setItem(`${chatId}-name`, newName)
  }, [])

  const switchChat = useCallback(
    (id: string) => {
      if (!id) {
        createNewChat()
        return
      }

      const chatData = localStorage.getItem(id)
      if (!chatData) {
        console.error('Chat not found:', id)
        createNewChat()
        return
      }

      localStorage.setItem(CONFIG.STORAGE.ACTIVE_CHAT_ID, id)
      setActiveChatId(id)
      try {
        const messages = JSON.parse(chatData)
        setMessages(messages)
      } catch (error) {
        console.error('Error parsing chat data:', error)
        setMessages([])
      }
    },
    [createNewChat]
  )

  const deleteChat = useCallback(
    (chatId: string) => {
      // Remove chat from localStorage
      localStorage.removeItem(chatId)

      // Get remaining chats, excluding system keys
      const remainingChats = Object.keys(localStorage)
        .filter((key) => key.startsWith('chat-'))
        .filter(
          (key) =>
            key !== CONFIG.STORAGE.ACTIVE_CHAT_ID &&
            key !== CONFIG.STORAGE.API_KEY
        )
        .sort()
        .reverse()

      if (remainingChats.length === 0) {
        // Only create new chat if no chats remain
        createNewChat()
      } else if (chatId === activeChatId) {
        // If we deleted the active chat, switch to the most recent one
        const mostRecentChat = remainingChats[0]
        switchChat(mostRecentChat)
      }
      // If we deleted an inactive chat, do nothing as the current chat is still valid
    },
    [activeChatId, createNewChat, switchChat]
  )

  const sendMessage = useCallback(
    async (message: string, model: string) => {
      try {
        setIsStreaming(true)
        setError(null)

        // Get current messages to ensure we have latest state
        const currentMessages = JSON.parse(
          localStorage.getItem(activeChatId) || '[]'
        )

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
          text: '',
          sender: 'bot',
          chatId: activeChatId,
          timestamp: Date.now(),
        }

        // Update state immediately
        const updatedMessages = [...currentMessages, userMessage, botMessage]
        setMessages(updatedMessages)
        localStorage.setItem(activeChatId, JSON.stringify(updatedMessages))

        // Prepare API messages
        const apiMessages = currentMessages
          .map((msg: Message) => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text,
          }))
          .concat({ role: 'user', content: message })

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
          localStorage.setItem(activeChatId, JSON.stringify(updated))
          return updated
        })
      } catch (error) {
        console.error('Chat error:', error)
        setError(
          error instanceof Error ? error.message : 'Failed to send message'
        )
        // Remove incomplete bot message on error
        setMessages((prev) => {
          const updated = prev.filter((msg) => msg.text !== '')
          localStorage.setItem(activeChatId, JSON.stringify(updated))
          return updated
        })
      } finally {
        setIsStreaming(false)
      }
    },
    [activeChatId]
  )

  // Add effect to reload messages when active chat changes
  useEffect(() => {
    if (activeChatId) {
      const savedMessages = JSON.parse(
        localStorage.getItem(activeChatId) || '[]'
      )
      setMessages(savedMessages)
    }
  }, [activeChatId])

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
    deleteChat,
    updateChatName,
    clearApiKey: () => {
      localStorage.removeItem(CONFIG.STORAGE.API_KEY)
      window.location.reload()
    },
  }
}
