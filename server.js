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
const DirectPayment = require("./src/domain/models/directPaymentModel");
const { directPayment } = require('./src/application/traderService');

// ✅ تماراً sandbox token
const tamaraToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhY2NvdW50SWQiOiIwODllMWZhOC02NWUxLTRjMzgtOWE4OC0zMTNjYzgwNjdhNDUiLCJ0eXBlIjoibWVyY2hhbnQiLCJzYWx0IjoiYzFmMGRlYjI4ZjY2MWRlYmJjZjhiMDdiNzgzZjE1NzQiLCJyb2xlcyI6WyJST0xFX01FUkNIQU5UIl0sImlhdCI6MTc1NzUzNTg4MiwiaXNzIjoiVGFtYXJhIn0.nFFoRg1Nu73uGE2UK2P9n3SvIkxqyx6Tf7t91zHJHahbTZrgG0e0rY_RiUlud55V8M2MBHf4b670IzAH5H6zTYpfO-LXThujZCy59WM77lthZRC7NDljxN3313PepjZRNYXmN5T51NRsutCP8Pp9RZbjsL34OV71XQvik9Mb890LXowAmQJtGvzg-_dV-ICm8QKSGFqDyZqMaRDp3BxOku7xBC7_7g1eFvS7UcBYmJtlurS69g6Kwg830oT27Uy1ZoW9aPJZwtJxlJTY43H9OHdp3BddBme5VO1Ixkg7eX7nguo27S0a8jIsFL2h46PXkf0VxSDZ_KpxaU51L3Uksw"; // حط التوكن في env بدل ما تكتبه صريح

// ✅ عند نجاح الدفع
app.get("/payment/success", async (req, res) => {
  try {
    const { orderId, paymentStatus } = req.query;
    console.log("✅ Payment Successful:", { orderId, paymentStatus });

    let order = await Orders.findOne({ tamaraId: orderId });
    if (order) {
      order.paymentState = "Completed";
      await order.save();
      console.log("💾 Updated normal order paymentState to Completed");
    } else {
      // لو مش موجود في Orders نحاول نجيبه من DirectPayment
      const directPaymentOrder = await DirectPayment.findOne({ tamaraId: orderId });
      if (directPaymentOrder) {
        directPaymentOrder.orders.forEach((item) => (item.status = "completed"));
        await directPaymentOrder.save();
        console.log("💾 Updated DirectPayment order status to completed");
      } else {
        console.log("⚠️ Order not found in both models");
      }
    }

    // رد للمستخدم
    res.send(`✅ Payment Successful !`);

  } catch (error) {
    console.error("🔥 Error in /payment/success:", error.response?.data || error.message);
    res.status(500).send("❌ Error while handling payment success.");
  }
});
const tamara = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhY2NvdW50SWQiOiJkYzE2ZTVhNC1jNTc1LTQwYjUtYWQ1YS03NmI1NTk5NTM1YmQiLCJ0eXBlIjoibWVyY2hhbnQiLCJzYWx0IjoiMjFiODk4MGMtNjEzMC00M2QxLTg2ZmUtYmIwNzUxZDdjZDFlIiwicm9sZXMiOlsiUk9MRV9NRVJDSEFOVCJdLCJpc010bHMiOmZhbHNlLCJpYXQiOjE3NjAwOTg4OTAsImlzcyI6IlRhbWFyYSBQUCJ9.wR30jMizLl_UMsgwSvzyTD92BfCv3gNPod2N0-beFbjwwq_GbvKQQ1FmtbchVL5drVviqWFp1mod5qUp-4MTfK2uJgOAhudEQSEhS6-F5mJ8wM0mfGT47E3oS-zrtL4Y1WJBaRIgytFNk0B8L1TQrrFHcg48we1bhbb6nLEfP0W_F7_aqJw9xDLRyyoDLAzKEskV4kfaCWbejMHe5QJjFvAgx_3prRdC-22_fpPNDi506XODoZ9DC4rSBBIhjOknV--8SZuXF4rjZOiqzpN2Rk6PrM4s62_PDNFbJdcjvVPggrWGTXRwk3VNxdmxMYW-eqcjQ4ngsOum9SUtNj3QpA"


app.post('/payment/tamara/webhook', async (req, res) => {
  try {
    const { order_id, order_reference_id } = req.body;
    console.log("🧾 Webhook received from Tamara:", req.body);

    // Step 1: Authorize order
    const tamaraResponse = await axios.post(
      `https://api.tamara.co/orders/${order_id}/authorise`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tamara}`,
        },
      }
    );
    console.log("✅ Tamara authorization response:", tamaraResponse.data.authorized_amount.amount);
    console.log("orderId : ", tamaraResponse.data.order_id)
    const authorizedAmount = Number(tamaraResponse.data.authorized_amount.amount);

    // Step 2: Try to find the order in your DB
    let order = await Orders.findOne({ _id: order_reference_id });
    if (order) {
      order.paymentState = "Completed";
      await order.save();
      const payload = {
        order_id: tamaraResponse.data.order_id,
        total_amount: {
          amount: authorizedAmount,
          currency: "SAR"
        }
      };

      console.log("Capture request payload:", JSON.stringify(payload, null, 2));

      const captureRes = await axios.post(
        'https://api.tamara.co/payments/capture',
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${tamara}`,
          },
        }
      );

