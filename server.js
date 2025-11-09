// server.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./src/confiq/dbConfiq');
const dotenv = require('dotenv');
const routes = require('./src/interfaces/routes/index');
const morgan = require('morgan');
dotenv.config({ path: './src/.env' });
require('./src/domain/whatsapp/whatsapp');
const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mydb';
const listEndpoints = require('express-list-endpoints');
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan('dev'));
app.get('/', (req, res) => {
    res.send('Server is running!');
});



app.use('/', routes);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
const axios = require("axios");
const Orders = require("./src/domain/models/orders");
const DirectPayment = require("./src/application/directPayemntorders");

// ✅ تماراً sandbox token
const tamaraToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhY2NvdW50SWQiOiIwODllMWZhOC02NWUxLTRjMzgtOWE4OC0zMTNjYzgwNjdhNDUiLCJ0eXBlIjoibWVyY2hhbnQiLCJzYWx0IjoiYzFmMGRlYjI4ZjY2MWRlYmJjZjhiMDdiNzgzZjE1NzQiLCJyb2xlcyI6WyJST0xFX01FUkNIQU5UIl0sImlhdCI6MTc1NzUzNTg4MiwiaXNzIjoiVGFtYXJhIn0.nFFoRg1Nu73uGE2UK2P9n3SvIkxqyx6Tf7t91zHJHahbTZrgG0e0rY_RiUlud55V8M2MBHf4b670IzAH5H6zTYpfO-LXThujZCy59WM77lthZRC7NDljxN3313PepjZRNYXmN5T51NRsutCP8Pp9RZbjsL34OV71XQvik9Mb890LXowAmQJtGvzg-_dV-ICm8QKSGFqDyZqMaRDp3BxOku7xBC7_7g1eFvS7UcBYmJtlurS69g6Kwg830oT27Uy1ZoW9aPJZwtJxlJTY43H9OHdp3BddBme5VO1Ixkg7eX7nguo27S0a8jIsFL2h46PXkf0VxSDZ_KpxaU51L3Uksw"; // حط التوكن في env بدل ما تكتبه صريح

// ✅ عند نجاح الدفع
app.get("/payment/success", async (req, res) => {
  try {
    const { orderId, paymentStatus } = req.query;
    console.log("✅ Payment Successful:", { orderId, paymentStatus });

    // استدعاء Authorise API من تمارا
    const response = await axios.post(
      `https://api-sandbox.tamara.co/payments/authorise`,
      { order_id: orderId },
      {
        headers: {
          Authorization: `Bearer ${tamaraToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("🟢 Tamara Authorise Response:", response.data);

    // نحاول نجيب الطلب من orders العادي
    let order = await Orders.findOne({ tamaraId: orderId });
    if (order) {
      order.paymentState = "Completed";
      await order.save();
      console.log("💾 Updated normal order paymentState to Completed");
    } else {
      // لو مش موجود في Orders نحاول نجيبه من DirectPayment
      const directPaymentOrder = await DirectPayment.findOne({ tamaraId: orderId });
      if (directPaymentOrder) {
        directPaymentOrder.orders.forEach((item) => (item.status = "paid"));
        await directPaymentOrder.save();
        console.log("💾 Updated DirectPayment order status to paid");
      } else {
        console.log("⚠️ Order not found in both models");
      }
    }

    // رد للمستخدم
    res.send(`✅ Payment Successful! Order ${orderId} authorised successfully.`);

  } catch (error) {
    console.error("🔥 Error in /payment/success:", error.response?.data || error.message);
    res.status(500).send("❌ Error while handling payment success.");
  }
});

// ✅ عند إلغاء الدفع
app.get("/payment/cancel", (req, res) => {
  const { orderId, paymentStatus } = req.query;
  console.log("❌ Payment Canceled:", { orderId, paymentStatus });
  res.send("❌ Payment was canceled by the user.");
});

// ✅ عند فشل الدفع
app.get("/payment/failure", (req, res) => {
  const { orderId, paymentStatus } = req.query;
  console.log("⚠️ Payment Failed:", { orderId, paymentStatus });
  res.send("⚠️ Payment Failed or Cancelled.");
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});

const endpoints = listEndpoints(app);
console.log(JSON.stringify(endpoints, null, 2));
connectDB(MONGO_URI).catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
});