// poll-deposits.cjs
const fetch = require('node-fetch');
const crypto = require('crypto');
const { Spot } = require('@binance/connector');

// تهيئة عميل Binance
const binance = new Spot(
  process.env.BINANCE_API_KEY,
  process.env.BINANCE_API_SECRET
);

let lastTxId = null; // سيتذكر المعاملة الأخيرة المعالجة

async function pollDeposits() {
  try {
    // استعلام سجل الإيداعات لـ USDT
    const res = await binance.depositHistory('USDT');
    const deposits = res.data || [];
    // نرتبها من الأقدم للأحدث
    deposits.sort((a, b) => a.insertTime - b.insertTime);

    for (const dep of deposits) {
      // نتوقف إن وصلنا للمعاملة الأخيرة التي عالجناها بالفعل
      if (dep.txId === lastTxId) break;
      // نتخطى غير المؤكدة
      if (dep.status !== 1) continue; // 1 = SUCCESS

      // بناء payload واجهة الويب هوك
      const payload = {
        eventType: 'deposit',
        eventStatus: 'SUCCESS',
        coin: dep.coin,
        amount: dep.amount,
        address: dep.address,
        txId: dep.txId,
        // هنا: ضع طريقتك لاسترجاع userId بناءً على العنوان
        userId: '<<USER_ID_FROM_DB>>'
      };
      const body = JSON.stringify(payload);

      // توقيع HMAC للتحقق
      const signature = crypto
        .createHmac('sha256', process.env.BINANCE_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      // إرسال إلى endpoint في Vercel
      await fetch(process.env.WEBHOOK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'binance-signature': signature
        },
        body
      });

      // حدّث آخر TxId
      lastTxId = dep.txId;
    }
  } catch (err) {
    console.error('Polling error:', err);
  }
}

// شغّل poll كل 60 ثانية
setInterval(pollDeposits, 60 * 1000);
// وشغل أول دورة فوراً
pollDeposits();
