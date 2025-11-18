const Trader = require('../domain/models/trader');
const Orders = require('../domain/models/orders');
const users = require('../domain/models/userModel');
const productsModel = require('../domain/models/products');
const response = require('../shared/sharedResponse');
const couponModel = require('../domain/models/coupons');
const notificationModel = require('../domain/models/notification');
const listShopping = require('../domain/models/cardShoppings')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs/promises');
const sharp = require('sharp');
const requestModel = require('../domain/models/requestForBack');
const cloudinary = require('../confiq/cloudinaryConfiq');
const { sendOtp } = require('../domain/whatsapp/whatsapp');
const DirectPayment = require('../domain/models/directPaymentModel');
const { sendSms } = require('../shared/smsShared');
const trader = require('../domain/models/trader');

function generateUserId(length = 3) {
  if (length < 3) length = 3;
  const randomNumbers = Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, "0");
  return `U${randomNumbers}`;
}

function generateTraderId(length = 3) {
  if (length < 3) length = 3;
  const randomNumbers = Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, "0");
  return `T${randomNumbers}`;
}

function generateRandomString(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function createNormalOrders(orderId, amount, traderId) {
    const order = await Orders.findById(orderId);
    if (!order) return false;

    const newRequest = new requestModel({
        traderId,
        orderId,
        userId: order.userId,
        amount,
        status: 'pending'
    });

    await newRequest.save();
    return !!newRequest._id; 
}

async function createRequestFordirectPayment(orderId, amount, traderId) {
    const directOrder = await DirectPayment.findOne({_id: orderId});
    if (!directOrder || !directOrder.orders || directOrder.orders.length === 0) return false;

    const phoneNumber = directOrder.orders[0].phoneNumber;
    const user = await users.findOne({ phoneNumber }).select("_id");
    if (!user) return false;

    const newRequest = new requestModel({
        traderId,
        userId: user._id,
        amount,
        orderId,
        status: 'pending'
    });

    await newRequest.save();
    return !!newRequest._id;
}

class TraderService {
    async signup(req, res) {
        try {
        const traderData = req.body;

        // ✅ 1. Check required fields
        const requiredFields = [
            "firstName",
            "lastName",
            "email",
            "phoneNumber",
            "password",
            "googleMapLink",
            "address",
        ];
        const missingFields = requiredFields.filter((field) => !traderData[field]);
        if (missingFields.length > 0) {
            return response.badRequest(
            res,
            `Missing required field(s): ${missingFields.join(", ")}`
            );
        }

        // ✅ 2. Ensure unique trader UID
        let uniqueTraderId;
        while (true) {
            uniqueTraderId = generateTraderId();
            const exists = await Trader.findOne({ UID: uniqueTraderId });
            if (!exists) break; // Found a unique ID
        }
        traderData.UID = uniqueTraderId;

        // ✅ 3. Check for duplicates (email / phone)
        const existingTrader = await Trader.findOne({ email: traderData.email });
        if (existingTrader)
            return response.badRequest(res, "Email already exists");

        const existingPhone = await Trader.findOne({
            phoneNumber: traderData.phoneNumber,
        });
        if (existingPhone)
            return response.badRequest(res, "Phone number already exists");

        // ✅ 4. Handle image uploads
        const fileFields = [
            "imageOftrading",
            "imageOfnationalId",
            "imageOfiban",
            "imageOffront",
            "logo",
            "billImage",
            "imageOfcertificate"
        ];

        for (const field of fileFields) {
            const file = req.files?.[field]?.[0];
            if (file) {
            const resizedPath = file.path.replace(
                /(\.[\w\d_-]+)$/i,
                "_resized$1"
            );
            await sharp(file.path)
                .resize(800, 800, { fit: "inside" })
                .toFile(resizedPath);

            const result = await cloudinary.uploader.upload(resizedPath, {
                folder: "traders",
            });

            traderData[field] = result.secure_url;

            // Cleanup temporary files
            await fs.unlink(file.path);
            await fs.unlink(resizedPath);
            }
        }

        // ✅ 5. Set defaults
        traderData.password = await bcrypt.hash(traderData.password, 10);
        traderData.coupon = "";
        traderData.verify = false;
        traderData.block = false;
        traderData.otp = "";
        traderData.waiting = true;
        traderData.wallet = 0;

        // ✅ 6. Save to DB
        const newTrader = new Trader(traderData);
        await newTrader.save();

        return response.success(
            res,
            { id: newTrader._id, UID: newTrader.UID },
            "Trader created successfully",
            201
        );
        } catch (error) {
        console.error("Signup error:", error);
        return response.serverError(res, error.message);
        }
    }

    async login(req, res) {
        const { email, phoneNumber, password } = req.body;

        if ((!email && !phoneNumber) || !password) {
            return response.badRequest(res, 'Email or phone number and password are required');
        }

        try {
            const conditions = [];
            if (email) conditions.push({ email });
            if (phoneNumber) conditions.push({ phoneNumber });

            const trader = await Trader.findOne({ $or: conditions });

            if (!trader) {
                return response.unauthorized(res, 'Invalid credentials');
            }
            const isBlocked = trader.block;
            const isWaiting = trader.waiting;
            const uid = trader.UID;
            const first_name = trader.firstName;
            const second_name = trader.lastName;
            const username = first_name + ' ' + second_name;
            // ✅ check verify status
            if (!trader.verify) {
                const otp = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
                trader.otp = otp;
                await trader.save();

                // send OTP to trader (via SMS / Email)
                await sendSms(res, trader.phoneNumber, otp);

                return response.unauthorized(res, 'Account not verified. OTP sent.');
            }

            // ✅ password check
            const isMatch = await bcrypt.compare(password, trader.password);
            if (!isMatch) {
                return response.unauthorized(res, 'Invalid credentials');
            }

            // ✅ generate JWT
            const token = jwt.sign(
                { id: trader._id, username: trader.email, role: 'trader' },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            return response.success(res, { token, phoneNumber, uid, username, isBlocked, isWaiting }, 'Login successful');

        } catch (error) {
            return response.serverError(res, error.message);
        }
    }

    async verifyOtp(req, res) {
        const { phoneNumber, email, otp } = req.body;

        try {
            // Case 1: request new OTP
            if ((phoneNumber || email) && !otp) {
                const code = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
                const trader = await Trader.findOneAndUpdate(
                    { $or: [{ phoneNumber }, { email }] },
                    { otp: code },
                    { new: true }
                );
                if (!trader) {
                    return response.notFound(res, 'Trader not found');
                }
                await sendSms(trader.phoneNumber || trader.email, code);
                return response.success(res, null, 'OTP sent successfully');
            }

            // Case 2: verify OTP
            if (!otp || (!phoneNumber && !email)) {
                return response.badRequest(res, 'Email/Phone and OTP are required');
            }

            const trader = await Trader.findOne({ $or: [{ phoneNumber }, { email }] });
            if (!trader) {
                return response.notFound(res, 'Trader not found');
            }

            if (trader.otp !== otp) {
                return response.unauthorized(res, 'Invalid OTP');
            }

            trader.verify = true;
            trader.otp = '';
            await trader.save();

            return response.success(res, null, 'Account verified successfully');
        } catch (error) {
            console.log(error);
            return response.serverError(res, error.message);
        }
    }

    async getTraderById(req, res) {
        const traderId = req.user?.id; 
        try {
            const trader = await Trader.findById(traderId).select('-password');
            if (!trader) {
                return response.notFound(res, 'Trader not found');
            }
            const orders = await Orders.find({ traderId: traderId });
            return response.success(res, { trader, orders }, 'Trader fetched');
        } catch (error) {
            return response.serverError(res, error.message);
        }
    }

    async getTraderProducts(req, res){
        const traderId = req.user?.id;
        try{
         const products = await productsModel.find({traderId: traderId});
            if (!products || products.length === 0) {
                return response.notFound(res, 'No products found for this trader');
            }
            return response.success(res, products, 'Products fetched successfully');
        }catch (error) {
            return response.serverError(res, error.message);
        }
    }

    async addCoupon(req, res){
        const { coupon } = req.body;
        const traderId = req.user.id;
        try{
            if(!coupon){
                return response.badRequest(res, "Must Invalid Coupon");
            }
            const existCoupon = await couponModel.find({ coupon: coupon });
            if(!existCoupon){
                return res.badRequest(res, "Please Insert Invalid Coupon");
            }
            const addCouponInDB = await couponModel.findOneAndUpdate(
                { _id: traderId },
                { coupon: coupon },
                { new: true }
            );
            
            return response.success(res, "Coupon added successfully");
        }catch(error){
            console.log(error);
            response.serverError(res, error.message);
        }
    }

    async getMyNotification(req, res){
        const traderId = req.user.id;
        try{
            const notifications = await notificationModel.find({userId: traderId});
            return response.success(res, notifications);
        }catch(error){
            console.log(error)
            return response.serverError(res, error.message);
        }
    }

     async checkFoundUser(req, res){
        const { phoneNumber, username } = req.body;
        const traderId = req.user.id;
        try{
            const userExist = await users.findOne({ phoneNumber });

            if (!userExist) {
                // ✅ جلب اسم التاجر
                const traderData = await Trader.findById(traderId)
                    .select('firstName lastName')
                    .lean();

                const traderFullName = traderData
                    ? `${traderData.firstName} ${traderData.lastName}`
                    : "أحد التجار";

                // ✅ جلب اسم المستخدم الجديد من الـ req.body

                // ✅ إنشاء باسورد و UID
                const pass = generateRandomString(6);

                let uniqueUserId = generateUserId();
                let userWithSameId = await users.findOne({ UID: uniqueUserId });
                while (userWithSameId) {
                    uniqueUserId = generateUserId();
                    userWithSameId = await users.findOne({ UID: uniqueUserId });
                }

                // ✅ تشفير الباسورد
                const hashedPassword = await bcrypt.hash(pass, 10);

                // ✅ إنشاء المستخدم الجديد
                const newUser = new users({
                    username: username,
                    phoneNumber: phoneNumber,
                    UID: uniqueUserId,
                    password: hashedPassword,
                });

                await newUser.save();

                // ✅ إرسال رسالة تحتوي على اسم التاجر
                await sendSms(
                    phoneNumber,
                    `👋 عميل منصة ويمي أهلاً بك!
                تم إنشاء حساب جديد لك بواسطة التاجر: ${traderFullName}.
                📱 اسم المستخدم: ${username}
                🔑 كلمة المرور: ${pass}
                📞 رقم الهاتف: ${phoneNumber}`
                );

                return response.success(
                    res,
                    { userId: newUser._id },
                    "User created successfully"
                );
            }else {
                 return response.success(
                    res,
                    { userId: userExist._id },
                    "User found successfully"
                    );
            }

            // ✅ لو المستخدم موجود فعلاً
           

        }catch(error){
            console.log(error);
            return response.serverError(res, error.message);
        }
    }

   async directPayment(req, res) {
    const { phoneNumber } = req.body;
    try {
        if (!phoneNumber) {
        return response.badRequest(res, "All fields are required");
        }

        const existingUser = await users.findOne({ phoneNumber });
        if (existingUser) {
            return response.badRequest(res, "User with this phone number already exists");
        }

        // 🔑 Generate random password (8 chars alphanumeric)
        const plainPassword = Math.random().toString(36).slice(-8);

        // 🔐 Hash the password
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // 🆕 Create new user
        const newUser = new users({
        phoneNumber,
        password: hashedPassword,
        });

        await newUser.save();

        // 📲 Send password via WhatsApp
        await sendSms(phoneNumber, `🔑 Your account has been created!\nYour password is: *${plainPassword}*`);

        return response.success(res, { userId: newUser._id }, "User created successfully");
    } catch (error) {
        console.log(error);
        return response.serverError(res, error.message);
    }
    }

    async requestOrderbyTrader(req, res) {
        try {
            const { userId, productId, quantity } = req.body;

            // Validate required fields
            if (!userId || !productId || quantity === undefined) {
                return response.badRequest(res, 'userId, productId, and quantity are required');
            }

            const qty = Number(quantity);
            if (isNaN(qty) || qty <= 0) {
                return response.badRequest(res, 'Quantity must be a positive number');
            }

            // Fetch product with price and traderId
            const product = await productsModel.findOne({ _id: productId })
                .select('price traderId')
                .lean();

            if (!product) {
                console.log('Product not found:', productId);
                return response.notFound(res, 'Product not found');
            }

            if (typeof product.price !== 'number' || isNaN(product.price)) {
                return response.error(res, 'Invalid product price');
            }

            const totalPrice = product.price * qty;
            console.log('Total Price:', totalPrice);

            const orderData = {
                ...req.body,
                userId,
                traderId: product.traderId,
                quantity: qty,
                totalPrice,
            };

            const newOrder = new Orders(orderData);
            await newOrder.save();

            response.success(res, newOrder, 'Order created', 201);

            // Delete item from shopping cart
            const cartItem = await listShopping.findOneAndDelete({ userId, productId });
            if (cartItem) {
                console.log('Item deleted successfully from cart shopping');
            } else {
                console.log('Item not found in cart shopping');
            }

        } catch (error) {
            console.error('Error in requestOrderbyTrader:', error);
            return response.serverError(res, 'Internal server error');
        }
    }

    async getMyDirectOrders(req, res){
        const traderId = req.user?.id;
        try{
            if(!traderId){
                return response.badRequest(res, "Trader ID is required");
            }
            const orders = await DirectPayment.find({ traderId: traderId }).lean();
            return response.success(res, orders);
        }catch(error){
            console.log(error);
            return response.serverError(res, error.message);
        }
    }

    async getTraderData(req, res){
        const traderId = req.user?.id;
        try{
            const trader = await Trader.findById(traderId).select('-password');
            if(!trader){
                return response.notFound(res, 'Trader not found');
            }
            return response.success(res, trader);
        }catch(error){
            console.log(error);
            return response.serverError(res, error.message);
        }
    }

    async getWallet(req, res){
        const traderId = req.user.id;
        try{
            const traderWallet = await Trader.findOne({ _id: traderId }).select("wallet");
            if(!traderWallet){
                return response.notFound(res, "Trader Not Have Wallet");
            }
            return response.success(res, traderWallet)
        }catch(error){
            console.log(error);
            return response.serverError(res, error.message);
        }
    }

    async addRequests(req, res){
        const { orderId, type, amount } = req.body;
        const traderId = req.user.id;

        try {
            if (!orderId || !type || !amount) {
                return response.badRequest(res, "orderId, type, and amount are required");
            }

            let check = false;

            if (type === '1') {
                // Normal order
                check = await createNormalOrders(orderId, amount, traderId);
            } 
            else if (type === '2') {
                // Direct payment order
                check = await createRequestFordirectPayment(orderId, amount, traderId);
            } 
            else {
                return response.badRequest(res, "Invalid request type");
            }
            console.log(check)
            if (check === true) {
                return response.success(res, "Request sent successfully for the admins");
            } else {
                return response.badRequest(res, "Failed to create request — order or user not found");
            }

        } catch (error) {
            console.error("Error in addRequests:", error);
            return response.serverError(res, error.message);
        }
    }

    async checkUserExist(req, res){
        const { phoneNumber } = req.body;;
        try{
            const user = await users.findOne({ phoneNumber });
            if(!user){
                return response.badRequest(res, "User not Found");
            }
            return response.success(res, user);
        }catch(error){
            console.log(error);;
            return response.serverError(res, error.message);
        }
    }
}

module.exports = new TraderService();