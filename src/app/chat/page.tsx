'use client'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useChat } from '@/hooks/useChat'
import { CONFIG } from '@/config/constants'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MessageList } from '@/components/MessageList'

type DeepSeekModel =
  | typeof CONFIG.MODELS.DEEPSEEK_CHAT
  | typeof CONFIG.MODELS.DEEPSEEK_REASONER

export default function ChatPage() {
  const {
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
    clearApiKey,
  } = useChat()

  const [localChats, setLocalChats] = useState<{ id: string; name: string }[]>(
    []
  )
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [selectedModel, setSelectedModel] = useState<DeepSeekModel>(
    CONFIG.MODELS.DEEPSEEK_REASONER
  )

  useEffect(() => {
    const loadChats = () => {
      const chats = Object.keys(localStorage)
        .filter((key) => key.startsWith('chat-') && !key.endsWith('-name'))
        .filter(
          (key) =>
            key !== CONFIG.STORAGE.ACTIVE_CHAT_ID &&
            key !== CONFIG.STORAGE.API_KEY
        )
        .map((key) => {
          try {
            // Get custom name if exists, otherwise use date
            const customName = localStorage.getItem(`${key}-name`)
            return {
              id: key,
              name:
                customName ||
                new Date(parseInt(key.replace('chat-', ''))).toLocaleString(),
            }
          } catch (error) {
            console.error('Error parsing chat:', key, error)
            return null
          }
        })
        .filter((chat): chat is { id: string; name: string } => chat !== null)
        .sort((a, b) => {
          const timeA = parseInt(a.id.replace('chat-', ''))
          const timeB = parseInt(b.id.replace('chat-', ''))
          return timeB - timeA
        })
      setLocalChats(chats)
    }

    loadChats()
  }, [activeChatId])

  const handleDeleteChat = useCallback(
    (chatId: string) => {
      if (confirm('Are you sure you want to delete this chat?')) {
        deleteChat(chatId)
        localStorage.removeItem(`${chatId}-name`) // Remove chat name
        setLocalChats((prev) => prev.filter((chat) => chat.id !== chatId))
      }
    },
    [deleteChat]
  )

  const handleUpdateChatName = useCallback(
    (chatId: string, newName: string) => {
      updateChatName(chatId, newName)
      setLocalChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId ? { ...chat, name: newName } : chat
        )
      )
      setEditingChatId(null)
    },
    [updateChatName]
  )

  const chatList = useMemo(
    () =>
      localChats.map((chat) => (
        <div
          key={chat.id}
          className={`group p-2 hover:bg-gray-800 cursor-pointer ${
            chat.id === activeChatId ? 'bg-gray-800' : ''
          }`}
          onClick={(e) => {
            e.preventDefault()
            if (!editingChatId) {
              switchChat(chat.id)
            }
          }}
        >
          <div className='flex justify-between items-center'>
            {editingChatId === chat.id ? (
              <input
                type='text'
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleUpdateChatName(chat.id, editingName)
                  } else if (e.key === 'Escape') {
                    setEditingChatId(null)
                  }
                }}
                onBlur={() => handleUpdateChatName(chat.id, editingName)}
                className='bg-transparent border-none focus:outline-none text-green-400 w-full'
                autoFocus
              />
            ) : (
              <span
                className='truncate flex-grow'
                onDoubleClick={(e) => {
                  e.preventDefault()
                  setEditingChatId(chat.id)
                  setEditingName(chat.name)
                }}
              >
                {chat.name}
              </span>
            )}
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleDeleteChat(chat.id)
              }}
              className='text-red-500 opacity-0 group-hover:opacity-100 transition-opacity px-2 hover:text-red-400'
              title='Delete chat'
              aria-label='Delete chat'
            >
              ×
            </button>
          </div>
        </div>
      )),
    [
      localChats,
      activeChatId,
      handleDeleteChat,
      switchChat,
      editingChatId,
      editingName,
      handleUpdateChatName,
    ]
  )

  const handleModelChange = (value: string) => {
    if (
      [CONFIG.MODELS.DEEPSEEK_CHAT, CONFIG.MODELS.DEEPSEEK_REASONER].includes(
        value as DeepSeekModel
      )
    ) {
      setSelectedModel(value as DeepSeekModel)
    }
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen bg-black'>
        <div className='text-gray-400'>Loading chat...</div>
      </div>
    )
  }

  if (!apiKeySet) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-black'>
        <div className='w-full max-w-md p-4'>
          <p className='mb-2 text-sm text-gray-400'>
            Your API key is stored locally and never sent to our servers.
          </p>
          <div className='flex gap-2'>
            <Input
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder='Enter your DeepSeek API key'
              type='password'
              className='flex-grow'
            />
            <Button
              onClick={() => {
                localStorage.setItem(CONFIG.STORAGE.API_KEY, apiKeyInput)
                window.location.reload()
              }}
              disabled={!apiKeyInput.trim()}
            >
              Submit
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-screen bg-black text-green-400 font-mono'>
      <div className='w-64 border-r border-gray-800 flex flex-col'>
        <div className='p-4 border-b border-gray-800'>
          <Button className='w-full' onClick={createNewChat}>
            New Chat
          </Button>
        </div>
        <div className='flex-1 overflow-y-auto'>{chatList}</div>
      </div>

      <div className='flex-1 flex flex-col'>
        <header className='p-4 border-b border-gray-800 flex justify-between items-center'>
          <div className='flex items-center gap-4'>
            <h1 className='text-2xl font-bold'>MystraIntellect</h1>
            <Select value={selectedModel} onValueChange={handleModelChange}>
              <SelectTrigger className='w-[200px]'>
                <SelectValue placeholder='Select Model' />
              </SelectTrigger>
              <SelectContent className='bg-black border-gray-800'>
                <SelectItem
                  value={CONFIG.MODELS.DEEPSEEK_CHAT}
                  className='text-green-400 hover:bg-gray-800'
                >
                  DeepSeek Chat
                </SelectItem>
                <SelectItem
                  value={CONFIG.MODELS.DEEPSEEK_REASONER}
                  className='text-green-400 hover:bg-gray-800'
                >
                  DeepSeek Reasoner
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={clearApiKey} className='bg-red-600 hover:bg-red-700'>
            Clear API Key
          </Button>
        </header>

        <main className='flex-1 overflow-y-auto p-4'>
          <MessageList
            key={activeChatId}
            messages={messages}
            isStreaming={isStreaming}
          />
        </main>

        <form
          className='p-4 border-t border-gray-800'
          onSubmit={async (e) => {
            e.preventDefault()
            if (!inputMessage.trim() || isStreaming) return
            await sendMessage(inputMessage, selectedModel)
            setInputMessage('')
          }}
        >
          <div className='flex gap-2'>
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (!inputMessage.trim() || isStreaming) return
                  sendMessage(inputMessage, selectedModel)
                  setInputMessage('')
                }
              }}
              placeholder='Type your message... (Shift + Enter for new line)'
              disabled={isStreaming}
              rows={1}
              className='min-h-[40px]'
            />
            <Button
              type='submit'
              disabled={!inputMessage.trim() || isStreaming}
            >
              {isStreaming ? 'Sending...' : 'Send'}
            </Button>
          </div>
          {error && <p className='text-red-500 text-sm mt-2'>{error}</p>}
        </form>
      </div>
    </div>
  )
}
