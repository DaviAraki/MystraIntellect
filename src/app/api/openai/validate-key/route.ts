import { NextResponse } from 'next/server'
import OpenAI from 'openai'

interface OpenAIError extends Error {
  status?: number
  response?: {
    status: number
  }
}

export async function GET(req: Request) {
  try {
    const apiKey = req.headers.get('Authorization')?.split(' ')[1]
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      )
    }

    const openai = new OpenAI({ apiKey })

    await openai.models.list()

    return NextResponse.json({ valid: true })
  } catch (error) {
    const errorObj = error as OpenAIError
    console.error('OpenAI validation error details:', {
      name: errorObj.name || 'Unknown',
      message: errorObj.message || 'Unknown error',
      status: errorObj.status,
      responseStatus: errorObj.response?.status,
    })

    // Handle OpenAI API errors
    if (error instanceof Error) {
      if (
        errorObj.status === 401 ||
        (errorObj.response && errorObj.response.status === 401) ||
        errorObj.message?.toLowerCase().includes('invalid') ||
        errorObj.message?.toLowerCase().includes('unauthorized')
      ) {
        return NextResponse.json(
          { valid: false, error: 'Invalid API key', details: errorObj.message },
          { status: 401 }
        )
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to validate API key',
        details: errorObj.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
