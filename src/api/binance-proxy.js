// pages/api/binance-proxy.js
export const config = {
  runtime: 'edge',
  regions: ['fra1'],  // فرانكفورت، ألمانيا
};

export default async function handler(req) {
  const url = new URL(req.url);
  // استبدل host/path حسب نقطة النهاية المطلوبة في Binance
  url.hostname = 'api.binance.com';
  url.pathname = '/api/v3/' + url.searchParams.get('endpoint');

  const response = await fetch(url.toString(), {
    method: req.method,
    headers: {
      // أنقل أي رؤوس ضرورية، مثل API-KEY
      'X-MBX-APIKEY': process.env.BINANCE_API_KEY,
    },
    body: req.body,
  });

  // أضف CORS إذا أردت استدعاءه من المتصفح مباشرة
  const res = new Response(await response.text(), {
    status: response.status,
    headers: {
      ...Object.fromEntries(response.headers),
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    },
  });
  return res;
}
