import { renderHook, act } from '@testing-library/react';
import { useChatViewModel } from '@/viewmodels/ChatViewModel';
import { ChatService } from '@/services/ChatServices';

vi.mock('@/services/ChatServices');

describe('useChatViewModel', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useChatViewModel());

    expect(result.current.messages).toEqual([{ id: 1, text: "Welcome to MystraIntellect!", sender: "bot" }]);
    expect(result.current.inputMessage).toBe('');
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.apiKey).toBe('');
    expect(result.current.isApiKeySet).toBe(false);
    expect(result.current.selectedModel).toBe('gpt-4o-mini');
    expect(result.current.error).toBeNull();
  });

  it('should set API key from localStorage', () => {
    localStorage.setItem('mystraIntellectApiKey', 'test-api-key');
    const { result } = renderHook(() => useChatViewModel());

    expect(result.current.apiKey).toBe('test-api-key');
    expect(result.current.isApiKeySet).toBe(true);
  });

  it('should add a message', () => {
    const { result } = renderHook(() => useChatViewModel());f

    act(() => {
      result.current.addMessage({ id: 2, text: 'Hello', sender: 'user' });
    });

    expect(result.current.messages).toEqual([
      { id: 1, text: "Welcome to MystraIntellect!", sender: "bot" },
      { id: 2, text: 'Hello', sender: 'user' }
    ]);
  });

 

  it.only('should send a message and handle streaming', async () => {
    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('Hello') })
        .mockResolvedValueOnce({ done: true }),
      releaseLock: vi.fn(),
      closed: Promise.resolve(undefined),
      cancel: vi.fn()
    }
    vi.mocked(ChatService.sendMessage).mockResolvedValue(mockReader);

    const { result } = renderHook(() => useChatViewModel());

    await act(async () => {
      result.current.setInputMessage('Test message');
      await result.current.sendMessage();
    });

    expect(result.current.messages).toEqual([
      { id: 1, text: "Welcome to MystraIntellect!", sender: "bot" },
      { id: 2, text: 'Test message', sender: 'user' },
      { id: 3, text: 'Hello', sender: 'bot' }
    ]);
    expect(result.current.isStreaming).toBe(false);
  });

  it('should validate API key', async () => {
    ChatService.validateApiKey.mockResolvedValue(true);

    const { result } = renderHook(() => useChatViewModel());

    await act(async () => {
      const isValid = await result.current.validateApiKey('valid-api-key');
      expect(isValid).toBe(true);
    });

    expect(result.current.isApiKeySet).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should handle invalid API key', async () => {
    ChatService.validateApiKey.mockResolvedValue(false);

    const { result } = renderHook(() => useChatViewModel());

    await act(async () => {
      const isValid = await result.current.validateApiKey('invalid-api-key');
      expect(isValid).toBe(false);
    });

    expect(result.current.isApiKeySet).toBe(false);
    expect(result.current.error).toBe('Invalid API key');
  });

  it('should clear API key', () => {
    const { result } = renderHook(() => useChatViewModel());

    act(() => {
      result.current.clearApiKey();
    });

    expect(result.current.apiKey).toBe('');
    expect(result.current.isApiKeySet).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
