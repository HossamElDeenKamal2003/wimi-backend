const User = require('../domain/models/userModel');
const response = require('../shared/sharedResponse');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const listShopping = require('../domain/models/cardShoppings');
const Product = require("../domain/models/products");
const orders = require('../domain/models/orders');
const {promise} = require("bcrypt/promises");
const favouriteModel = require('../domain/models/favourites');
const notificationModel = require('../domain/models/notification');
const mongoose = require('mongoose');
const { sendSms } = require('../shared/smsShared');
function generateUserId(length = 3) {
  if (length < 3) length = 3;
  const randomNumbers = Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, "0");
  return `U${randomNumbers}`;
}
class UserService {
    async signup(req, res) {
        try {
        const { username, phoneNumber, password } = req.body;
        if (!username || !phoneNumber || !password)
            return response.badRequest(res, "All fields are required");

        // ✅ تحقق من وجود المستخدم مسبقًا
        const existingUser = await User.findOne({ phoneNumber });
        if (existingUser)
            return response.conflict(res, "Phone number already in use");

        // ✅ توليد UID فريد
        let uniqueUserId;
        while (true) {
            uniqueUserId = generateUserId();
            const exists = await User.findOne({ UID: uniqueUserId });
            if (!exists) break;
        }

        // ✅ تشفير الباسورد
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ إنشاء المستخدم
        const user = new User({
            username,
            phoneNumber,
            UID: uniqueUserId,
            favourites: [],
            verify: false,
            otp: "",
            password: hashedPassword,
        });

        await user.save();

        return response.success(
            res,
            { id: user._id, UID: user.UID },
            "Signup successful",
            201
        );
        } catch (error) {
        console.error("Signup error:", error);
        return response.serverError(res, error.message);
        }
    }

// ✅ LOGIN FUNCTION
    async login(req, res) {
    try {
        const { phoneNumber, password } = req.body;
        console.log('Login attempt for phone number:', phoneNumber);
        console.log('Password', password);
        if (!phoneNumber || !password) {
            return response.badRequest(res, 'Phone number and password are required');
        }
        console.log('Finding user with phone number:', phoneNumber);
        // Find user
        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return response.unauthorized(res, 'Invalid credentials');
        }   
        console.log('User found:', user);

        // If not verified, send OTP
        if (!user.verify) {
        console.log('User not verified, sending OTP');
        const otp = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
        user.otp = otp;
        await user.save();
        await sendSms(res, phoneNumber, otp);
            return response.unauthorized(res, 'Phone number not verified. OTP sent.');
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return response.unauthorized(res, 'Invalid credentials');
        }

        // Generate token
        const token = jwt.sign(
        { id: user._id, phoneNumber: user.phoneNumber },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
        );

        const safeUser = {
        id: user._id,
        phoneNumber: user.phoneNumber,
        username: user.username
        };

        return response.success(res, { user: safeUser, token }, 'Login successful');
        } catch (error) {
            console.error(error);
            return response.serverError(res, error.message);
        }
    }


    // ✅ VERIFY OTP FUNCTION
    async verifyOtp(req, res) {
    try {
        const { phoneNumber, otp } = req.body;

        // Validation
        if (!phoneNumber) {
        return response.badRequest(res, 'Phone number is required');
        }
        console.log('Verifying OTP for phone number:', phoneNumber, 'with OTP:', otp);

        // Case 1: Request new OTP
        if (!otp) {
        const newOtp = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
        const user = await User.findOneAndUpdate(
            { phoneNumber },
            { otp: newOtp },
            { new: true }
        );

        if (!user) {
            return response.notFound(res, 'User not found');
        }

        await sendSms(phoneNumber, newOtp);
        return response.success(res, null, 'OTP sent successfully');
        }

        // Case 2: Verify OTP
        const user = await User.findOne({ phoneNumber });
        if (!user) {
        return response.notFound(res, 'User not found');
        }

        if (user.otp !== otp) {
        return response.unauthorized(res, 'Invalid OTP');
        }

        // Success → mark verified
        user.verify = true;
        user.otp = '';
        await user.save();

        return response.success(res, null, 'Phone number verified successfully');
    } catch (error) {
        console.error(error);
        return response.serverError(res, error.message);
    }
    }


    async addFavorite(req, res) {
        const { productId } = req.body;
        const userId = req.user.id;

        try {
            const user = await User.findById(userId);
            if (!user) {
                return response.notFound(res, 'User not found');
            }

            const existing = await favouriteModel.findOne({ userId, productId });

            let message;
            if (existing) {
                // Remove favorite
                await favouriteModel.deleteOne({ userId, productId });
                message = 'Product removed from favorites';
            } else {
                // Add favorite
                await favouriteModel.create({ userId, productId });
                message = 'Product added to favorites';
            }

            const favorites = await favouriteModel.find({ userId }).populate('productId');

            return response.success(res, favorites.map(f => f.productId), message);

        } catch (error) {
            return response.serverError(res, error.message);
        }
    }


    async removeFavorite(req, res) {
        const { productId } = req.body;
        const userId = req.user.id;
        const user = await User.findByIdAndUpdate(
            userId,
            { $pull: { favourites: productId } },
            { new: true }
        ).populate('favourites');
        return response.success(res, user.favourites, 'Product removed from favorites');
    }

    async listFavorites(req, res) {
        const userId = req.user.id;
        try {
            const favorites = await favouriteModel.aggregate([
                {
                    $match: { userId: new mongoose.Types.ObjectId(userId) }
                },
                {
                    $lookup: {
                        from: 'products',            
                        localField: 'productId',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $unwind: '$product' 
                },
                {
                    $replaceRoot: { newRoot: '$product' }
                }
            ]);

            return response.success(res, favorites, 'Favorite products');
        } catch (error) {
            return response.serverError(res, error.message);
        }
    }

    async addListShopping(req, res) {
        const userId = req.user.id;
        const productId = req.body.productId;

        try {
            if (!productId || !userId) {
                return response.badRequest(res, 'All fields are required');
            }
            const productExists = await Product.findOne({ _id: productId });
            if (!productExists) {
                return response.notFound(res, 'Product not found');
            }
            const alreadyAdded = await listShopping.findOne({ userId, productId });
            if (alreadyAdded) {
                return response.badRequest(res, 'Product already in your shopping list');
            }

            const newItem = await listShopping.create({ userId, productId });

            return response.success(res, newItem, 'Product added to cart');
        } catch (error) {
            return response.serverError(res, error.message);
        }
    }

    async listCardShopping(req, res) {
        const userId = req.user.id;
        try {
            const [cartItems, userOrders] = await Promise.all([
            listShopping.find({ userId }).populate('productId'),
            orders.find({ 
                userId, 
                status: { $in: ['Pending', 'Shipped', 'Delivered'] } 
            }).populate('products.productId')
            ]);

            const products = cartItems.map(item => item.productId);

            return response.success(res, {
            cart: products,
            orders: userOrders,
            cartLength: products.length
            }, 'Fetched shopping cart and orders successfully');
        } catch (error) {
            return response.serverError(res, error.message);
        }
     }


    async cancellOrder(req, res){
        const userId = req.user.id;
        const orderId = req.params.id;
        try{
            const cancellOrder = await orders.findOneAndUpdate(
                {_id: orderId},
                {status: 'Cancelled'},
                {new: true}
            );
            
            return response.success(res, {cancellOrder}, 'order cancelled successfully');

        }catch(error){
            return response.serverError(res, error.message);
        }
    }

    async deleteFromShopping(req, res) {
        const userId = req.user.id;
        const productId = req.body.productId;

        try {
            if (!productId) {
                return response.badRequest(res, 'Product ID is required');
            }

            const deletedItem = await listShopping.findOneAndDelete({ userId, productId });

            if (!deletedItem) {
                return response.notFound(res, 'Item not found in shopping cart');
            }

            return response.success(res, deletedItem, 'Item removed from shopping cart');
        } catch (error) {
            return response.serverError(res, error.message);
        }
    }

    async getMyNotification(req, res){
            const userId = req.user.id;
            try{
                const notifications = await notificationModel.find({userId: userId});
                return response.success(res, notifications);
            }catch(error){
                console.log(error)
                return response.serverError(res, error.message);
            }
    }

    async getUserData(req, res){
        const userId = req.user.id;
        try{
            const userData = await User.findOne({ _id: userId });
            if(!userData){
                return response.notFound(res, "User Not Found");
            }
            return response.success(res, {user: userData}, "User data fetched successfully");
        }catch(error){
            console.log(error);
            return response.serverError(res, error.message);
        }
    }
}

module.exports = new UserService();