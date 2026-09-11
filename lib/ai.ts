import OpenAI from 'openai'
import { z } from 'zod'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-key',
});

export async function generateDocument(docType: string, shipmentData: any) {
  const prompt = `Generate realistic structured data for an Indian trade document of type "${docType}".
Shipment details: ${JSON.stringify(shipmentData)}.
Return valid JSON adhering strictly to statutory DGFT and Indian Customs requirements. Include document numbers, dates, line items, and statutory declarations.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an Indian customs and international trade documentation specialist. Output structured JSON only.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (err) {
    console.warn('OpenAI document content drafting unavailable, using deterministic baseline:', err);
    return {};
  }
}

// ===== Zod Schemas for Model JSON Validation =====

export const aiComplianceResultSchema = z.object({
  complianceScore: z.number().min(0).max(100),
  issues: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
});

export type AIComplianceResponse =
  | { success: true; complianceScore: number; issues: string[]; recommendations: string[] }
  | { success: false; reason: 'ai_unavailable' | 'schema_mismatch'; error: string; complianceScore: number; issues: string[]; recommendations: string[] };

export async function checkCompliance(shipmentData: any): Promise<AIComplianceResponse> {
  const sanitizedSummary = {
    shipmentId: shipmentData?.id,
    destination: shipmentData?.buyerCountry,
    hsCode: shipmentData?.hsCode,
    incoterm: shipmentData?.incoterm,
  };

  const prompt = `Analyze this export shipment for DGFT compliance: ${JSON.stringify(sanitizedSummary)}. Return JSON with: complianceScore (0-100), issues (array), recommendations (array).`;

  try {
    const response = await openai.chat.completions.create(
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an Indian export compliance expert. Return valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      },
      { timeout: 10000 }
    );

    const rawJson = JSON.parse(response.choices[0].message.content || '{}');
    const validated = aiComplianceResultSchema.safeParse(rawJson);

    if (!validated.success) {
      console.warn('[AI:checkCompliance] Model JSON failed Zod schema validation:', {
        shipmentId: shipmentData?.id,
        errors: validated.error.errors.map((e) => e.message),
      });
      return {
        success: false,
        reason: 'schema_mismatch',
        error: 'AI compliance advisory format was malformed.',
        complianceScore: 0,
        issues: ['AI advisory evaluation format was invalid. Relying on deterministic rules.'],
        recommendations: ['Check statutory compliance checklists manually.'],
      };
    }

    return {
      success: true,
      ...validated.data,
    };
  } catch (err: any) {
    console.warn('[AI:checkCompliance] OpenAI call failed:', {
      shipmentId: shipmentData?.id,
      destination: shipmentData?.buyerCountry,
      error: err?.message || err,
    });
    return {
      success: false,
      reason: 'ai_unavailable',
      error: 'AI compliance advisory temporarily unavailable.',
      complianceScore: 0,
      issues: ['AI compliance advisory service is temporarily unavailable.'],
      recommendations: ['Verify statutory shipping documents and tariff schedules manually.'],
    };
  }
}

export const aiRiskAssessmentSchema = z.object({
  countryRiskScore: z.number().min(0).max(100),
  buyerRiskScore: z.number().min(0).max(100),
  aiReport: z.string().min(5),
});

export type AIRiskResponse =
  | { success: true; countryRiskScore: number; buyerRiskScore: number; aiReport: string }
  | { success: false; reason: 'ai_unavailable' | 'schema_mismatch'; error: string; countryRiskScore: number; buyerRiskScore: number; aiReport: string };

export async function assessRisk(shipmentData: any): Promise<AIRiskResponse> {
  const sanitizedSummary = {
    shipmentId: shipmentData?.id,
    destination: shipmentData?.buyerCountry,
    value: shipmentData?.value,
    currency: shipmentData?.currency,
    portOfDischarge: shipmentData?.portOfDischarge,
  };

  const prompt = `Assess the risk profile of this export shipment: ${JSON.stringify(sanitizedSummary)}. Consider buyer country stability, payment risk, and trade restrictions. Return JSON with: countryRiskScore (0-100, higher = riskier), buyerRiskScore (0-100, higher = riskier), aiReport (a 2-3 sentence summary of key risks).`;

  try {
    const response = await openai.chat.completions.create(
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an Indian export trade risk assessment expert. Return valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      },
      { timeout: 10000 }
    );

    const rawJson = JSON.parse(response.choices[0].message.content || '{}');
    const validated = aiRiskAssessmentSchema.safeParse(rawJson);

    if (!validated.success) {
      console.warn('[AI:assessRisk] Model JSON failed Zod schema validation:', {
        shipmentId: shipmentData?.id,
        errors: validated.error.errors.map((e) => e.message),
      });
      return {
        success: false,
        reason: 'schema_mismatch',
        error: 'AI risk assessment output was malformed.',
        countryRiskScore: 0,
        buyerRiskScore: 0,
        aiReport: 'AI risk assessment output was malformed. Please verify country and buyer restrictions directly.',
      };
    }

    return {
      success: true,
      ...validated.data,
    };
  } catch (err: any) {
    console.warn('[AI:assessRisk] OpenAI call failed:', {
      shipmentId: shipmentData?.id,
      destination: shipmentData?.buyerCountry,
      error: err?.message || err,
    });
    return {
      success: false,
      reason: 'ai_unavailable',
      error: 'AI risk assessment temporarily unavailable, please verify buyer risk manually.',
      countryRiskScore: 0,
      buyerRiskScore: 0,
      aiReport: 'AI risk assessment temporarily unavailable. Please verify country and buyer restrictions directly on DGFT/sanctions desks.',
    };
  }
}

export const aiHsCodeResultSchema = z.object({
  hsCode: z.string().min(2),
  description: z.string().optional().default(''),
  chapterHeading: z.string().optional().default(''),
  applicableDuties: z.string().optional().default('Per statutory schedule'),
});

export type AIHSCodeResponse =
  | { success: true; hsCode: string; description: string; chapterHeading: string; applicableDuties: string }
  | { success: false; reason: 'ai_unavailable' | 'schema_mismatch'; error: string; hsCode: string; description: string; chapterHeading: string; applicableDuties: string };

export async function findHSCode(productDescription: string): Promise<AIHSCodeResponse> {
  const prompt = `Given this product description: "${productDescription}", suggest the correct 8-digit Indian HS Code. Return JSON with: hsCode, description, chapterHeading, applicableDuties.`;

  try {
    const response = await openai.chat.completions.create(
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an Indian customs and HS Code classification expert. Return valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      },
      { timeout: 10000 }
    );

    const rawJson = JSON.parse(response.choices[0].message.content || '{}');
    const validated = aiHsCodeResultSchema.safeParse(rawJson);

    if (!validated.success) {
      console.warn('[AI:findHSCode] Model JSON failed Zod schema validation:', {
        inputPreview: productDescription.slice(0, 40),
        validationErrors: validated.error.errors.map((e) => e.message),
      });
      return {
        success: false,
        reason: 'schema_mismatch',
        error: 'AI suggestion output was malformed. Please try manual entry.',
        hsCode: '',
        description: '',
        chapterHeading: '',
        applicableDuties: '',
      };
    }

    return {
      success: true,
      hsCode: validated.data.hsCode,
      description: validated.data.description,
      chapterHeading: validated.data.chapterHeading,
      applicableDuties: validated.data.applicableDuties,
    };
  } catch (err: any) {
    console.warn('[AI:findHSCode] OpenAI call failed:', {
      inputPreview: productDescription.slice(0, 40),
      error: err?.message || err,
    });
    return {
      success: false,
      reason: 'ai_unavailable',
      error: 'AI suggestion temporarily unavailable, please try manual entry.',
      hsCode: '',
      description: '',
      chapterHeading: '',
      applicableDuties: '',
    };
  }
}

export const aiTradeUpdateDraftSchema = z.object({
  title: z.string().min(5),
  summary: z.string().min(20),
  category: z.enum(['TARIFF', 'DGFT_NOTIFICATION', 'FTA', 'LOGISTICS', 'SANCTIONS', 'OTHER']),
  country: z.string().nullable().optional(),
});

export type AITradeUpdateDraft = z.infer<typeof aiTradeUpdateDraftSchema>;

export async function draftTradeUpdate(snippet: {
  title: string;
  previewText: string;
  sourceName: string;
}): Promise<AITradeUpdateDraft | null> {
  const prompt = `You are assisting an Indian trade intelligence analyst.
Source: ${snippet.sourceName}
Notification Title/Subject: "${snippet.title}"
Notification Snippet/Preview: "${snippet.previewText}"

Task: Summarize this trade notification in 2-4 plain-language sentences for an Indian exporter/importer audience. Do not invent numbers or details not present in the snippet. If the snippet doesn't contain enough information to summarize accurately, say so instead of guessing.

Return JSON matching this exact structure:
{
  "title": "Clear, informative headline under 100 characters",
  "summary": "2 to 4 plain-language sentences explaining the impact for Indian exporters/importers",
  "category": "TARIFF" | "DGFT_NOTIFICATION" | "FTA" | "LOGISTICS" | "SANCTIONS" | "OTHER",
  "country": "Specific country mentioned (e.g. UAE, China, USA) or null if India-wide or general"
}`;

  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an Indian export-import compliance analyst. Output strict JSON only. Never invent statistics or facts not in the source text.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }, { timeout: 6000 });

      const parsedJson = JSON.parse(response.choices[0].message.content || '{}');
      const validated = aiTradeUpdateDraftSchema.safeParse(parsedJson);
      if (validated.success) {
        return validated.data;
      }
      console.warn('AI trade update output failed schema validation:', validated.error.errors);
    } catch (err) {
      console.error('Failed to generate AI trade update draft via OpenAI:', err);
    }
  }

  // Fallback to clean deterministic brief if AI call fails or key is unconfigured
  const cleanTitle = snippet.title
    .replace(/^Notification\s*No\.?\s*[\d\/\-]+/i, '')
    .replace(/[\r\n\t]+/g, ' ')
    .trim();
  const displayTitle = cleanTitle.length > 8 ? cleanTitle.slice(0, 100) : snippet.title.slice(0, 100);

  return {
    title: displayTitle,
    summary: `Statutory trade notification issued by ${snippet.sourceName}: ${snippet.previewText.slice(0, 200)}. Indian exporters and importers should review the exact circular and tariff schedule at the official portal before filing declarations.`,
    category:
      snippet.title.toLowerCase().includes('tariff') || snippet.title.toLowerCase().includes('duty')
        ? 'TARIFF'
        : 'DGFT_NOTIFICATION',
    country: null,
  };
}

export interface TradeUpdateBriefingContext {
  id: string;
  title: string;
  summary: string;
  category: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt?: Date | string | null;
}

export async function askTradeIntelligence(
  question: string,
  updates: TradeUpdateBriefingContext[]
): Promise<{ answer: string; relevantIds: string[] }> {
  const summariesText =
    updates.length > 0
      ? updates
          .map(
            (u, i) => `[Item ${i + 1} | ID: ${u.id}]
Title: ${u.title}
Source: ${u.sourceName} (${u.sourceUrl})
Category: ${u.category}
Date: ${u.publishedAt ? new Date(u.publishedAt).toLocaleDateString('en-IN') : 'Recent'}
Summary: ${u.summary}`
          )
          .join('\n\n')
      : 'No trade updates found in the database.';

  const prompt = `User's trade/export question: "${question}"

Available Published Trade Updates:
${summariesText}

Instructions:
1. Answer the user's trade/export question using ONLY the provided trade update summaries above.
2. If none are relevant or the updates do not contain enough facts to answer, clearly say you don't have a published update on that topic yet and suggest checking the official DGFT (dgft.gov.in) or CBIC (cbic.gov.in) sites.
3. NEVER invent tariff numbers, rates, or facts not present in the provided summaries.
4. If the question is asking for an HS code lookup or product-specific duty calculation (e.g. "What is the HS code for..." or "Calculate import duty for..."), explain that this briefing bot strictly summarizes published regulatory notices, and suggest logging into or signing up for ShipSync AI to use the dedicated HS Code Finder & Duty Calculator in the dashboard.
5. Return JSON matching this exact structure:
{
  "answer": "Your concise, professional response in plain language (markdown formatting allowed)",
  "relevantIds": ["id1", "id2"] // Array of item IDs from the provided updates that directly contributed to the answer. Return an empty array [] if none were relevant.
}`;

  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-dummy-key') {
    try {
      const response = await openai.chat.completions.create(
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are Sync AI, an Indian trade intelligence and regulatory analyst for ShipSync AI. Output valid JSON only. Never invent facts or statutory numbers not present in the provided summaries.',
            },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        },
        { timeout: 10000 }
      );

      const parsed = JSON.parse(response.choices[0].message.content || '{}');
      return {
        answer:
          parsed.answer ||
          "I could not formulate an answer based on available trade records. Please check the official DGFT or CBIC portals.",
        relevantIds: Array.isArray(parsed.relevantIds) ? parsed.relevantIds : [],
      };
    } catch (err) {
      console.error('Failed to get trade intelligence answer via OpenAI:', err);
    }
  }

  // Fallback when OpenAI key is absent or offline
  if (updates.length > 0) {
    const first = updates[0];
    return {
      answer: `Based on published briefings, here is a relevant update from ${first.sourceName}: "${first.title}". ${first.summary} For the full official circular, please review ${first.sourceUrl}.`,
      relevantIds: [first.id],
    };
  }

  return {
    answer:
      "We don't have a published regulatory update on that topic yet. We suggest checking official circulars directly on dgft.gov.in or cbic.gov.in.",
    relevantIds: [],
  };
}
