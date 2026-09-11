import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { withErrorHandler } from '@/lib/api-handler';
import { rateLimiter, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { askTradeIntelligence } from '@/lib/ai';
import { ValidationError } from '@/lib/errors';

const askSchema = z.object({
  question: z
    .string({ required_error: 'Question is required' })
    .trim()
    .min(3, 'Question must be at least 3 characters')
    .max(300, 'Question cannot exceed 300 characters'),
});

const STOP_WORDS = new Set([
  'what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how',
  'is', 'are', 'was', 'were', 'the', 'a', 'an', 'and', 'or', 'in', 'on',
  'at', 'to', 'for', 'of', 'with', 'any', 'latest', 'recent', 'update',
  'updates', 'notice', 'notification', 'notifications', 'tell', 'me',
  'about', 'can', 'you', 'please', 'does', 'have'
]);

export const POST = withErrorHandler(async (req: NextRequest) => {
  // 1. IP-based rate limiting (20 requests/min per IP)
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  await rateLimiter.check(req, `ai:trade-ask:${ip}`, RATE_LIMIT_PRESETS.AI);

  // 2. Validate input body with Zod
  const body = await req.json().catch(() => ({}));
  const parseResult = askSchema.safeParse(body);
  if (!parseResult.success) {
    throw new ValidationError(parseResult.error.errors[0]?.message || 'Invalid question format');
  }

  const { question } = parseResult.data;

  // 3. Extract keywords for targeted DB matching
  const clean = question.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const keywords = clean
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

  let matchedUpdates: any[] = [];

  try {
    if (keywords.length > 0) {
      matchedUpdates = await prisma.tradeUpdate.findMany({
        where: {
          status: 'PUBLISHED',
          OR: keywords.flatMap((kw) => [
            { title: { contains: kw, mode: 'insensitive' } },
            { summary: { contains: kw, mode: 'insensitive' } },
            { sourceName: { contains: kw, mode: 'insensitive' } },
          ]),
        },
        orderBy: { publishedAt: 'desc' },
        take: 8,
      });
    }

    // Top-up with recent published updates if keyword matches are sparse (< 4)
    if (matchedUpdates.length < 4) {
      const existingIds = new Set(matchedUpdates.map((u) => u.id));
      const recent = await prisma.tradeUpdate.findMany({
        where: {
          status: 'PUBLISHED',
          id: { notIn: Array.from(existingIds) },
        },
        orderBy: { publishedAt: 'desc' },
        take: 5,
      });
      matchedUpdates = [...matchedUpdates, ...recent];
    }
  } catch (dbErr) {
    console.error('Failed to query TradeUpdate table:', dbErr);
    matchedUpdates = [];
  }

  // 4. Grounded AI inference
  const aiResult = await askTradeIntelligence(
    question,
    matchedUpdates.map((u) => ({
      id: u.id,
      title: u.title,
      summary: u.summary,
      category: u.category,
      sourceName: u.sourceName,
      sourceUrl: u.sourceUrl,
      publishedAt: u.publishedAt,
    }))
  );

  // 5. Gather source citations
  const sourceMap = new Map(matchedUpdates.map((u) => [u.id, u]));
  const relevantSources = aiResult.relevantIds
    .map((id) => sourceMap.get(id))
    .filter(Boolean)
    .map((u) => ({
      id: u.id,
      title: u.title,
      sourceName: u.sourceName,
      sourceUrl: u.sourceUrl,
      category: u.category,
    }));

  return NextResponse.json({
    answer: aiResult.answer,
    sources: relevantSources,
  });
});
