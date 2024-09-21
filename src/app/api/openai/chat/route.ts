import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get('Authorization')?.split(' ')[1];
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 401 });
    }

    const { threadId, message, model } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    const openai = new OpenAI({ apiKey });

    const myAssistant = await openai.beta.assistants.create({
      instructions:`
        " You are an expert software developer AI assistant. Your primary focus is on helping with coding, software architecture, best practices, and problem-solving in various programming languages and frameworks. 
          - Provide concise, accurate, and efficient solutions.
          - Explain complex concepts clearly and suggest improvements when appropriate.
          - Be aware of modern development practices, design patterns, and performance considerations.
          - If asked about a specific technology, framework, or language, tailor your responses accordingly.
          - When providing code solutions, specify the file names for each code block using the format: [filename: file  name] inside the markdown text on code block.
          - If multiple files are needed, provide them in separate code blocks with their respective filenames.
          - Follow the rules of clean code, dry, kiss and SOLID principles.
          `,
      name: "Mystra",
      tools: [{ type: "code_interpreter" }],
      model: model ?? "gpt-4o-mini",
    });


    try {
      const thread = threadId
        ? await openai.beta.threads.retrieve(threadId)
        : await openai.beta.threads.create();

      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: message,
      });


      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(JSON.stringify({ threadId: thread.id }) + '\n');

          const run = openai.beta.threads.runs.stream(thread.id, {
            assistant_id: myAssistant.id,
            stream: true,
          });

          run.on('textCreated', () => {
            const data = '\nassistant > ';
            controller.enqueue(data);
          });

          run.on('textDelta', (textDelta) => {
            const data = textDelta.value ?? '';
            controller.enqueue(data);
          });

          run.on('toolCallCreated', (toolCall) => {
            const data = `\nassistant > ${toolCall.type}\n\n`;
            controller.enqueue(data);
          });

          run.on('toolCallDelta', (toolCallDelta) => {
            if (toolCallDelta.type === 'code_interpreter') {
              if (toolCallDelta.code_interpreter?.input) {
                const input = toolCallDelta.code_interpreter.input;
                controller.enqueue(input);
              }
              if (toolCallDelta.code_interpreter?.outputs) {
                const outputHeader = "\noutput >\n";
                console.log('Streaming output header:', outputHeader); 
                controller.enqueue(outputHeader);
                toolCallDelta.code_interpreter.outputs.forEach((output) => {
                  if (output.type === "logs") {
                    const logs = `\n${output.logs}\n`;
                    console.log('Streaming logs:', logs); 
                    controller.enqueue(logs);
                  }
                });
              }
            }
          });

          run.on('end', () => {
            console.log('Streaming completed'); 
            controller.close();
          });

          run.on('error', (err) => {
            console.error('Run Error:', err); 
            controller.error(err);
          });
        },
      });

      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });

    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      return NextResponse.json(
        { error: 'Error communicating with OpenAI API' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Server error:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Internal Server Error: ${error.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error: Unknown error' },
      { status: 500 }
    );
  }
}

