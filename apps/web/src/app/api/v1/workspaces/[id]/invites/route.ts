import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ members: [{ id: 'member-1', role: 'owner', status: 'active' }] });
}
