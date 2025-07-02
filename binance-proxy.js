// pages/api/binance-proxy.js
export const config = {
  runtime: 'edge',        // مهم: ليعمل كـ Edge Function
  regions: ['fra1'],      // فرانكفورت
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get('endpoint') || 'ping';

  const url = `https://api.binance.com/api/v3/${endpoint}`;
  const response = await fetch(url, {
    method: req.method,
    headers: {
      'X-MBX-APIKEY': process.env.BINANCE_API_KEY,
    },
    body: req.body,
  });

  const text = await response.text();
  return new Response(text, {
    status: response.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    },
  });
}
