import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ workspaces: [{ id: randomUUID(), name: 'Demo Workspace' }] });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ ok: true, workspace: { id: randomUUID(), ...body } });
}
