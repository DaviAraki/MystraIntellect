'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    clearApiKey,
  } = useChat()

  const [localChats, setLocalChats] = useState<
    Array<{ id: string; name: string }>
  >([])
  const [apiKeyInput, setApiKeyInput] = useState('')

  // Load chat list
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const chats = Object.keys(localStorage)
        .filter((key) => key.startsWith('chat-'))
        .map((key) => ({
          id: key,
          name: new Date(parseInt(key.split('-')[1])).toLocaleString(),
        }))
      setLocalChats(chats)
    }
  }, [activeChatId])

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
      {/* Chat List Sidebar */}
      <div className='w-64 border-r border-gray-800 flex flex-col'>
        <div className='p-4 border-b border-gray-800'>
          <Button className='w-full' onClick={createNewChat}>
            New Chat
          </Button>
        </div>
        <div className='flex-1 overflow-y-auto'>
          {localChats.map((chat) => (
            <div
              key={chat.id}
              className={`p-2 hover:bg-gray-800 cursor-pointer ${
                chat.id === activeChatId ? 'bg-gray-800' : ''
              }`}
              onClick={() => switchChat(chat.id)}
            >
              {chat.name}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className='flex-1 flex flex-col'>
        <header className='p-4 border-b border-gray-800 flex justify-between items-center'>
          <div className='flex items-center gap-4'>
            <h1 className='text-2xl font-bold'>MystraIntellect</h1>
            <Select defaultValue={CONFIG.MODELS.DEEPSEEK_CHAT}>
              <SelectTrigger className='w-[200px]'>
                <SelectValue placeholder='Select Model' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CONFIG.MODELS.DEEPSEEK_CHAT}>
                  DeepSeek Chat
                </SelectItem>
                <SelectItem value={CONFIG.MODELS.DEEPSEEK_REASONER}>
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
          <MessageList messages={messages} isStreaming={isStreaming} />
        </main>

        <form
          className='p-4 border-t border-gray-800'
          onSubmit={async (e) => {
            e.preventDefault()
            if (!inputMessage.trim()) return
            await sendMessage(inputMessage, CONFIG.MODELS.DEEPSEEK_CHAT)
            setInputMessage('')
          }}
        >
          <div className='flex gap-2'>
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder='Type your message...'
              disabled={isStreaming}
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
