// api/deposits/get-address.js
export const config = { runtime: 'edge', regions: ['fra1'] };

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);


export default async function handler(req) {
  if (req.method !== 'POST') return new Response(null, { status: 405 });
  const userId = await getUserId(req);
  if (!userId) return new Response(null, { status: 401 });

  const { coin, network } = await req.json();
  if (!coin || !network) {
    return new Response(JSON.stringify({ error: 'Missing coin or network' }), { status: 400 });
  }

  // اقرأ المستوى إن احتجت فرض قواعد
  // const { data: user } = await supabase.from('users').select('level').eq('id', userId).single();

  // حاول استرجاع عنوان موجود
  const { data: existing } = await supabase
    .from('user_deposit_addresses')
    .select('address, tag')
    .eq('user_id', userId)
    .eq('coin', coin)
    .eq('network', network)
    .single();

  if (existing) {
    return new Response(JSON.stringify(existing), { status: 200 });
  }

  // طلب Binance لتوليد عنوان جديد
  const resp = await fetch(
    `https://api.binance.com/sapi/v1/capital/deposit/address?coin=${coin}&network=${network}`,
    { headers: { 'X-MBX-APIKEY': process.env.BINANCE_API_KEY } }
  );
  const body = await resp.json();
  if (!resp.ok) {
    return new Response(JSON.stringify({ error: body.msg || 'Binance error' }), { status: 502 });
  }

  const { address, tag } = body;
  await supabase
    .from('user_deposit_addresses')
    .insert({ user_id: userId, coin, network, address, tag });

  return new Response(JSON.stringify({ address, tag }), { status: 200 });
}
