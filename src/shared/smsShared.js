const appKey = "cVAMDuyfbXOrpAKQh8iSEY6nJaPZ23c4zg2xt6nS"; 
const appSecret = "FKpDsrxRYqT3iEK7wun6Hpd3qfl9U6EoGPGCtY1QZsYhpqSJcNHpmyMex7gL8VCysZpoWXU8ph2i6HC8YQkjPpjiAHuFYCO056cC"; 
const axios = require('axios');
function generateToken(arg1, arg2) {
  return Buffer.from(`${arg1}:${arg2}`).toString('base64');
}

function triggerSmsApi(phoneNumber, otp) {
const token = generateToken(appKey, appSecret);
  const url = 'https://api-sms.4jawaly.com/api/v1/account/area/sms/send';
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'myApp/1.0',
    'Authorization': `Basic ${token}`,
  };

  const data = {
    messages: [
      {
        text:`اهلا بك عميل ويمي رمز التحقق الخاص بك هو ${otp}`,
        numbers: [phoneNumber],
        number_iso: "SA",
        sender: "WIMI"
      }
    ],
    globals: {
      number_iso: "SA",
      sender: "WIMI"
    }
  };

  return axios.post(url, data, { headers })
    .then(res => {
      console.log("✅ SMS Sent Successfully:", res.data);
      return res.data;
    })
    .catch(err => {
      console.error("❌ Error Sending SMS:", err.response?.data || err.message);
      throw err;
    });
}
const sendSms = async (phoneNumber, otp) => {
  try {
    await triggerSmsApi(phoneNumber, otp);
    console.log("✅ SMS sent successfully");
    return true;
  } catch (error) {
    console.error("❌ Error sending SMS:", error);
    return false;
  }
};

module.exports = { sendSms };