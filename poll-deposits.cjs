// poll-deposits.cjs

// نستخدم CommonJS لأن package.json يحدد "type": "module"
const fetch = require('node-fetch');
const crypto = require('crypto');
const { Spot } = require('@binance/connector');
const { createClient } = require('@supabase/supabase-js');

// 1. تهيئة عملاء Binance و Supabase
const binance = new Spot(
  process.env.BINANCE_API_KEY,
  process.env.BINANCE_API_SECRET
);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 2. سنحتفظ بالـ txId الأخير حتى لا نكرر المعالجة
let lastTxId = null;

async function pollDeposits() {
  try {
    // 3. استعلام سجل الإيداعات من Binance (USDT مثلاً)
    const res = await binance.depositHistory('USDT');
    const deposits = res.data || [];
    deposits.sort((a, b) => a.insertTime - b.insertTime);

    for (const dep of deposits) {
      if (dep.txId === lastTxId) break;        // نتوقف إن وصلنا لما سبق معالجته
      if (dep.status !== 1) continue;          // نتخطى غير المؤكدة (1 = SUCCESS)

      const { coin, amount, address, txId } = dep;

      // 4. استعلام Supabase لجدول user_deposit_addresses حسب العنوان + العملة
      const { data: addrRow, error: addrError } = await supabase
        .from('user_deposit_addresses')
        .select('user_id')
        .eq('address', address)
        .eq('coin', coin)
        .single();

      if (addrError || !addrRow) {
        console.warn(`Address not found in DB: ${address}`);
        lastTxId = txId;  // نحدّث الأخير حتى لا نحاولها مجدداً
        continue;
      }

      const userId = addrRow.user_id;

      // 5. بناء payload ويب هوك
      const payload = {
        eventType: 'deposit',
        eventStatus: 'SUCCESS',
        coin,
        amount,
        address,
        txId,
        userId
      };
      const body = JSON.stringify(payload);

      // 6. توقيع HMAC للتحقق
      const signature = crypto
        .createHmac('sha256', process.env.BINANCE_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      // 7. إرسال إلى endpoint في Vercel
      await fetch(process.env.WEBHOOK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'binance-signature': signature
        },
        body
      });

      console.log(`✅ Forwarded deposit ${txId} for user ${userId}`);

      // 8. حدّث آخر TxId حتى لا نكرر
      lastTxId = txId;
    }
  } catch (err) {
    console.error('Polling error:', err);
  }
}

// 9. جدولة Polling كل دقيقة
setInterval(pollDeposits, 60 * 1000);
pollDeposits();
