import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { CodeBlock } from '../CodeBlock'
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
})

// Mock setTimeout
vi.useFakeTimers()

describe('CodeBlock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders inline code when no language is specified', () => {
    render(<CodeBlock>const test = &quot;hello&quot;;</CodeBlock>)
    expect(screen.getByText('const test = "hello";')).toBeInTheDocument()
  })

  it('renders syntax highlighted code when language is specified', () => {
    render(
      <CodeBlock className='language-javascript'>
        const test = &quot;hello&quot;;
      </CodeBlock>
    )

    // Check if language badge is displayed
    expect(screen.getByText('javascript')).toBeInTheDocument()

    // Find the code element by role and then check its content
    const codeElement = screen.getByRole('code')
    expect(codeElement).toHaveTextContent('const test = "hello";')
  })

  it('copies code to clipboard when copy button is clicked', async () => {
    render(
      <CodeBlock className='language-javascript'>
        const test = &quot;hello&quot;;
      </CodeBlock>
    )

    // Click copy button
    const copyButton = screen.getByText('Copy')
    fireEvent.click(copyButton)

    // Verify clipboard API was called
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'const test = "hello";'
    )

    // Verify "Copied" text appears
    expect(screen.getByText('Copied')).toBeInTheDocument()

    // Fast-forward timers to verify "Copied" text disappears
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.getByText('Copy')).toBeInTheDocument()
  })

  it('trims trailing newline from code', () => {
    const codeWithNewline = 'const test = "hello";'
    render(
      <CodeBlock className='language-javascript'>{codeWithNewline}</CodeBlock>
    )

    const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText')
    const copyButton = screen.getByText('Copy')
    fireEvent.click(copyButton)

    expect(clipboardSpy).toHaveBeenCalledWith('const test = "hello";')
  })
})

