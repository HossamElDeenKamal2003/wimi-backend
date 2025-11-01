// const { Client, LocalAuth } = require('whatsapp-web.js');
// const qrcode = require('qrcode-terminal');
// const QRCode = require('qrcode'); // optional PNG
// const fs = require('fs');

// // ========== Infrastructure Layer ==========
// const whatsappClient = new Client({
//   authStrategy: new LocalAuth(),
//   puppeteer: {
//     headless: true,
//     args: [
//       '--no-sandbox',
//       '--disable-setuid-sandbox'
//     ]
//   }
// });

// // Track readiness
// let isWhatsappReady = false;
// let lastQr = null;
// const pendingMessages = [];

// // QR generation
// whatsappClient.on('qr', async (qr) => {
//   console.log('📲 New QR generated, scan it:');
//   qrcode.generate(qr, { small: true });

//   lastQr = qr;
//   await QRCode.toFile('qr.png', qr);
//   console.log('✅ QR saved as qr.png');
// });

// // Ready
// whatsappClient.on('ready', async () => {
//   console.log('✅ WhatsApp is ready');
//   isWhatsappReady = true;

//   // flush queued messages
//   for (const { phoneNumber, message, resolve, reject } of pendingMessages) {
//     try {
//       await whatsappClient.sendMessage(`${phoneNumber}@c.us`, message);
//       resolve();
//     } catch (err) {
//       reject(err);
//     }
//   }
//   pendingMessages.length = 0;
// });

// whatsappClient.initialize();

// // ========== Domain Layer ==========
// class Otp {
//   constructor(phoneNumber, code) {
//     this.phoneNumber = phoneNumber;
//     this.code = code;
//   }

//   static isValid(inputOtp, storedOtp) {
//     return inputOtp === storedOtp;
//   }
// }

// // ========== Application Layer ==========
// const otpStore = new Map();

// function generateOtp() {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// }

// async function safeSendMessage(phoneNumber, message) {
//   if (isWhatsappReady) {
//     return whatsappClient.sendMessage(`${phoneNumber}@c.us`, message);
//   }

//   return new Promise((resolve, reject) => {
//     pendingMessages.push({ phoneNumber, message, resolve, reject });
//   });
// }

// async function sendOtp(phoneNumber, customMessage = null) {
//   const otp = generateOtp();
//   otpStore.set(phoneNumber, otp);
//   setTimeout(() => otpStore.delete(phoneNumber), 5 * 60 * 1000); 

//   const message =
//     customMessage || `🛡️ Your OTP is: *${otp}*\n(Valid for 5 minutes)`;

//   await safeSendMessage(phoneNumber, message);
// }

// function verifyOtp(phoneNumber, otp) {
//   const stored = otpStore.get(phoneNumber);
//   if (!stored) return false;

//   const isValid = Otp.isValid(otp, stored);
//   if (isValid) otpStore.delete(phoneNumber);

//   return isValid;
// }

// // ========== Export Handlers ==========
// module.exports = {
//   sendOtp,
//   verifyOtp,
//   getLastQr: () => lastQr
// };
