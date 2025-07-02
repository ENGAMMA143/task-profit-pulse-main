// api/withdrawals/create.js
export const config = { runtime: 'edge', regions: ['fra1'] };

import { supabase, getUserId } from '../../src/lib/supabase';
import crypto from 'crypto';

export default async function handler(req) {
  if (req.method !== 'POST') return new Response(null, { status: 405 });
  const userId = await getUserId(req);
  if (!userId) return new Response(null, { status: 401 });

  const { coin, amount, address, tag } = await req.json();
  if (!coin || !amount || !address) {
    return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
  }

  // تحقق من رصيد الأرباح
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('profit_balance')
    .eq('id', userId)
    .single();

  if (userErr || !user) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
  }
  if (parseFloat(user.profit_balance) < parseFloat(amount)) {
    return new Response(JSON.stringify({ error: 'Insufficient profit balance' }), { status: 400 });
  }

  // جهّز توقيع HMAC للطلب
  const timestamp = Date.now();
  let params = `coin=${coin}&address=${address}&amount=${amount}&timestamp=${timestamp}`;
  if (tag) params += `&addressTag=${tag}`;

  const signature = crypto.createHmac('sha256', process.env.BINANCE_API_SECRET)
    .update(params).digest('hex');

  // أرسل طلب السحب إلى Binance
  const resp = await fetch(
    `https://api.binance.com/sapi/v1/capital/withdraw/apply?${params}&signature=${signature}`,
    {
      method: 'POST',
      headers: { 'X-MBX-APIKEY': process.env.BINANCE_API_KEY }
    }
  );
  const body = await resp.json();
  if (!resp.ok) {
    return new Response(JSON.stringify({ error: body.msg || 'Withdraw error' }), { status: 502 });
  }

  // خصم الرصيد وتسجیل السحب
  await supabase
    .from('users')
    .update({ profit_balance: user.profit_balance - parseFloat(amount) })
    .eq('id', userId);

  const { data: wd, error: wdErr } = await supabase
    .from('withdrawals')
    .insert({
      user_id: userId,
      coin,
      amount,
      address,
      tag,
      tx_id: body.id,
      status: 'submitted'
    })
    .select('id, tx_id')
    .single();

  if (wdErr) {
    return new Response(JSON.stringify({ error: wdErr.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ withdrawalId: wd.id, tx_id: wd.tx_id }), { status: 200 });
}
