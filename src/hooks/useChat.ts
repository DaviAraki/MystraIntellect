// hooks/useChat.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { Message } from "@/types/message";
import { CONFIG, isOpenAIModel } from "@/config/constants";
import { ChatService } from "@/services/ChatServices";

type Provider = "deepseek" | "openai" | "qwen";
type ApiKeys = Record<Provider, string>;
type ApiKeyStatus = Record<Provider, boolean>;

export function useChat(apiKeys: ApiKeys, isApiKeySet: ApiKeyStatus) {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChatId, setActiveChatId] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadState = () => {
      try {
        let chatId = localStorage.getItem(CONFIG.STORAGE.ACTIVE_CHAT_ID);
        if (!chatId) {
          chatId = `chat-${Date.now()}`;
          localStorage.setItem(CONFIG.STORAGE.ACTIVE_CHAT_ID, chatId);
          localStorage.setItem(chatId, JSON.stringify([]));
        }
        setActiveChatId(chatId);
        const savedMessages = JSON.parse(localStorage.getItem(chatId) || "[]");
        setMessages(savedMessages);
        // Load threadId for this chat only if it exists
        const savedThreadId = localStorage.getItem(`${chatId}-threadId`);
        if (savedThreadId) {
          setThreadId(savedThreadId);
        }
      } catch (error) {
        console.error("Load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadState();
  }, []);

  const sendMessage = useCallback(
    async (content: string, model: string) => {
      if (!content.trim()) return;

      const provider = ChatService.getProviderForModel(model);
      if (!isApiKeySet[provider]) {
        setError(`Please set your ${provider} API key first`);
        return;
      }

      const userMessage: Message = {
        role: "user",
        content,
        timestamp: Date.now(),
      };

      // Update messages with user message
      setMessages((prev) => {
        const newMessages = [...prev, userMessage];
        localStorage.setItem(activeChatId, JSON.stringify(newMessages));
        return newMessages;
      });

      try {
        setIsStreaming(true);
        setError(null);

        const chatService = new ChatService(apiKeys[provider], provider);
        const response = await chatService.sendMessage(
          [...messages, userMessage],
          model,
          isOpenAIModel(model) ? threadId || undefined : undefined,
        );

        if (!response) {
          throw new Error("No response from API");
        }

        const reader = response.getReader();
        const decoder = new TextDecoder();
        let assistantMessage = "";

        // Add initial assistant message
        const initialAssistantMessage: Message = {
          role: "assistant",
          content: "",
          timestamp: Date.now(),
        };

        setMessages((prev) => {
          const newMessages = [...prev, initialAssistantMessage];
          return newMessages;
        });

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);

          // Check if the chunk contains threadId and we're using an OpenAI model
          if (isOpenAIModel(model) && chunk.includes("threadId")) {
            try {
              const threadInfo = JSON.parse(chunk);
              if (threadInfo.threadId) {
                setThreadId(threadInfo.threadId);
                localStorage.setItem(
                  `${activeChatId}-threadId`,
                  threadInfo.threadId,
                );
                continue; // Skip this chunk as it's not part of the message
              }
            } catch {
              // If parsing fails, treat it as regular message content
            }
          }

          assistantMessage += chunk;

          // Update the last message content
          setMessages((prev) => {
            const newMessages = [...prev];
            if (newMessages.length > 0) {
              newMessages[newMessages.length - 1] = {
                ...newMessages[newMessages.length - 1],
                content: assistantMessage,
              };
            }
            return newMessages;
          });
        }

        // Save final messages to localStorage
        setMessages((prev) => {
          localStorage.setItem(activeChatId, JSON.stringify(prev));
          return prev;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        // Remove the last assistant message if there was an error
        setMessages((prev) => {
          const newMessages = prev.slice(0, -1);
          localStorage.setItem(activeChatId, JSON.stringify(newMessages));
          return newMessages;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [activeChatId, apiKeys, isApiKeySet, messages, threadId],
  );

  const loadThreadHistory = useCallback((chatId: string) => {
    try {
      const savedMessages = JSON.parse(localStorage.getItem(chatId) || "[]");
      setMessages(savedMessages);
      // Load threadId for this chat
      const savedThreadId = localStorage.getItem(`${chatId}-threadId`);
      if (savedThreadId) {
        setThreadId(savedThreadId);
      }
    } catch (error) {
      console.error("Error loading thread history:", error);
      setError("Failed to load chat history");
    }
  }, []);

  const clearMessages = useCallback((chatId: string) => {
    setMessages([]);
    setThreadId(null);
    localStorage.setItem(chatId, JSON.stringify([]));
    localStorage.removeItem(`${chatId}-threadId`);
  }, []);

  return {
    loading,
    messages,
    error,
    isStreaming,
    sendMessage,
    inputMessage,
    setInputMessage,
    activeChatId,
    setActiveChatId,
    loadThreadHistory,
    clearMessages,
    setIsStreaming,
  };
}
