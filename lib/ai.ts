import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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