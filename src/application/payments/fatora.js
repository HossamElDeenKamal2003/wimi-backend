const mongoose = require('mongoose');
const ordersModel = require('../../domain/models/orders');
const usersModel = require('../../domain/models/userModel');
const trader = require('../../domain/models/trader');
const productsModel = require('../../domain/models/products');
const response = require("../../shared/sharedResponse");
const DirectPayment = require('../../domain/models/directPaymentModel');
const tamara = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhY2NvdW50SWQiOiIwODllMWZhOC02NWUxLTRjMzgtOWE4OC0zMTNjYzgwNjdhNDUiLCJ0eXBlIjoibWVyY2hhbnQiLCJzYWx0IjoiYzFmMGRlYjI4ZjY2MWRlYmJjZjhiMDdiNzgzZjE1NzQiLCJyb2xlcyI6WyJST0xFX01FUkNIQU5UIl0sImlhdCI6MTc1NzUzNTg4MiwiaXNzIjoiVGFtYXJhIn0.nFFoRg1Nu73uGE2UK2P9n3SvIkxqyx6Tf7t91zHJHahbTZrgG0e0rY_RiUlud55V8M2MBHf4b670IzAH5H6zTYpfO-LXThujZCy59WM77lthZRC7NDljxN3313PepjZRNYXmN5T51NRsutCP8Pp9RZbjsL34OV71XQvik9Mb890LXowAmQJtGvzg-_dV-ICm8QKSGFqDyZqMaRDp3BxOku7xBC7_7g1eFvS7UcBYmJtlurS69g6Kwg830oT27Uy1ZoW9aPJZwtJxlJTY43H9OHdp3BddBme5VO1Ixkg7eX7nguo27S0a8jIsFL2h46PXkf0VxSDZ_KpxaU51L3Uksw"
const axios = require('axios');
// const tamara = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhY2NvdW50SWQiOiJkYzE2ZTVhNC1jNTc1LTQwYjUtYWQ1YS03NmI1NTk5NTM1YmQiLCJ0eXBlIjoibWVyY2hhbnQiLCJzYWx0IjoiMjFiODk4MGMtNjEzMC00M2QxLTg2ZmUtYmIwNzUxZDdjZDFlIiwicm9sZXMiOlsiUk9MRV9NRVJDSEFOVCJdLCJpc010bHMiOmZhbHNlLCJpYXQiOjE3NjAwOTg4OTAsImlzcyI6IlRhbWFyYSBQUCJ9.wR30jMizLl_UMsgwSvzyTD92BfCv3gNPod2N0-beFbjwwq_GbvKQQ1FmtbchVL5drVviqWFp1mod5qUp-4MTfK2uJgOAhudEQSEhS6-F5mJ8wM0mfGT47E3oS-zrtL4Y1WJBaRIgytFNk0B8L1TQrrFHcg48we1bhbb6nLEfP0W_F7_aqJw9xDLRyyoDLAzKEskV4kfaCWbejMHe5QJjFvAgx_3prRdC-22_fpPNDi506XODoZ9DC4rSBBIhjOknV--8SZuXF4rjZOiqzpN2Rk6PrM4s62_PDNFbJdcjvVPggrWGTXRwk3VNxdmxMYW-eqcjQ4ngsOum9SUtNj3QpA"
const CryptoJS = require("crypto-js");
const baseUrl ="https://merchants.emkanfinance.com.sa/retail/bnpl/bff/v1";
const merchantId = "887341";
const merchantCode = "WIM1";
const {  getMerchantConfig,
  createBNPLOrder,
  getBNPLOrderStatus,} = require('../../shared/emkan');

const apiKey = "3vGF1FIW9aAEjoVFQbogFzQQ7_4a";
const apiSecret = "hj5aIYes5sd05AiL6e7_KfPMyN4a";
const AUTH = {
  username: apiKey,
  password: apiSecret,
};
console.log("🚀 ~ file: fatora.js:10 ~ apiSecret:", apiSecret, "sdasasd", apiKey, "sdasd", merchantCode, "asdasd", merchantId)
function generateSignature(body) {
    const payloadString = JSON.stringify(body);
    const hash = CryptoJS.HmacSHA256(payloadString, apiSecret);
    return CryptoJS.enc.Hex.stringify(hash);
}

