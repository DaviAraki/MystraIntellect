import React from 'react';  
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MessageComponent } from '../MessageComponent';
import { Message } from '@/types/message';
import { useCodePreview } from '@/hooks/useCodePreview';

// Mock the useCodePreview hook
vi.mock('@/hooks/useCodePreview', () => ({
  useCodePreview: vi.fn(
    () => ({
      handlePreviewCode: vi.fn(),
      hasCode: false,
    })
  )
}));

describe('MessageComponent', () => {
  it('renders user message correctly', () => {
    const message: Message = { sender: 'user', text: 'Hello, world!', id: 1 };
    render(<MessageComponent message={message} onPreviewCode={vi.fn()} />);

    expect(screen.getByText('Hello, world!')).toBeDefined();
  });

  it('renders bot message correctly', () => {
    const message: Message = { sender: 'bot', text: 'Hello, user!', id: 1 };
    render(<MessageComponent message={message} onPreviewCode={vi.fn()} />);

    expect(screen.getByText('Hello, user!')).toBeDefined();
  });

  it('renders code block and preview button for bot message with code', () => {
    const message: Message = { sender: 'bot', text: '```js\nconsole.log("Hello, world!");\n```', id: 1 };
    const mockHandlePreviewCode = vi.fn().mockReturnValue({ 'file.js': { content: 'console.log("Hello, world!");' } });
    vi.mocked(useCodePreview).mockReturnValue({ handlePreviewCode: mockHandlePreviewCode, hasCode: true });
    render(<MessageComponent message={message} onPreviewCode={vi.fn()} />);

    expect(screen.getByText('console')).toBeDefined();
    expect(screen.getByText('.')).toBeDefined();
    expect(screen.getByText('log')).toBeDefined();
    expect(screen.getByText('Preview Code')).toBeDefined();
  });

  it('calls onPreviewCode when preview button is clicked', () => {
    const message: Message = { sender: 'bot', text: '```js\nconsole.log("Hello, world!");\n```', id: 1 };
    const mockHandlePreviewCode = vi.fn().mockReturnValue({ 'file.js': { content: 'console.log("Hello, world!");' } });
    const mockOnPreviewCode = vi.fn();
    vi.mocked(useCodePreview).mockReturnValue({ handlePreviewCode: mockHandlePreviewCode, hasCode: true });

    render(<MessageComponent message={message} onPreviewCode={mockOnPreviewCode} />);

    fireEvent.click(screen.getByText('Preview Code'));

    expect(mockOnPreviewCode).toHaveBeenCalledWith({ 'file.js': { content: 'console.log("Hello, world!");' } });
  });
});
