'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useChatViewModel } from '@/viewmodels/ChatViewModel'
import { CONFIG, ModelType } from '@/config/constants'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MessageList } from '@/components/MessageList'
import { Menu, X } from 'lucide-react'

export default function ChatPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const {
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
    error,
    chats,
    activeChatId,
    switchChat,
    createNewChat,
    renameChat,
    deleteChat,
    canUseSelectedModel,
  } = useChatViewModel()

  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [activeProvider, setActiveProvider] = useState<'deepseek' | 'openai'>(
    'deepseek'
  )

  const handleProviderChange = (value: string) => {
    const provider = value as 'deepseek' | 'openai'
    setActiveProvider(provider)

    if (provider === 'deepseek') {
      setSelectedModel(CONFIG.MODELS.DEEPSEEK_CHAT)
    } else {
      setSelectedModel(CONFIG.MODELS.OPENAI_GPT4O_MINI)
    }
  }

  const handleModelChange = (value: string) => {
    setSelectedModel(value as ModelType)
  }

  const handleKeySubmit = async () => {
    if (await validateAndSetApiKey(apiKeyInput, activeProvider)) {
      setApiKeyInput('')
    }
  }

  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canUseSelectedModel()) {
      return
    }
    await handleSendMessage()
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleChatSelect = (chatId: string) => {
    switchChat(chatId)
    setIsSidebarOpen(false) // Close sidebar after selection on mobile
  }

  return (
    <div className='flex h-screen bg-gray-950 relative'>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className='lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-md'
      >
        {isSidebarOpen ? (
          <X className='h-6 w-6 text-gray-200' />
        ) : (
          <Menu className='h-6 w-6 text-gray-200' />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:relative w-64 h-full bg-gray-900 p-4 flex flex-col transition-transform duration-300 ease-in-out z-40`}
      >
        <Button
          onClick={createNewChat}
          className='mb-4 bg-green-600 hover:bg-green-700'
        >
          New Chat
        </Button>

        <div className='flex-1 overflow-y-auto'>
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`mb-2 p-2 rounded cursor-pointer ${
                chat.id === activeChatId ? 'bg-gray-700' : 'hover:bg-gray-800'
              }`}
            >
              {editingChatId === chat.id ? (
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => {
                    renameChat(chat.id, editingName)
                    setEditingChatId(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      renameChat(chat.id, editingName)
                      setEditingChatId(null)
                    }
                  }}
                  autoFocus
                />
              ) : (
                <div className='flex items-center justify-between'>
                  <span
                    onClick={() => handleChatSelect(chat.id)}
                    className='flex-1 truncate'
                  >
                    {chat.name}
                  </span>
                  <div className='flex space-x-2'>
                    <button
                      onClick={() => {
                        setEditingChatId(chat.id)
                        setEditingName(chat.name)
                      }}
                      className='text-gray-400 hover:text-white'
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => deleteChat(chat.id)}
                      className='text-gray-400 hover:text-red-500'
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className='mt-4 space-y-4'>
          <Select onValueChange={handleProviderChange} value={activeProvider}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select Provider' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='deepseek'>Deepseek</SelectItem>
              <SelectItem value='openai'>OpenAI</SelectItem>
            </SelectContent>
          </Select>

          <div className='space-y-2'>
            <Input
              type='password'
              placeholder={`${
                activeProvider.charAt(0).toUpperCase() + activeProvider.slice(1)
              } API Key`}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
            />
            <div className='flex space-x-2'>
              <Button
                onClick={handleKeySubmit}
                className='flex-1 bg-green-600 hover:bg-green-700'
                disabled={!apiKeyInput.trim()}
              >
                Set Key
              </Button>
              {isApiKeySet[activeProvider] && (
                <Button
                  onClick={() => clearApiKey(activeProvider)}
                  variant='destructive'
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          <Select onValueChange={handleModelChange} value={selectedModel}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select Model' />
            </SelectTrigger>
            <SelectContent>
              {activeProvider === 'deepseek' ? (
                <>
                  <SelectItem value={CONFIG.MODELS.DEEPSEEK_CHAT}>
                    Deepseek Chat
                  </SelectItem>
                  <SelectItem value={CONFIG.MODELS.DEEPSEEK_REASONER}>
                    Deepseek Reasoner
                  </SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value={CONFIG.MODELS.OPENAI_GPT4O_MINI}>
                    GPT-4o Mini
                  </SelectItem>
                  <SelectItem value={CONFIG.MODELS.OPENAI_GPT4O}>
                    GPT-4
                  </SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden'
          onClick={toggleSidebar}
        />
      )}

      {/* Main Content */}
      <div className='flex-1 flex flex-col w-full'>
        <div className='flex-1 overflow-hidden pt-16 lg:pt-0'>
          <MessageList messages={messages} isStreaming={isStreaming} />
        </div>

        {error && (
          <div className='p-4 bg-red-900 text-white'>Error: {error}</div>
        )}

        <form onSubmit={handleMessageSubmit} className='p-2 sm:p-4 bg-gray-900'>
          <div className='flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4'>
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder='Type your message...'
              className='flex-1 min-h-[80px] sm:min-h-0'
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleMessageSubmit(e)
                }
              }}
            />
            <Button
              type='submit'
              className='bg-green-600 hover:bg-green-700 w-full sm:w-24'
              disabled={
                !inputMessage.trim() || isStreaming || !canUseSelectedModel()
              }
            >
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
