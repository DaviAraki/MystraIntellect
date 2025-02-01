'use client'
import { useState, useCallback, memo } from 'react'
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

// Memoized Chat List Item Component
const ChatListItem = memo(
  ({
    chat,
    isActive,
    onSelect,
    onRename,
    onDelete,
  }: {
    chat: { id: string; name: string }
    isActive: boolean
    onSelect: (id: string) => void
    onRename: (id: string, name: string) => void
    onDelete: (id: string) => void
  }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState(chat.name)

    const handleRename = () => {
      onRename(chat.id, editName)
      setIsEditing(false)
    }

    return (
      <div
        className={`mb-2 p-2 rounded cursor-pointer ${
          isActive ? 'bg-gray-700' : 'hover:bg-gray-800'
        }`}
      >
        {isEditing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
            }}
            autoFocus
          />
        ) : (
          <div className='flex items-center justify-between'>
            <span onClick={() => onSelect(chat.id)} className='flex-1 truncate'>
              {chat.name}
            </span>
            <div className='flex space-x-2'>
              <button
                onClick={() => setIsEditing(true)}
                className='text-gray-400 hover:text-white'
              >
                ✎
              </button>
              <button
                onClick={() => onDelete(chat.id)}
                className='text-gray-400 hover:text-red-500'
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }
)
ChatListItem.displayName = 'ChatListItem'

// Memoized Sidebar Component
const Sidebar = memo(
  ({
    isOpen,
    onClose,
    children,
  }: {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
  }) => {
    return (
      <>
        <div
          className={`${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:relative w-64 h-full bg-gray-900 p-4 flex flex-col transition-transform duration-300 ease-in-out z-40`}
        >
          {children}
        </div>
        {isOpen && (
          <div
            className='fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden'
            onClick={onClose}
          />
        )}
      </>
    )
  }
)
Sidebar.displayName = 'Sidebar'

// Memoized Model Selector Component
const ModelSelector = memo(
  ({
    activeProvider,
    selectedModel,
    onProviderChange,
    onModelChange,
  }: {
    activeProvider: 'deepseek' | 'openai' | 'qwen'
    selectedModel: ModelType
    onProviderChange: (value: string) => void
    onModelChange: (value: string) => void
  }) => {
    return (
      <div className='space-y-4'>
        <Select onValueChange={onProviderChange} value={activeProvider}>
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Select Provider' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='deepseek'>Deepseek</SelectItem>
            <SelectItem value='openai'>OpenAI</SelectItem>
            <SelectItem value='qwen'>Qwen</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={onModelChange} value={selectedModel}>
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
            ) : activeProvider === 'openai' ? (
              <>
                <SelectItem value={CONFIG.MODELS.OPENAI_GPT4O_MINI}>
                  GPT-4o Mini
                </SelectItem>
                <SelectItem value={CONFIG.MODELS.OPENAI_GPT4O}>
                  GPT-4
                </SelectItem>
              </>
            ) : (
              <>
                <SelectItem value={CONFIG.MODELS.QWEN_TURBO}>
                  Qwen Turbo
                </SelectItem>
                <SelectItem value={CONFIG.MODELS.QWEN_PLUS}>
                  Qwen Plus
                </SelectItem>
                <SelectItem value={CONFIG.MODELS.QWEN_MAX}>Qwen Max</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>
    )
  }
)
ModelSelector.displayName = 'ModelSelector'

// Memoized Key Management Component
const KeyManagement = memo(
  ({
    activeProvider,
    apiKeyInput,
    onApiKeyChange,
    onKeySubmit,
    onKeyClear,
    isKeySet,
  }: {
    activeProvider: 'deepseek' | 'openai' | 'qwen'
    apiKeyInput: string
    onApiKeyChange: (value: string) => void
    onKeySubmit: () => void
    onKeyClear: () => void
    isKeySet: boolean
  }) => {
    return (
      <div className='space-y-2'>
        <Input
          type='password'
          placeholder={`${
            activeProvider.charAt(0).toUpperCase() + activeProvider.slice(1)
          } API Key`}
          value={apiKeyInput}
          onChange={(e) => onApiKeyChange(e.target.value)}
        />
        <div className='flex space-x-2'>
          <Button
            onClick={onKeySubmit}
            className='flex-1 bg-green-600 hover:bg-green-700'
            disabled={!apiKeyInput.trim()}
          >
            Set Key
          </Button>
          {isKeySet && (
            <Button onClick={onKeyClear} variant='destructive'>
              Clear
            </Button>
          )}
        </div>
      </div>
    )
  }
)
KeyManagement.displayName = 'KeyManagement'

// Main Chat Page Component
export default function ChatPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [activeProvider, setActiveProvider] = useState<
    'deepseek' | 'openai' | 'qwen'
  >('deepseek')

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

  const handleProviderChange = useCallback(
    (value: string) => {
      const provider = value as 'deepseek' | 'openai' | 'qwen'
      setActiveProvider(provider)

      if (provider === 'deepseek') {
        setSelectedModel(CONFIG.MODELS.DEEPSEEK_CHAT)
      } else if (provider === 'openai') {
        setSelectedModel(CONFIG.MODELS.OPENAI_GPT4O_MINI)
      } else {
        setSelectedModel(CONFIG.MODELS.QWEN_TURBO)
      }
    },
    [setSelectedModel]
  )

  const handleModelChange = useCallback(
    (value: string) => {
      setSelectedModel(value as ModelType)
    },
    [setSelectedModel]
  )

  const handleKeySubmit = useCallback(async () => {
    if (await validateAndSetApiKey(apiKeyInput, activeProvider)) {
      setApiKeyInput('')
    }
  }, [apiKeyInput, activeProvider, validateAndSetApiKey])

  const handleMessageSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!canUseSelectedModel()) {
        return
      }
      await handleSendMessage()
    },
    [canUseSelectedModel, handleSendMessage]
  )

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev)
  }, [])

  const handleChatSelect = useCallback(
    (chatId: string) => {
      switchChat(chatId)
      setIsSidebarOpen(false)
    },
    [switchChat]
  )

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
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}>
        <Button
          onClick={createNewChat}
          className='mb-4 bg-green-600 hover:bg-green-700'
        >
          New Chat
        </Button>

        <div className='flex-1 overflow-y-auto'>
          {chats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              isActive={chat.id === activeChatId}
              onSelect={handleChatSelect}
              onRename={renameChat}
              onDelete={deleteChat}
            />
          ))}
        </div>

        <div className='mt-4 space-y-4'>
          <ModelSelector
            activeProvider={activeProvider}
            selectedModel={selectedModel}
            onProviderChange={handleProviderChange}
            onModelChange={handleModelChange}
          />

          <KeyManagement
            activeProvider={activeProvider}
            apiKeyInput={apiKeyInput}
            onApiKeyChange={setApiKeyInput}
            onKeySubmit={handleKeySubmit}
            onKeyClear={() => clearApiKey(activeProvider)}
            isKeySet={isApiKeySet[activeProvider]}
          />
        </div>
      </Sidebar>

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
