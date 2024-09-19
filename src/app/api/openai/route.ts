import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Your Assistant ID
const assistantId = 'asst_t5SQBj41UAk05cyYtudfE9j0';

export async function POST(req: Request) {
  try {
    // Extract API Key from Authorization header
    const apiKey = req.headers.get('Authorization')?.split(' ')[1];
    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 401 });
    }

    // Parse the request body
    const { threadId, message } = await req.json();

    console.log('thread', threadId);


    // Validate required parameters
    if (!assistantId || !message) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Initialize OpenAI with the provided API key
    const openai = new OpenAI({ apiKey });

    try {
      // Create or retrieve a thread based on threadId
      const thread = threadId
        ? await openai.beta.threads.retrieve(threadId)
        : await openai.beta.threads.create();

      // Add the user's message to the thread
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: message,
      });


      // Create a ReadableStream to stream responses to the client
      const stream = new ReadableStream({
        start(controller) {
          // Send the threadId as the first chunk of data
          controller.enqueue(JSON.stringify({ threadId: thread.id }) + '\n');

          // Initialize the run with streaming enabled
          const run = openai.beta.threads.runs.stream(thread.id, {
            assistant_id: assistantId,
            stream: true,
          });

          // Handle 'textCreated' event
          run.on('textCreated', () => {
            const data = '\nassistant > ';
            controller.enqueue(data);
          });

          // Handle 'textDelta' event
          run.on('textDelta', (textDelta) => {
            const data = textDelta.value ?? '';
            controller.enqueue(data);
          });

          // Handle 'toolCallCreated' event
          run.on('toolCallCreated', (toolCall) => {
            const data = `\nassistant > ${toolCall.type}\n\n`;
            controller.enqueue(data);
          });

          // Handle 'toolCallDelta' event
          run.on('toolCallDelta', (toolCallDelta) => {
            if (toolCallDelta.type === 'code_interpreter') {
              if (toolCallDelta.code_interpreter?.input) {
                const input = toolCallDelta.code_interpreter.input;
                controller.enqueue(input);
              }
              if (toolCallDelta.code_interpreter?.outputs) {
                const outputHeader = "\noutput >\n";
                console.log('Streaming output header:', outputHeader); // Server-side log
                controller.enqueue(outputHeader);
                toolCallDelta.code_interpreter.outputs.forEach((output) => {
                  if (output.type === "logs") {
                    const logs = `\n${output.logs}\n`;
                    console.log('Streaming logs:', logs); // Server-side log
                    controller.enqueue(logs);
                  }
                });
              }
            }
          });

          run.on('end', () => {
            console.log('Streaming completed'); // Server-side log
            controller.close();
          });

          run.on('error', (err) => {
            console.error('Run Error:', err); // Server-side error log
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
    // Handle general server errors
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
