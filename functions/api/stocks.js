const PROVIDER_EXCHANGES = {
  HKSE: "XHKG",
  NYSE: "XNYS",
  Nasdaq: "XNAS",
  ShanghaiSE: "XSHG",
  ShenzhenSE: "XSHE"
};

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const exchange = url.searchParams.get("exchange");
  const providerExchange = PROVIDER_EXCHANGES[exchange];
  if (!providerExchange) return json({ error: "Unsupported exchange" }, 400);

  const cache = caches.default;
  const upstreamUrl = `https://api.twelvedata.com/stocks?exchange=${encodeURIComponent(providerExchange)}&format=JSON`;
  const cacheKey = new Request(upstreamUrl);
  let response = await cache.match(cacheKey);
  if (!response) {
    response = await fetch(upstreamUrl, { headers: { Accept: "application/json" } });
    if (!response.ok) return json({ error: "Market catalog provider unavailable" }, 502);
    response = new Response(response.body, response);
    response.headers.set("Cache-Control", "public, max-age=86400");
    await cache.put(cacheKey, response.clone());
  }
  return response;
}

function json(value, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
}
