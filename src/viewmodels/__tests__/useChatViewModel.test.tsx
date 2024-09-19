// useChatViewModel.test.tsx
import { renderHook, act } from '@testing-library/react';
import { ChatService } from '@/services/ChatServices';
import { Mocked, vi } from 'vitest';
import { useChatViewModel } from '../ChatViewModel';

// Mock the ChatService module
vi.mock('@/services/ChatServices', () => ({
  ChatService: {
    sendMessage: vi.fn(),
    validateApiKey: vi.fn(),
  },
}));

describe('useChatViewModel', () => {
  const mockedChatService = ChatService as Mocked<typeof ChatService>;
  

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useChatViewModel());

    expect(result.current.messages).toEqual([
      { id: 1, text: 'Welcome to MystraIntellect!', sender: 'bot' },
    ]);
    expect(result.current.inputMessage).toBe('');
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.apiKey).toBe('');
    expect(result.current.isApiKeySet).toBe(false);
    expect(result.current.selectedModel).toBe('gpt-4o-mini');
    expect(result.current.error).toBeNull();
  });

  it('should load API key from localStorage on mount', () => {
    vi.mocked(window.localStorage.getItem).mockReturnValue('test-api-key');
    const { result } = renderHook(() => useChatViewModel());

    expect(window.localStorage.getItem).toHaveBeenCalledWith('mystraIntellectApiKey');
    expect(result.current.apiKey).toBe('test-api-key');
    expect(result.current.isApiKeySet).toBe(true);
  });

  it('should validate API key successfully', async () => {
    mockedChatService.validateApiKey.mockResolvedValue(true);

    const { result, } = renderHook(() => useChatViewModel());

    await act(async () => {
      const isValid = await result.current.validateApiKey('valid-key');
      expect(isValid).toBe(true);
    });

    expect(mockedChatService.validateApiKey).toHaveBeenCalledWith('valid-key');
    expect(window.localStorage.setItem).toHaveBeenCalledWith('mystraIntellectApiKey', 'valid-key');
    expect(result.current.isApiKeySet).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should handle invalid API key', async () => {
    mockedChatService.validateApiKey.mockResolvedValue(false);

    const { result } = renderHook(() => useChatViewModel());

    await act(async () => {
      const isValid = await result.current.validateApiKey('invalid-key');
      expect(isValid).toBe(false);
    });

    expect(mockedChatService.validateApiKey).toHaveBeenCalledWith('invalid-key');
    expect(result.current.error).toBe('Invalid API key');
    expect(result.current.isApiKeySet).toBe(false);
  });

  it('should handle API key validation error', async () => {
    mockedChatService.validateApiKey.mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useChatViewModel());

    await act(async () => {
      const isValid = await result.current.validateApiKey('error-key');
      expect(isValid).toBe(false);
    });

    expect(mockedChatService.validateApiKey).toHaveBeenCalledWith('error-key');
    expect(result.current.error).toBe('Error validating API key: Network Error');
    expect(result.current.isApiKeySet).toBe(false);
  });

  it('should send a message successfully', async () => {
    const mockReader = {
      read: vi
        .fn()
        .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('Hello') })
        .mockResolvedValueOnce({ done: true, value: undefined }),
      releaseLock: vi.fn(),
      closed: Promise.resolve(undefined),
      cancel: vi.fn(),
    };
    mockedChatService.sendMessage.mockResolvedValue(mockReader);

    const { result } = renderHook(() => useChatViewModel());

    // Set necessary states
    act(() => {
      result.current.setApiKey('test-api-key');
      result.current.setInputMessage('Hi there!');
    });

    await act(async () => {
      result.current.sendMessage();
    });

    expect(mockedChatService.sendMessage).toHaveBeenCalledWith(
      [
        { id: 1, text: 'Welcome to MystraIntellect!', sender: 'bot' },
        { id: 2, text: 'Hi there!', sender: 'user' },
      ],
      'test-api-key',
      'gpt-4o-mini'
    );

    // Initially, bot message is added
    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[2]).toEqual({ id: 3, text: 'Hello', sender: 'bot' });
    expect(result.current.inputMessage).toBe('');
    expect(result.current.error).toBeNull();
    expect(result.current.isStreaming).toBe(false);

    expect(result.current.messages[2].text).toBe('Hello');
    expect(result.current.isStreaming).toBe(false);
  });

  it('should handle sendMessage when input is empty or API key is missing', async () => {
    const { result } = renderHook(() => useChatViewModel());

    // Attempt to send with empty input
    await act(async () => {
      result.current.sendMessage();
    });
    expect(mockedChatService.sendMessage).not.toHaveBeenCalled();

    // Set input but no API key
    act(() => {
      result.current.setInputMessage('Test message');
    });

    await act(async () => {
      result.current.sendMessage();
    });
    expect(mockedChatService.sendMessage).not.toHaveBeenCalled();
  });

  it('should handle sendMessage error', async () => {
    mockedChatService.sendMessage.mockRejectedValue(new Error('Send Error'));

    const { result } = renderHook(() => useChatViewModel());

    act(() => {
      result.current.setApiKey('test-api-key');
      result.current.setInputMessage('Hi!');
    });

    await act(async () => {
      result.current.sendMessage();
    });

    expect(mockedChatService.sendMessage).toHaveBeenCalled();

    // Error should be set
    expect(result.current.error).toBe('Error: Send Error');
    expect(result.current.isStreaming).toBe(false);
  });

  it('should clear API key correctly', () => {
    const { result } = renderHook(() => useChatViewModel());

    act(() => {
      result.current.setApiKey('test-api-key');
      result.current.setIsApiKeySet(true);
    });

    act(() => {
      result.current.clearApiKey();
    });

    expect(window.localStorage.removeItem).toHaveBeenCalledWith('mystraIntellectApiKey');
    expect(result.current.apiKey).toBe('');
    expect(result.current.isApiKeySet).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should update selected model', () => {
    const { result } = renderHook(() => useChatViewModel());

    act(() => {
      result.current.setSelectedModel('gpt-3.5');
    });

    expect(result.current.selectedModel).toBe('gpt-3.5');
  });
});
