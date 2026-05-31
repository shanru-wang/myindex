const PROVIDER_EXCHANGES = {
  HKSE: "XHKG",
  NYSE: "XNYS",
  Nasdaq: "XNAS",
  ShanghaiSE: "XSHG",
  ShenzhenSE: "XSHE"
};

export async function onRequestGet({ request, env }) {
  if (!env.TWELVE_DATA_API_KEY) return json({ error: "TWELVE_DATA_API_KEY is not configured" }, 503);
  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol");
  const exchange = PROVIDER_EXCHANGES[url.searchParams.get("exchange")];
  if (!symbol || !exchange) return json({ error: "Symbol and supported exchange are required" }, 400);

  const upstreamUrl = new URL("https://api.twelvedata.com/quote");
  upstreamUrl.searchParams.set("symbol", symbol);
  upstreamUrl.searchParams.set("mic_code", exchange);
  upstreamUrl.searchParams.set("apikey", env.TWELVE_DATA_API_KEY);
  const response = await fetch(upstreamUrl, { headers: { Accept: "application/json" } });
  if (!response.ok) return json({ error: "Quote provider unavailable" }, 502);
  return new Response(response.body, { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" } });
}

function json(value, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
}
