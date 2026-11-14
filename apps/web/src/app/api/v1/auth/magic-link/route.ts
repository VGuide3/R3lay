export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const data = `event: connected\ndata: {"type":"connection.created"}\n\n`;
      controller.enqueue(new TextEncoder().encode(data));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
