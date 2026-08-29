type CSLMatch = {
  name: string;
  source: string;
  type: string;
  programs?: string[];
  remarks?: string;
};

export async function checkSanctions(buyerName: string): Promise<CSLMatch[]> {
  const apiKey = process.env.TRADE_GOV_API_KEY;
  const url = `https://api.trade.gov/consolidated_screening_list/search?api_key=${apiKey}&name=${encodeURIComponent(
    buyerName
  )}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("CSL API request failed");

  const data = await res.json();

  return (data.results ?? []).map((r: any) => ({
    name: r.name,
    source: r.source,
    type: r.type,
    programs: r.programs,
    remarks: r.remarks,
  }));
}