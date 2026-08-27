import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { findHSCode } from "@/lib/ai";
import { getCached, setCached } from "@/lib/cache";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productDescription } = await req.json();
  if (!productDescription || productDescription.trim().length < 5) {
    return NextResponse.json({ error: "Product description too short" }, { status: 400 });
  }

  const cacheKey = `hs-code:${productDescription.trim().toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const result = await findHSCode(productDescription);
    setCached(cacheKey, result);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "AI request failed" }, { status: 502 });
  }
}