function addProfit(amount){
  const profit = amount * 11.5;
  return profit;
}

class FatoraService {
    async createPayment(req, res) {
        const { phoneNumber, productId, amount } = req.body;

        try {
            if (!phoneNumber || !productId || !amount) {
                return response.badRequest(res, 'phoneNumber, productId, and amount are required');
            }

            // Get user info
            const user = await usersModel.findOne({ phoneNumber: phoneNumber });
            if (!user) {
                return response.notFound(res, 'User not found');
            }
            const total =  addProfit(amount);
            // Prepare payload
            const payload = {
                amount: total,
                currency: 'SAR',
                order_id: productId,
                client: {
                    phone: phoneNumber,
                    name: `${user.firstName} ${user.lastName}`,
                },
                language: 'ar',
                success_url: 'https://backendb2b.kadinabiye.com/success',
                failure_url: 'https://backendb2b.kadinabiye.com/failure',
                save_token: false,
            };

            // Call Fatora API
            const fatoraResponse = await axios.post(
                'https://api.fatora.io/v1/payments/checkout',
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'api_key': '13db6c0f-5428-4510-a0a3-a12f70964c8a'
                    }
                }
            );

            // Return success
            return response.success(res, fatoraResponse.data);

        } catch (error) {
            console.error("Fatora API Error:", error.response?.data || error.message);
            return response.serverError(res, error.response?.data || error.message);
        }
    }

    async paymentSuccess(req, res) {
        const { order_id } = req.query;
        try {
            const verifyRes = await axios.post(
                'https://api.fatora.io/v1/payments/verify',
                { order_id },
                {
                    headers: { api_key: '13db6c0f-5428-4510-a0a3-a12f70964c8a' }
                }
            );

            const paymentData = verifyRes.data;

            // update your order in DB
            await ordersModel.findOneAndUpdate(
                { productId: order_id },
                { paymentState: 'SUCCESS', transactionId: paymentData.data?.transaction_id }
            );

            return response.success(res, { message: "Payment verified", data: paymentData });
        } catch (error) {
            console.error("Verify Error:", error.response?.data || error.message);
            return response.serverError(res, error.response?.data || error.message);
        }
    }

    async paymentFailure(req, res) {
        const { order_id } = req.query;
        try {
            await ordersModel.findOneAndUpdate(
                { productId: order_id },
                { paymentStatus: 'FAILED' }
            );
            return response.badRequest(res, "Payment failed or was cancelled");
        } catch (error) {
            return response.serverError(res, error.message);
        }
    }

    // ##################### Tamara #######################
    async createTamara(req, res) {
    const traderId = req.user?.id;
    const { orderId, total, disription } = req.body; // orderId = order_id بتاع الـ subdocument

    try {
        // 1. نلاقي الـ DirectPayment document اللي فيه الـ order
        const directPayment = await DirectPayment.findOne({_id: orderId});
        console.log("directPayment : ", directPayment);
        const phoneNumber = directPayment.orders[0].phoneNumber;
        console.log("phoneNumber : ", phoneNumber);
        const user = await usersModel.findOne({ phoneNumber: phoneNumber });
        const username = user.username;
        if (!directPayment) {
        return response.notFound(res, "الطلب مش موجود أو مش بتاعك");
        }

        // 2. نجيب الـ order نفسه من الـ array
        const order = directPayment
        if (!order) {
        return response.notFound(res, "الطلب مش موجود");
        }
        const total2 = addProfit(total);
        const payload = {
            "shipping_address": {
            "first_name": username,
            "last_name": "User",
            "line1": "King Fahd Road",
            "line2": "Olaya District",
            "region": "Riyadh",
            "postal_code": "11564",
            "city": "Riyadh",
            "country_code": "SA"
            },
        

        total_amount: {
            amount: total2,
            currency: "SAR",
        },
        shipping_amount: { amount: 0, currency: "SAR" },
        tax_amount: { amount: 0, currency: "SAR" },
        order_reference_id: order._id,
        order_number: order._id,
        items: [
            {
            name: disription || "Payment Information",
            type: "Physical",
            sku: "SKU-" + order._id, // 👈 لازم
            reference_id: order._id,
            quantity: 1,
            unit_price: {
                amount: total,
                currency: "SAR",
            },
            total_amount: {
                amount: total,
                currency: "SAR",
            },
            },
        ],
        consumer: {
            email: req.user?.email || "demo@email.com",
            first_name: req.user?.firstName || "Demo",
            last_name: req.user?.lastName || "User",
            phone_number: phoneNumber || "+966500000000",
        },
        country_code: "SA",
        description: disription,
        merchant_url: {
            cancel: "https://backendb2b.kadinabiye.compayment/cancel",
            failure: "https://backendb2b.kadinabiye.com/payment/failure",
            success: "https://backendb2b.kadinabiye.com/payment/success",
            notification: "https://backendb2b.kadinabiye.com/payment/tamara/webhook",
        },
        payment_type: "PAY_BY_INSTALMENTS",
        instalments: 3,
        platform: "ScarFace Platform",
        is_mobile: false,
        locale: "en_US",
        };

        // 4. نبعت لـ Tamara
        const tamaraResponse = await axios.post(
        "https://api-sandbox.tamara.co/checkout",
        payload,
        {
            headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tamara}`,
            },
        }
        );

        // 5. نحدث حالة الـ order ونضيف checkoutUrl
        order.status = "pending_payment";
        order.checkoutUrl = tamaraResponse.data.checkout_url; // لازم تزود field في الـ schema
        await directPayment.save();

        return response.success(res, {
        message: "تم إنشاء دفع عبر Tamara",
        checkoutUrl: tamaraResponse.data.checkout_url,
        data: tamaraResponse.data,
        });
    } catch (error) {
        console.error("Tamara API Error:", error.response?.data || error.message);
        return response.serverError(res, error.response?.data || error.message);
    }
    }

    // ############################# Emkan #############################
    async createEmkanOrder(req, res) {
    try {
      const { orderId, total, phoneNumber } = req.body;

      if (!orderId || !total || !phoneNumber) {
        return response.badRequest(res, 'orderId, total, and phoneNumber are required');
      }

      // ✅ 1. تحقق من المستخدم
      const user = await usersModel.findOne({ phoneNumber });
      if (!user) {
        return response.notFound(res, 'User not found');
      }

      // ✅ 2. استرجاع إعدادات التاجر من Emkan
      const merchantId = '887341';
      const merchantConfig = await getMerchantConfig(merchantId);
      const merchantCode = merchantConfig?.merchantCode || 'RowadAlnujoom';
      const total2 = addProfit(total);

      // ✅ 3. بناء الـ payload للطلب
      const payload = {
        orderId: `ORD-${orderId}-${Date.now()}`,
        merchantId,
        merchantCode,
        aggregatorId: 'AGGREGATOR112',
        billAmount: Number(total2),
        mobileNumber: `966${phoneNumber.replace(/^0+/, '')}`,
        successRedirectionUrl: 'https://backendb2b.kadinabiye.com/emkan/success',
        failureRedirectionUrl: 'hhttps://backendb2b.kadinabiye.com/emkan/failure',
        callbackUrl: 'https://backendb2b.kadinabiye.com/emkan/callback',
        orderItems: [
          {
            itemName: 'Order Payment',
            itemPrice: Number(total),
            quantity: 1,
          },
        ],
      };

      // ✅ 4. إنشاء الطلب عن طريق Emkan
      const orderResponse = await createBNPLOrder(payload);
      console.log('✅ BNPL Order Created:', orderResponse);
      return response.success(res, {
        message: 'تم إنشاء طلب إمكان بنجاح',
        data: orderResponse,
      });

    } catch (err) {
      console.error('❌ Emkan Error:', err.response?.data || err.message);
      return response.serverError(res, {
        error: true,
        message: err.response?.data?.description || err.message,
        details: err.response?.data || null,
      });
    }
    }

  // ✅ تابع لجلب حالة الطلب بناءً على orderId
  async getEmkanOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const merchantId = '887341';
      const orderStatus = await getBNPLOrderStatus(orderId, merchantId);
      return response.success(res, {
        message: 'حالة الطلب من إمكان',
        data: orderStatus,
      });
    } catch (err) {
      return response.serverError(res, {
        message: err.response?.data?.description || err.message,
      });
    }
  }

}
module.exports = new FatoraService();