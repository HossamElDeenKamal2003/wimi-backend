EMKAN_BASE_URL="https://gw-pub.emkanfinance.com.sa"
EMKAN_USERNAME="3vGF1FIW9aAEjoVFQbogFzQQ7_4a"
EMKAN_PASSWORD="hj5aIYes5sd05AiL6e7_KfPMyN4a"
const axios = require('axios');

const AUTH = {
  username: EMKAN_USERNAME,
  password: EMKAN_PASSWORD,
};
async function getMerchantConfig(merchantId) {
  try {
    const response = await axios.get(
      `${EMKAN_BASE_URL}/retail/bnpl/partner-management/v1/${merchantId}/merchantConfig`,
      {
        auth: AUTH,
        headers: {
          channel: 'BNPL',
          language: 'EN',
          'caller-reference-number': Date.now().toString(),
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching merchant configuration:', error.response?.data || error.message);
    throw error;
  }
}

async function createBNPLOrder(payload) {
  try {
    const response = await axios.post(
      `${EMKAN_BASE_URL}/retail/bnpl/bff/v1/order-create`,
      payload,
      {
        auth: AUTH,
        headers: {
          channel: 'BNPL',
          'origin-source-channel': 'Neoleap_POS',
          language: 'EN',
          'caller-reference-number': Date.now().toString(),
          MERCHANT_CODE: payload.merchantCode,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Error creating BNPL order:', error.response?.data || error.message);
    throw error;
  }
}

async function getBNPLOrderStatus(orderId, merchantId) {
  try {
    const response = await axios.get(
      `${EMKAN_BASE_URL}/retail/bnpl/bff/v1/order-status/${orderId}?merchantId=${merchantId}`,
      {
        auth: AUTH,
        headers: {
          channel: 'BNPL',
          language: 'EN',
          'caller-reference-number': Date.now().toString(),
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching BNPL order status:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  getMerchantConfig,
  createBNPLOrder,
  getBNPLOrderStatus,
};