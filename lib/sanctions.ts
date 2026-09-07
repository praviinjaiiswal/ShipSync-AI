import { prisma } from '@/app/lib/prisma';
import { getCached, setCached, globalCacheKey, hashKey, CACHE_TTL } from '@/lib/cache';

export type SanctionsMatch = {
  name: string;
  source: 'US_CSL' | 'DGFT_DENIED_ENTITY' | 'SCOMET_RESTRICTED';
  type: string;
  referenceNumber?: string;
  programs?: string[];
  remarks?: string;
};

export type SanctionsScreeningResult = {
  usListMatch: boolean;
  dgftListMatch: boolean;
  scometListMatch: boolean;
  matchFound: boolean;
  checkedAt: string;
  matches: SanctionsMatch[];
};

export async function checkSanctions(buyerName: string): Promise<SanctionsScreeningResult> {
  const normalizedQuery = buyerName.trim();
  if (!normalizedQuery) {
    return {
      usListMatch: false,
      dgftListMatch: false,
      scometListMatch: false,
      matchFound: false,
      checkedAt: new Date().toISOString(),
      matches: [],
    };
  }

  const matches: SanctionsMatch[] = [];
  let usListMatch = false;
  let dgftListMatch = false;
  let scometListMatch = false;

  // -------------------------------------------------------------
  // 1. India Statutory Screening (DGFT Denied Entities & SCOMET)
  // -------------------------------------------------------------
  const localCacheKey = globalCacheKey('sanctions', 'denied-entity', hashKey(normalizedQuery.toLowerCase()));
  let localMatches = getCached<SanctionsMatch[]>(localCacheKey);

  if (!localMatches) {
    localMatches = [];
    try {
      const dbEntities = await prisma.deniedEntity.findMany({
        where: {
          OR: [
            { entityName: { contains: normalizedQuery, mode: 'insensitive' } },
            { notes: { contains: normalizedQuery, mode: 'insensitive' } },
          ],
        },
      });

      for (const entity of dbEntities) {
        localMatches.push({
          name: entity.entityName,
          source: entity.sourceList as 'DGFT_DENIED_ENTITY' | 'SCOMET_RESTRICTED',
          type: entity.entityType,
          referenceNumber: entity.referenceNumber || undefined,
          remarks: entity.notes || undefined,
        });
      }

      // Cache reference data check for 24 hours
      setCached(localCacheKey, localMatches, CACHE_TTL.STATIC_REF);
    } catch (err) {
      console.error('Local DGFT/SCOMET sanctions lookup error:', err);
    }
  }

  for (const match of localMatches) {
    matches.push(match);
    if (match.source === 'DGFT_DENIED_ENTITY') dgftListMatch = true;
    if (match.source === 'SCOMET_RESTRICTED') scometListMatch = true;
  }

  // -------------------------------------------------------------
  // 2. US Trade.gov Consolidated Screening List (CSL) Live Query
  // -------------------------------------------------------------
  const apiKey = process.env.TRADE_GOV_API_KEY;
  if (apiKey) {
    try {
      const url = `https://api.trade.gov/consolidated_screening_list/search?api_key=${apiKey}&name=${encodeURIComponent(
        normalizedQuery
      )}`;

      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        const results = data.results ?? [];
        if (results.length > 0) {
          usListMatch = true;
          for (const r of results) {
            matches.push({
              name: r.name,
              source: 'US_CSL',
              type: r.type || 'ENTITY',
              programs: r.programs,
              remarks: r.remarks,
            });
          }
        }
      }
    } catch (apiErr) {
      // In development/test or if live external API is unreachable, log warning without breaking platform flow
      console.warn('US CSL live screening service warning:', apiErr);
    }
  }

  const matchFound = usListMatch || dgftListMatch || scometListMatch;

  return {
    usListMatch,
    dgftListMatch,
    scometListMatch,
    matchFound,
    checkedAt: new Date().toISOString(),
    matches,
  };
}