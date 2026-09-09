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

export async function checkCompliance(shipmentData: any) {
  const prompt = `Analyze this export shipment for DGFT compliance: ${JSON.stringify(shipmentData)}. Return JSON with: complianceScore (0-100), issues (array), recommendations (array).`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an Indian export compliance expert.' },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
  })

  return JSON.parse(response.choices[0].message.content || '{}')
}

export async function assessRisk(shipmentData: any) {
  const prompt = `Assess the risk profile of this export shipment: ${JSON.stringify(shipmentData)}. Consider buyer country stability, payment risk, and trade restrictions. Return JSON with: countryRiskScore (0-100, higher = riskier), buyerRiskScore (0-100, higher = riskier), aiReport (a 2-3 sentence summary of key risks).`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an Indian export trade risk assessment expert.' },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
  })

  return JSON.parse(response.choices[0].message.content || '{}')
}

export async function findHSCode(productDescription: string) {
  const prompt = `Given this product description: "${productDescription}", suggest the correct 8-digit Indian HS Code. Return JSON with: hsCode, description, chapterHeading, applicableDuties.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an Indian customs and HS Code classification expert.' },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
  })

  return JSON.parse(response.choices[0].message.content || '{}')
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