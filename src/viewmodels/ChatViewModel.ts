import { useState, useCallback, useEffect } from 'react'
import { useApiKey } from '@/hooks/useApiKey'
import { useChat } from '@/hooks/useChat'
import { CONFIG } from '@/config/constants'
import { ModelType } from '@/config/constants'

interface Chat {
  id: string
  name: string
  threadId?: string
}

export function useChatViewModel() {
  const [chats, setChats] = useState<Chat[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedChats = localStorage.getItem(CONFIG.STORAGE.CHATS)
        if (savedChats) {
          const parsedChats = JSON.parse(savedChats)
          return parsedChats
        }
      } catch (error) {
        console.error('Error parsing chats from localStorage:', error)
      }
      return [{ id: '1', name: 'New Chat' }]
    }
    return [{ id: '1', name: 'New Chat' }]
  })

  const [inputMessage, setInputMessage] = useState('')
  const [selectedModel, setSelectedModel] = useState<ModelType>(
    CONFIG.MODELS.DEEPSEEK_CHAT
  )

  const {
    apiKeys,
    isApiKeySet,
    error: apiKeyError,
    validateAndSetApiKey,
    clearApiKey,
  } = useApiKey()

  const {
    messages,
    isStreaming,
    sendMessage,
    error: chatError,
    loadThreadHistory,
    setActiveChatId,
    activeChatId,
    clearMessages,
    setIsStreaming,
  } = useChat()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CONFIG.STORAGE.CHATS, JSON.stringify(chats))
    }
  }, [chats])

  const createNewChat = useCallback(() => {
    const newChat: Chat = {
      id: Date.now().toString(),
      name: 'New Chat',
    }
    setChats((prev) => [...prev, newChat])
    setActiveChatId(newChat.id)
    clearMessages(newChat.id)
  }, [setActiveChatId, clearMessages])

  const handleSendMessage = useCallback(async () => {
    if (inputMessage.trim()) {
      const messageToSend = inputMessage
      setInputMessage('') // Clear input immediately
      await sendMessage(messageToSend, selectedModel)
    }
  }, [inputMessage, selectedModel, sendMessage, setInputMessage])

  const switchChat = useCallback(
    (chatId: string) => {
      setActiveChatId(chatId)
      loadThreadHistory(chatId)
    },
    [setActiveChatId, loadThreadHistory]
  )

  const renameChat = useCallback((chatId: string, newName: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? { ...chat, name: newName.trim() || 'Untitled Chat' }
          : chat
      )
    )
  }, [])

  const deleteChat = useCallback(
    (chatId: string) => {
      setChats((prev) => prev.filter((chat) => chat.id !== chatId))

      // If we're deleting the active chat, switch to another chat
      if (chatId === activeChatId) {
        const remainingChats = chats.filter((chat) => chat.id !== chatId)
        if (remainingChats.length > 0) {
          switchChat(remainingChats[0].id)
        } else {
          // If no chats remain, create a new one
          createNewChat()
        }
      }
    },
    [activeChatId, chats, switchChat, createNewChat]
  )

  const canUseSelectedModel = useCallback(() => {
    const provider = selectedModel.startsWith('deepseek')
      ? 'deepseek'
      : 'openai'
    return isApiKeySet[provider]
  }, [selectedModel, isApiKeySet])

  return {
    messages,
    isStreaming,
    handleSendMessage,
    inputMessage,
    setInputMessage,
    isApiKeySet,
    validateAndSetApiKey,
    clearApiKey,
    selectedModel,
    setSelectedModel,
    error: apiKeyError || chatError,
    loadThreadHistory,
    chats,
    activeChatId,
    switchChat,
    createNewChat,
    renameChat,
    deleteChat,
    setIsStreaming,
    canUseSelectedModel,
    apiKeys,
  }
}
