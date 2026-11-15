import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ id: 'demo-campaign', name: 'Demo Campaign', status: 'live' });
}

export async function PATCH() {
  return NextResponse.json({ ok: true, status: 'updated' });
}

export async function DELETE() {
  return NextResponse.json({ ok: true, deleted: true });
}
