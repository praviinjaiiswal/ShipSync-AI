import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';

export const GET = withErrorHandler(async () => {
  return NextResponse.json({ message: 'AI test route working' });
});