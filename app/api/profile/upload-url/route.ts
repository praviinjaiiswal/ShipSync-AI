import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { getTenantContext } from '@/lib/tenant';
import { rateLimiter, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { profileUploadSchema } from '@/lib/validations';
import { ValidationError } from '@/lib/errors';
import { createSignedUploadUrl } from '@/lib/storage';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const ctx = await getTenantContext();

  // Rate limit profile/avatar upload attempts (5 requests/min)
  await rateLimiter.check(req, `upload:${ctx.userId}`, RATE_LIMIT_PRESETS.UPLOAD);

  const body = await req.json();
  const parsed = profileUploadSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError('Invalid upload parameters', parsed.error.flatten());
  }

  const { fileName } = parsed.data;
  const ext = fileName.split('.').pop() || 'png';
  const companyKey = ctx.companyId || 'unassigned';
  const storageKey = `companies/${companyKey}/users/${ctx.userId}/avatar_${Date.now()}.${ext}`;

  try {
    const uploadData = await createSignedUploadUrl(storageKey);
    return NextResponse.json({
      uploadUrl: uploadData.signedUrl,
      token: uploadData.token,
      path: uploadData.path,
      storageKey,
    });
  } catch {
    // If Supabase signed upload URL is not configured/available in local/test environment,
    // provide a standard fallback key format
    return NextResponse.json({
      storageKey,
      uploadUrl: null,
      message: 'Direct signed URL not supported by storage provider; use direct upload',
    });
  }
});
