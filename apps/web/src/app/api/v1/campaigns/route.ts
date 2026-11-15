import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return Response.json({ ok: true, service: 'r3lay-web' });
}

export async function POST(request: Request) {
  const body = await request.json();
  const id = randomUUID();
  return Response.json({ ok: true, id, payload: body });
}
