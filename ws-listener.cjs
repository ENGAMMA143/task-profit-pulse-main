// ws-listener.js
require('dotenv').config();        // إن كنت تستخدم ملف .env محلياً
const WebSocket = require('ws');
const fetch = require('node-fetch');
const crypto = require('crypto');

async function getListenKey() {
  const res = await fetch('https://api.binance.com/api/v3/userDataStream', {
    method: 'POST',
    headers: { 'X-MBX-APIKEY': process.env.BINANCE_API_KEY }
  });
  const { listenKey } = await res.json();
  return listenKey;
}

async function start() {
  const listenKey = await getListenKey();
  const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${listenKey}`);

  ws.on('open', () => console.log('⚡ WebSocket connected'));
  ws.on('message', async raw => {
    const event = JSON.parse(raw);

    // مثال: نرسل كل balanceUpdate أو executionReport
    if (['balanceUpdate','outboundAccountPosition','executionReport'].includes(event.e)) {
      const payload = JSON.stringify(event);
      const signature = crypto
        .createHmac('sha256', process.env.BINANCE_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

      await fetch(`${process.env.WEBHOOK_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'binance-signature': signature
        },
        body: payload,
      });
    }
  });

  ws.on('close', () => {
    console.warn('WebSocket closed – reconnecting in 1s…');
    setTimeout(start, 1000);
  });

  ws.on('error', err => {
    console.error('WebSocket error', err);
    ws.close();
  });
}

start().catch(console.error);
