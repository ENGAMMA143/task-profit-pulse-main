// api/deposits/confirm.js
export const config = { runtime: 'edge', regions: ['fra1'] };

import { supabase } from '../../src/lib/supabase';

export default async function handler() {
  // جلب جميع الإيداعات المعلقة
  const { data: pendings, error } = await supabase
    .from('deposits')
    .select('*')
    .eq('status', 'pending');

  if (error) console.error('Fetch pendings error:', error);

  for (const dep of pendings || []) {
    // تحقق من سجلّات Binance
    const res = await fetch(
      `https://api.binance.com/sapi/v1/capital/deposit/hisrec?coin=${dep.coin}&network=${dep.network}`,
      { headers: { 'X-MBX-APIKEY': process.env.BINANCE_API_KEY } }
    );
    const recs = await res.json();
    const match = Array.isArray(recs)
      ? recs.find(r => r.address === dep.address && parseFloat(r.amount) >= parseFloat(dep.amount))
      : null;

    if (match) {
      // حدِّث الحالة وفتح مهمة
      await supabase
        .from('deposits')
        .update({ status: 'confirmed', tx_id: match.txId, confirmed_at: new Date() })
        .eq('id', dep.id);

      await supabase
        .from('tasks')
        .insert({ user_id: dep.user_id, deposit_id: dep.id, type: 'after_deposit', payload: {} });
    }
  }

  return new Response('OK', { status: 200 });
}
