import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ ok: true, invite: { id: 'invite-1', status: 'pending' } });
}
