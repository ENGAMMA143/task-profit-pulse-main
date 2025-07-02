// api/get-deposit-address.js

const { Spot } = require("@binance/connector");
const { createClient } = require("@supabase/supabase-js");

// ✅ تهيئة عميل Binance باستخدام متغيرات البيئة
const binanceClient = new Spot(
  process.env.BINANCE_API_KEY,
  process.env.BINANCE_API_SECRET
);

// ✅ تهيئة عميل Supabase باستخدام Service Role Key (خاص بالـ Backend فقط)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  // ✅ السماح فقط بالـ POST لأسباب أمنية
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const { userId, coin, network } = req.body; // المدخلات المتوقعة من الـ Frontend

  if (!userId || !coin || !network) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    // ✅ 1. التحقق هل العنوان موجود مسبقًا للمستخدم من قاعدة البيانات
    const { data: existingAddress, error: dbError } = await supabase
      .from("user_deposit_addresses")
      .select("address")
      .eq("user_id", userId)
      .eq("coin", coin)
      .eq("network", network)
      .single();

    let depositAddress;

    if (dbError && dbError.code === "PGRST116") {
      // ✅ 2. إذا لا يوجد عنوان، طلب عنوان جديد من Binance
      const response = await binanceClient.depositAddress(coin, { network });
      depositAddress = response.data.address;

      // ✅ 3. تخزين العنوان الجديد في Supabase
      const { error: insertError } = await supabase
        .from("user_deposit_addresses")
        .insert({
          user_id: userId,
          coin,
          network,
          address: depositAddress,
        });

      if (insertError) throw insertError;

    } else if (dbError) {
      // ✅ أي خطأ آخر في قاعدة البيانات
      throw dbError;
    } else {
      // ✅ 4. إذا العنوان موجود مسبقًا
      depositAddress = existingAddress.address;
    }

    res.status(200).json({ address: depositAddress });

  } catch (error) {
    console.error("Error in get-deposit-address function:", error.message);
    res.status(500).json({ error: "Failed to retrieve or generate deposit address" });
  }
};
