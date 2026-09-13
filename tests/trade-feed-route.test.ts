import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/trade-updates/feed/route";
import { prisma } from "@/app/lib/prisma";

vi.mock("@/app/lib/prisma", () => ({
  prisma: {
    tradeUpdate: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/cache", () => ({
  getCached: vi.fn(() => null),
  setCached: vi.fn(),
  globalCacheKey: vi.fn((key: string) => key),
}));

describe("app/api/trade-updates/feed/route.ts — Live Gazette Feed Endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns explicit isEmpty: true and empty arrays when database has no published updates", async () => {
    (prisma.tradeUpdate.findMany as any).mockResolvedValueOnce([]);

    const req = new NextRequest("http://localhost:3000/api/trade-updates/feed?category=ALL");
    const response = await GET(req, { params: {} });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ticker).toEqual([]);
    expect(body.updates).toEqual([]);
    expect(body.meta.isEmpty).toBe(true);
    expect(body.meta.total).toBe(0);
    expect(body.meta.unfilteredTotal).toBe(0);

    // Confirm no fabricated fallback notices exist
    expect(JSON.stringify(body)).not.toContain("CBIC Notification No. 18/2026-Customs");
  });

  it("returns real database records with isEmpty: false when published updates exist", async () => {
    const mockDbRecord = {
      id: "real-1",
      title: "Real DGFT Gazette Circular No. 01/2026",
      summary: "Official DGFT notification on export promotion.",
      category: "DGFT_NOTIFICATION",
      country: "India",
      sourceName: "DGFT",
      sourceUrl: "https://www.dgft.gov.in/notif-1",
      status: "PUBLISHED",
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    (prisma.tradeUpdate.findMany as any).mockResolvedValueOnce([mockDbRecord]);

    const req = new NextRequest("http://localhost:3000/api/trade-updates/feed?category=ALL");
    const response = await GET(req, { params: {} });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.meta.isEmpty).toBe(false);
    expect(body.meta.total).toBe(1);
    expect(body.meta.unfilteredTotal).toBe(1);
    expect(body.ticker).toHaveLength(1);
    expect(body.ticker[0].id).toBe("real-1");
    expect(body.updates).toHaveLength(1);
    expect(body.updates[0].id).toBe("real-1");
  });
});
