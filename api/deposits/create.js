// api/deposits/create.js
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

  const { coin, network, amount } = await req.json();
  if (!coin || !network || !amount) {
    return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
  }

  // استرجع العنوان المسجَّل
  const { data: addr, error: addrErr } = await supabase
    .from('user_deposit_addresses')
    .select('address, tag')
    .eq('user_id', userId)
    .eq('coin', coin)
    .eq('network', network)
    .single();

  if (addrErr || !addr) {
    return new Response(JSON.stringify({ error: 'Deposit address not found' }), { status: 404 });
  }

  // سجلّ العملية في جدول deposits
  const { data: deposit, error: depErr } = await supabase
    .from('deposits')
    .insert({
      user_id: userId,
      coin,
      network,
      amount,
      address: addr.address,
      tag: addr.tag,
      status: 'pending',
    })
    .select('id')
    .single();

  if (depErr) {
    return new Response(JSON.stringify({ error: depErr.message }), { status: 500 });
  }

  return new Response(
    JSON.stringify({ depositId: deposit.id, address: addr.address, tag: addr.tag }),
    { status: 200 }
  );
}
