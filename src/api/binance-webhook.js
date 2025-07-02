// api/binance-webhook.js

const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

// ✅ تهيئة عميل Supabase باستخدام Service Role Key (Backend Only)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ مفتاح التحقق من Binance Webhook (Backend Only)
const BINANCE_WEBHOOK_SECRET = process.env.BINANCE_WEBHOOK_SECRET;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  // ✅ 1. تحقق من توقيع Binance Webhook (أمان مهم جدا)
  const signature = req.headers["binance-signature"]; // تحقق من اسم الهيدر في Binance docs
  const payload = JSON.stringify(req.body); // قد تحتاج raw body حسب إعداد Binance

  const hmac = crypto.createHmac("sha256", BINANCE_WEBHOOK_SECRET);
  const expectedSignature = hmac.update(payload).digest("hex");

  if (signature !== expectedSignature) {
    console.warn("Webhook signature mismatch!");
    return res.status(403).send("Forbidden");
  }

  // ✅ 2. معالجة بيانات الحدث
  const event = req.body; // البيانات الفعلية من Binance

  if (event.eventType === "deposit" && event.eventStatus === "SUCCESS") {
    const { coin, amount, address, txId, userId } = event; // تأكد من الهيكل من وثائق Binance

    try {
      // ✅ البحث عن المستخدم الذي يملك هذا العنوان
      const { data: userAddressData, error: userAddressError } = await supabase
        .from("user_deposit_addresses")
        .select("user_id, coin, network")
        .eq("address", address)
        .eq("coin", coin)
        .single();

      if (userAddressError || !userAddressData) {
        console.error("Deposit received for unknown address or user:", address);
        return res.status(404).send("User address not found");
      }

      const actualUserId = userAddressData.user_id;

      // ✅ تحديث سجل الإيداع في Supabase
      const { error: updateDepositError } = await supabase
        .from("deposits")
        .update({
          status: "confirmed",
          amount_received: amount,
          tx_id: txId,
        })
        .eq("user_id", actualUserId)
        .eq("binance_address", address)
        .eq("status", "pending");

      if (updateDepositError) throw updateDepositError;

      // ✅ تحديث رصيد المستخدم في جدول profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("current_balance, total_deposited, current_level")
        .eq("id", actualUserId)
        .single();

      if (profileError) throw profileError;

      const newBalance = (parseFloat(profile.current_balance) || 0) + parseFloat(amount);
      const newTotalDeposited = (parseFloat(profile.total_deposited) || 0) + parseFloat(amount);

      const { error: updateProfileError } = await supabase
        .from("profiles")
        .update({
          current_balance: newBalance,
          total_deposited: newTotalDeposited,
          // يمكنك هنا مستقبلاً تعديل مستوى المستخدم حسب إجمالي الإيداع
        })
        .eq("id", actualUserId);

      if (updateProfileError) throw updateProfileError;

      // ✅ يمكنك استدعاء أي منطق إضافي مثل تفعيل مهام المستخدم
      // await enableUserTasks(actualUserId, profile.current_level);

      res.status(200).send("Deposit confirmed and processed");

    } catch (error) {
      console.error("Error processing Binance webhook:", error.message);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.status(200).send("Event received"); // تأكيد استلام الأحداث الأخرى
  }
};
