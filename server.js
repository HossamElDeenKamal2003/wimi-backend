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

app.get('/emkan/success', async(req, res)=>{
  res.status(200).send("Sucess Payment");
})

app.get('/emkan/failure', async(req, res)=>{
  res.status(200).send("Failed Payment");
})


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

    let redirectOrderId = null;

    // ابحث في Orders
    let order = await Orders.findOne({ tamaraId: orderId });
    if (order) {
      order.paymentState = "Completed";
      await order.save();
      redirectOrderId = order._id;
      console.log("💾 Updated normal order paymentState to Completed");
    } else {
      // ابحث في DirectPayment
      const directPaymentOrder = await DirectPayment.findOne({ tamaraId: orderId });
      if (directPaymentOrder) {
        directPaymentOrder.orders.forEach((item) => (item.status = "completed"));
        await directPaymentOrder.save();
        redirectOrderId = directPaymentOrder._id;
        console.log("💾 Updated DirectPayment order status to completed");
      } else {
        console.log("⚠️ Order not found in both models");
      }
    }

    if (!redirectOrderId) {
      return res.send("⚠️ Payment successful, but order not found.");
    }

    // صفحة تعرض رسالة ثم Redirect تلقائي
    res.send(`
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Payment Success</title>
          <meta http-equiv="refresh" content="2;url=https://wimi.sa/checkout-payment/${redirectOrderId}" />
          <style>
            body { 
              font-family: Arial; 
              background: #f6fff8; 
              text-align: center; 
              padding-top: 80px;
            }
            .box {
              display: inline-block;
              padding: 20px 30px;
              border-radius: 10px;
              background: #e6ffed;
              border: 1px solid #b6f2c9;
              color: #059669;
              font-size: 18px;
            }
          </style>
        </head>
        <body>
          <div class="box">
            ✅ تم الدفع بنجاح<br/>
            سيتم إعادتك للطلب خلال ثانيتين...
          </div>
        </body>
      </html>
    `);

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

    if (!tamaraResponse.data || !tamaraResponse.data.authorized_amount) {
      throw new Error("Tamara authorization failed");
    }

    console.log("✅ Tamara authorization response:", tamaraResponse.data.authorized_amount.amount);

    const authorizedAmount = Number(tamaraResponse.data.authorized_amount.amount);

    // Step 2: Try to find the order in your DB
    let order = await Orders.findOne({ _id: order_reference_id });

    if (order) {
      // Update only if payment not completed yet
      if (order.paymentState !== "completed") {
        const traderId = order.products[0].traderId;
        const traderWallet = await trader.findOne({ _id: traderId });
        const total = order.products.reduce((sum, p) => sum + p.price, 0);

        traderWallet.wallet += total; // زيادة المحفظة مرة واحدة
        await traderWallet.save();

        order.paymentState = "completed";
        await order.save();

        // Capture payment
        const payload = {
          order_id: tamaraResponse.data.order_id,
          total_amount: {
            amount: authorizedAmount,
            currency: "SAR"
          }
        };

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
        console.log("⚠️ Order already completed, skipping wallet update and capture");
      }
    } else {
      // Step 3: Handle DirectPayment similarly
      const directOrder = await DirectPayment.findOne({ _id: order_reference_id });

      if (directOrder && !directOrder.isCompleted) {
        const total = directOrder.orders.reduce((sum, p) => sum + p.price, 0);
        const traderId = directOrder.traderId;
        const traderWallet = await trader.findOne({ _id: traderId });

        traderWallet.wallet += total;
        await traderWallet.save();

        directOrder.orders = directOrder.orders.map(item => ({
          ...item,
          status: "completed"
        }));
        directOrder.isCompleted = true;
        await directOrder.save();

        await axios.post(
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

        console.log("💾 Updated direct order to 'Completed'");
      } else {
        console.warn("⚠️ No matching order found or already completed:", order_reference_id);
      }
    }

    // Step 4: Always respond 200 to Tamara
    return res.status(200).json({
      success: true,
      message: `Order ${order_reference_id} processed successfully`
    });

  } catch (error) {
    console.error("❌ Tamara Webhook Error:", error.response?.data || error.message);
    return res.status(200).json({
      success: false,
      message: error.response?.data || error.message
    });
  }
});



app.post('/emkan/callback', async(req, res)=>{
  const data = req.body;
  console.log("Emkan callback body:", data);

  let walletUpdated = false;

  try {
    const orderId = data.orderCode;

    // البحث في Orders
    const order = await Orders.findOne({ emkanId: orderId });

    if(data.eventCode === 'DOWN_PAYMENT_SUCCESS' || data.eventCode === 'SUCCESS') {

      if(order) {
        const traderId = order.products[0].traderId;
        const traderWallet = await trader.findById(traderId);
        const total = order.products.reduce((sum, p) => sum + p.price, 0);

        if (!walletUpdated) {
          traderWallet.wallet += total;
          await traderWallet.save();
          walletUpdated = true;
        }

        order.paymentState = "Completed";
        await order.save();

      } else {
        // البحث في DirectPayment
        const directOrder = await DirectPayment.findOne({ emaknId: orderId });
        if(directOrder) {
          const total = directOrder.orders.reduce((sum, p) => sum + p.price, 0);
          directOrder.orders = directOrder.orders.map(item => ({ ...item, status: "completed" }));

          const traderId = directOrder.traderId;
          const traderWallet = await trader.findById(traderId);

          if (!walletUpdated) {
            traderWallet.wallet += total;
            await traderWallet.save();
            walletUpdated = true;
          }

          await directOrder.save();
        }
      }
    }

    return res.status(200).send("Callback processed");

  } catch(error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
});




// ✅ عند إلغاء الدفع
app.get("/payment/cancel", async (req, res) => {
  try {
    const { orderId, paymentStatus } = req.query;

    console.log("❌ Payment Canceled:", { orderId, paymentStatus });

    // ابحث في Orders
    let order = await Orders.findOne({ tamaraId: orderId }).select("_id");

    // لو مش موجود ابحث في DirectPayment
    if (!order) {
      order = await DirectPayment.findOne({ tamaraId: orderId }).select("_id");
    }

    if (!order) {
      return res.status(404).send("Order not found");
    }

    // صفحة تعرض رسالة للمستخدم ثم تعمل إعادة توجيه تلقائي
    res.send(`
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Payment Canceled</title>
          <meta http-equiv="refresh" content="2;url=https://wimi.sa/checkout-payment/${order._id}" />
          <style>
            body { 
              font-family: Arial; 
              background: #fafafa; 
              text-align: center; 
              padding-top: 80px;
            }
            .box {
              display: inline-block;
              padding: 20px 30px;
              border-radius: 10px;
              background: #fff5f5;
              border: 1px solid #ffcccc;
              color: #cc0000;
              font-size: 18px;
            }
          </style>
        </head>
        <body>
          <div class="box">
            ❌ لقد قمت بإلغاء عملية الدفع<br/>
            سيتم إعادتك لصفحة الدفع خلال ثانيتين...
          </div>
        </body>
      </html>
    `);

  } catch (error) {
    console.error("Cancel Error:", error);
    res.status(500).send("Server error");
  }
});

app.get('/tr', async (req, res) => {
  try {
    const docs = await DirectPayment.find({ traderId: "6918997108619a362c433094" });

    // اجمع كل الـ orders من كل document
    const allOrders = docs.flatMap(doc => doc.orders || []);
    console.log(allOrders.length )
    // فلترة orders المكتملة
    const ordersCompleted = allOrders.filter(item => item.status === 'completed');

    res.status(200).json({ orders: ordersCompleted });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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