console.log("💰 Payment capture response:", captureRes.data);

      console.log("💰 Payment capture response:", captureRes.data);
      console.log("💾 Updated main order to 'Completed'");
    } else {
      // Step 3: Try direct payment
      const directOrder = await DirectPayment.findOne({ _id: order_reference_id });
      if (directOrder) { 
        console.log(directOrder)
        directOrder.status = "Completed";
        await directOrder.save();
        const captureRes = await axios.post(
          'https://api.tamara.co/payments/capture',
          {
            order_id: tamaraResponse.data.order_id,
            total_amount: {
              amount: authorizedAmount,
              currency: "SAR"
            }
          },
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${tamara}`,
            },
          }
        );

        console.log("💰 Payment capture response:", captureRes.data);
        console.log("💾 Updated direct order to 'Completed'");
      } else {
        console.warn("⚠️ No matching order found for reference:", order_reference_id);
      }
    }

    // Step 4: Always respond 200 to Tamara
    return res.status(200).json({
      success: true,
      message: `Order ${order_reference_id} processed successfully`
    });

  } catch (error) {
    console.log(error)
    console.error("❌ Tamara Webhook Error:", error.response?.data || error.message);
    // Always respond with 200 (Tamara expects acknowledgment)
    return res.status(200).json({
      success: false,
      message: error.response?.data || error.message
    });
  }
});

const traders = require('./src/domain/models/trader');
const trader = require('./src/domain/models/trader');

app.post('/payment/notification', async (req, res) => {
  try {
    const { order_id, order_reference_id } = req.body;
    console.log("🧾 Webhook received from Tamara:", req.body);

    // Step 1: Authorize order
    const tamaraResponse = await axios.post(
      `https://api.tamara.co/orders/${order_id}/authorise`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tamara}`,
        },
      }
    );

    console.log("✅ Tamara authorization response:", tamaraResponse.data.authorized_amount.amount);
    console.log("orderId : ", tamaraResponse.data.order_id)
    const authorizedAmount = Number(tamaraResponse.data.authorized_amount.amount);

    // Step 2: Try to find the order in your DB
    let order = await Orders.findOne({ _id: order_reference_id });
    let walletUpdated = false; // <-- FLAG لمنع مضاعفة المحفظة

    if (order) {
      console.log("order : ", order)
      const traderId = order.products[0].traderId;
      const traderWallet = await trader.findOne({ _id: traderId });
      const total = order.products.reduce((sum, p) => sum + p.price, 0);

      if (!walletUpdated) {
        traderWallet.wallet += total; // زيادة المحفظة مرة واحدة فقط
        await traderWallet.save();
        walletUpdated = true;
      }

      order.paymentState = "Completed";
      await order.save();

      const payload = {
        order_id: tamaraResponse.data.order_id,
        total_amount: {
          amount: authorizedAmount,
          currency: "SAR"
        }
      };

      console.log("Capture request payload:", JSON.stringify(payload, null, 2));

      const captureRes = await axios.post(
        'https://api.tamara.co/payments/capture',
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${tamara}`,
          },
        }
      );

      console.log("💰 Payment capture response:", captureRes.data);
      console.log("💾 Updated main order to 'Completed'");
    } else {
      // Step 3: Try direct payment
      const directOrder = await DirectPayment.findOne({ _id: order_reference_id });
      const total = directOrder.orders.reduce((sum, p) => sum + p.price, 0);

      if (directOrder) { 
        console.log(directOrder)
        directOrder.orders = directOrder.orders.map(item => ({
          ...item,
          status: "completed"
        }));
        const traderId = directOrder.traderId;
        const traderWallet = await trader.findOne({ _id: traderId });

        if (!walletUpdated) {
          traderWallet.wallet += total; // زيادة المحفظة مرة واحدة فقط
          await traderWallet.save();
          walletUpdated = true;
        }

        await directOrder.save();

        const captureRes = await axios.post(
          'https://api.tamara.co/payments/capture',
          {
            order_id: tamaraResponse.data.order_id,
            total_amount: {
              amount: authorizedAmount,
              currency: "SAR"
            }
          },
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${tamara}`,
            },
          }
        );

        console.log("💰 Payment capture response:", captureRes.data);
        console.log("💾 Updated direct order to 'Completed'");
      } else {
        console.warn("⚠️ No matching order found for reference:", order_reference_id);
      }
    }

    // Step 4: Always respond 200 to Tamara
    return res.status(200).json({
      success: true,
      message: `Order ${order_reference_id} processed successfully`
    });

  } catch (error) {
    console.log(error)
    console.error("❌ Tamara Webhook Error:", error.response?.data || error.message);

    // Always respond with 200 (Tamara expects acknowledgment)
    return res.status(200).json({
      success: false,
      message: error.response?.data || error.message
    });
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