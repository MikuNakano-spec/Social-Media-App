import { Ollama } from 'ollama';
import { StreamingTextResponse } from 'ai';

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    const ollama = new Ollama();
    
    const response = await ollama.chat({
      model: 'mistral',
      messages: [
        {
          role: 'assistant',
          content: 'Bạn là trợ lý ảo. Hãy trả lời bằng tiếng Việt một cách thân thiện.'
        },
        ...messages
      ],
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          controller.enqueue(new TextEncoder().encode(chunk.message.content));
        }
        controller.close();
      },
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('Ollama API Error:', error);
    return Response.json(
      { error: "Lỗi kết nối AI. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}