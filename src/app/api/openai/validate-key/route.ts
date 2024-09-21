import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET(req: Request) {
  try {
    const apiKey = req.headers.get('Authorization')?.split(' ')[1];
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 401 });
    }

    const openai = new OpenAI({ apiKey });

    // Make a simple API call to check if the key is valid
    await openai.models.list();

    return NextResponse.json({ valid: true });
  } catch (error) {
    if (error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response && 'status' in error.response) {
      return NextResponse.json({ valid: false, error: 'Invalid API key' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}