import { useState, useCallback, useEffect } from 'react'
import { ChatService } from '@/services/ChatServices'
import { useMessages } from './useMessages'
import { Message } from '@/types'

interface OpenAIMessage {
  content: Array<{
    text: { value: string }
  }>
  role: 'user' | 'assistant'
}

export function useChat(apiKey: string) {
  const {
    addMessage,
    updateLastBotMessage,
    setIsStreaming,
    setMessages,
    activeChatId,
    setActiveChatId,
    clearChat,
    ...messageState
  } = useMessages()

  // Initialize threadIds from localStorage
  const [threadIds, setThreadIds] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedThreadIds = localStorage.getItem('chatThreadIds')
        if (savedThreadIds) {
          const parsedThreadIds = JSON.parse(savedThreadIds)
          return parsedThreadIds
        }
      } catch (error) {
        console.error('Error parsing thread IDs from localStorage:', error)
      }
      return {}
    }
    return {}
  })

  const [error, setError] = useState<string | null>(null)

  // Persist threadIds whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatThreadIds', JSON.stringify(threadIds))
    }
  }, [threadIds])

  const clearMessages = useCallback(
    (chatId: string) => {
      clearChat(chatId)
      // Clear thread ID for this chat
      setThreadIds((prev) => {
        const newThreadIds = { ...prev }
        delete newThreadIds[chatId]
        return newThreadIds
      })
    },
    [clearChat]
  )

  const loadThreadHistory = useCallback(
    async (chatId: string) => {
      const threadId = threadIds[chatId]
      if (!threadId || !apiKey) return

      try {
        const chatService = new ChatService(apiKey)
        const history = await chatService.getThreadHistory(threadId)

        const formattedMessages = history.messages.data.map(
          (msg: OpenAIMessage, index: number) => ({
            id: index + 1,
            text: msg.content.map((c) => c.text.value).join(''),
            sender: msg.role === 'user' ? 'user' : 'bot',
            formatted: true, // Add a flag to indicate the message is formatted
          })
        )

        // Ensure messages are properly sorted and formatted before setting
        setMessages(formattedMessages.reverse(), chatId)
      } catch (error) {
        setError(
          error instanceof Error ? error.message : 'Failed to load chat history'
        )
      }
    },
    [threadIds, apiKey, setMessages]
  )

  const sendMessage = useCallback(
    async (inputMessage: string, selectedModel: string) => {
      if (!inputMessage.trim() || !apiKey) return

      const userMessage: Message = {
        id: messageState.messages.length + 1,
        text: inputMessage,
        sender: 'user',
      }

      addMessage(userMessage, activeChatId)
      setError(null)

      try {
        const chatService = new ChatService(apiKey)
        const { threadId: newThreadId, stream } = await chatService.sendMessage(
          inputMessage,
          selectedModel,
          threadIds[activeChatId]
        )

        // Update thread ID for this chat
        setThreadIds((prev) => ({
          ...prev,
          [activeChatId]: newThreadId,
        }))

        const reader = stream.getReader()
        const decoder = new TextDecoder()

        const botMessage: Message = {
          id: messageState.messages.length + 2,
          text: '',
          sender: 'bot',
        }

        addMessage(botMessage, activeChatId)
        setIsStreaming(true)

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          updateLastBotMessage(chunk, activeChatId)
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : 'An unknown error occurred'
        )
      } finally {
        setIsStreaming(false)
      }
    },
    [
      apiKey,
      messageState.messages.length,
      threadIds,
      activeChatId,
      addMessage,
      updateLastBotMessage,
      setIsStreaming,
    ]
  )

  return {
    ...messageState,
    sendMessage,
    threadIds,
    error,
    loadThreadHistory,
    clearMessages,
    setActiveChatId,
    activeChatId,
    setIsStreaming,
  }
}
