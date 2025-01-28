import { CONFIG } from '@/config/constants'
import { ChatService } from '@/services/ChatServices'
import { validateApiKey } from '@/utils/validation'
import { useState, useCallback, useEffect } from 'react'

interface ApiKeys {
  deepseek: string
  openai: string
}

interface ApiKeyStatus {
  deepseek: boolean
  openai: boolean
}

export function useApiKey() {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ deepseek: '', openai: '' })
  const [isApiKeySet, setIsApiKeySet] = useState<ApiKeyStatus>({
    deepseek: false,
    openai: false,
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const storedDeepseekKey = localStorage.getItem(
      CONFIG.STORAGE.DEEPSEEK_API_KEY
    )
    const storedOpenAIKey = localStorage.getItem(CONFIG.STORAGE.OPENAI_API_KEY)

    setApiKeys({
      deepseek: storedDeepseekKey || '',
      openai: storedOpenAIKey || '',
    })

    setIsApiKeySet({
      deepseek: !!storedDeepseekKey,
      openai: !!storedOpenAIKey,
    })
  }, [])

  const validateAndSetApiKey = useCallback(
    async (key: string, provider: 'deepseek' | 'openai') => {
      if (!validateApiKey(key)) {
        setError('Invalid API key format')
        return false
      }

      try {
        const isValid = await ChatService.validateApiKey(key, provider)
        if (isValid) {
          const storageKey =
            provider === 'deepseek'
              ? CONFIG.STORAGE.DEEPSEEK_API_KEY
              : CONFIG.STORAGE.OPENAI_API_KEY

          localStorage.setItem(storageKey, key)
          setApiKeys((prev) => ({ ...prev, [provider]: key }))
          setIsApiKeySet((prev) => ({ ...prev, [provider]: true }))
          setError(null)
        } else {
          setError(`Invalid ${provider} API key`)
        }
        return isValid
      } catch (error) {
        setError(
          error instanceof Error ? error.message : 'Unknown error occurred'
        )
        return false
      }
    },
    []
  )

  const clearApiKey = useCallback((provider: 'deepseek' | 'openai') => {
    const storageKey =
      provider === 'deepseek'
        ? CONFIG.STORAGE.DEEPSEEK_API_KEY
        : CONFIG.STORAGE.OPENAI_API_KEY

    localStorage.removeItem(storageKey)
    setApiKeys((prev) => ({ ...prev, [provider]: '' }))
    setIsApiKeySet((prev) => ({ ...prev, [provider]: false }))
    setError(null)
  }, [])

  const getApiKey = useCallback(
    (provider: 'deepseek' | 'openai') => {
      return apiKeys[provider]
    },
    [apiKeys]
  )

  return {
    apiKeys,
    isApiKeySet,
    error,
    validateAndSetApiKey,
    clearApiKey,
    getApiKey,
  }
}
