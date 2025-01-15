import { CONFIG } from '@/config/constants';
import { ChatService } from '@/services/ChatServices';
import { validateApiKey } from '@/utils/validation';
import { useState, useCallback, useEffect } from 'react';




export function useApiKey() {
  const [apiKey, setApiKey] = useState('');
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedApiKey = localStorage.getItem(CONFIG.STORAGE.API_KEY);
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setIsApiKeySet(true);
    }
  }, []);

  const validateAndSetApiKey = useCallback(async (key: string) => {
    if (!validateApiKey(key)) {
      setError('Invalid API key format');
      return false;
    }

    try {
      const isValid = await ChatService.validateApiKey(key);
      if (isValid) {
        localStorage.setItem(CONFIG.STORAGE.API_KEY, key);
        setApiKey(key);
        setIsApiKeySet(true);
        setError(null);
      } else {
        setError('Invalid API key');
      }
      return isValid;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      return false;
    }
  }, []);

  const clearApiKey = useCallback(() => {
    localStorage.removeItem(CONFIG.STORAGE.API_KEY);
    setApiKey('');
    setIsApiKeySet(false);
    setError(null);
  }, []);

  return {
    apiKey,
    isApiKeySet,
    error,
    validateAndSetApiKey,
    clearApiKey
  };
} 