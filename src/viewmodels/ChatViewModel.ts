import { useState, useCallback } from 'react';
import { useApiKey } from '@/hooks/useApiKey';
import { useChat } from '@/hooks/useChat';
import { CONFIG } from '@/config/constants';

export function useChatViewModel() {
  const [inputMessage, setInputMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>(CONFIG.MODELS.GPT4_MINI);
  
  const { 
    apiKey, 
    isApiKeySet, 
    error: apiKeyError, 
    validateAndSetApiKey, 
    clearApiKey 
  } = useApiKey();

  const {
    messages,
    isStreaming,
    sendMessage,
    error: chatError,
    threadId
  } = useChat(apiKey);

  const handleSendMessage = useCallback(async () => {
    if (inputMessage.trim()) {
      await sendMessage(inputMessage, selectedModel);
      setInputMessage('');
    }
  }, [inputMessage, selectedModel, sendMessage]);

  return {
    messages,
    inputMessage,
    setInputMessage,
    sendMessage: handleSendMessage,
    isStreaming,
    apiKey,
    isApiKeySet,
    validateApiKey: validateAndSetApiKey,
    clearApiKey,
    selectedModel,
    setSelectedModel,
    error: apiKeyError || chatError,
    threadId
  };
}

