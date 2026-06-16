import { NextResponse } from 'next/server'

export async function DELETE() {
  return NextResponse.json({ error: 'Time slots have been removed' }, { status: 404 })
}
