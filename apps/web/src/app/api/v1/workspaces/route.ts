import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ campaigns: [{ id: randomUUID(), name: 'Demo Campaign', slug: 'demo-campaign', status: 'live' }] });
}

export async function POST(request: Request) {
  const data = await request.json();
  return NextResponse.json({ id: randomUUID(), ...data, status: 'draft' });
}
