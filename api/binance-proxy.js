// api/binance-proxy.js

export const config = {
  runtime: 'edge',         // ليعمل كـ Edge Function
  regions: ['fra1'],       // فرانكفورت لأفضل تغطية وتجنّب الحظر
};

export default async function handler(request) {
  // نقرأ قيمة endpoint من الاستعلام، أو نستخدم "ping" افتراضياً
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint') || 'ping';

  // نبني رابط Binance API الكامل
  const url = `https://api.binance.com/api/v3/${endpoint}`;

  // نرسل الطلب إلى Binance مع المفتاح
  const resp = await fetch(url, {
    method: request.method,
    headers: {
      'X-MBX-APIKEY': process.env.BINANCE_API_KEY,
      // إذا عندك رؤوس أخرى تحتاجها ضيفها هنا
    },
    body: request.method !== 'GET' ? await request.text() : undefined,
  });

  // نحضّر الردّ للمتصفح مع رؤوس CORS
  const body = await resp.text();
  return new Response(body, {
    status: resp.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    },
  });
}
