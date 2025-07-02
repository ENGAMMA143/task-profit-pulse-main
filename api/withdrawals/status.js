// api/withdrawals/status.js
export const config = { runtime: 'edge', regions: ['fra1'] };

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
export default async function handler(req) {
  if (req.method !== 'GET') return new Response(null, { status: 405 });
  const userId = await getUserId(req);
  if (!userId) return new Response(null, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('withdrawalId');
  if (!id) return new Response(null, { status: 400 });

  const { data: wd, error } = await supabase
    .from('withdrawals')
    .select('status, completed_at')
    .eq('id', id)
    .single();

  if (error || !wd) return new Response(null, { status: 404 });
  if (wd.user_id !== userId) return new Response(null, { status: 403 });

  return new Response(JSON.stringify({ status: wd.status, completed_at: wd.completed_at }), { status: 200 });
}
