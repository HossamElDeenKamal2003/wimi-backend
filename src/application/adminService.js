const traders = require('../domain/models/trader');
const users = require('../domain/models/userModel');
const products = require('../domain/models/products');
const orders = require('../domain/models/orders');
const response = require("../shared/sharedResponse");
const mongoose = require("mongoose");
const directPayemntorders = require('../domain/models/directPaymentModel');
const notificationModel = require('../domain/models/notification');
const BlockedTraders = require('../domain/models/blockedTraders');
const trader = require('../domain/models/trader');
const requestModel = require('../domain/models/requestForBack');
class adminService {
    async getMainData(req, res) {
        try {
            const usersNumber = await users.countDocuments();
            const tradersNumber = await traders.countDocuments();
            const totalUsers = usersNumber + tradersNumber;
            const waitingTraders = await traders.find({ waiting: true });
            const totalOrders = await orders.find().countDocuments(); 
            const deliveredOrders = await orders.find({ status: 'Delivered' });
            let totalEarnings = 0;
            for (const order of deliveredOrders) {
                totalEarnings += order.totalPrice
            }
            const adminEarnings = totalEarnings * 0.3;
            const tradersEarnings = totalEarnings * 0.7;
            return response.success(res,{
                totalUsers,
                waitingTraders: waitingTraders.length,
                totalOrders: totalOrders,
                totalEarnings: totalEarnings.toFixed(2),
                adminEarnings: adminEarnings.toFixed(2),
                tradersEarnings: tradersEarnings.toFixed(2),
            });
        } catch (error) {
            console.log(error);
            return response.serverError(res, error.message);
        }
    }

    async getAllUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const totalUsers = await users.countDocuments();
            const totalTraders = await traders.countDocuments();
            const usersList = await users
                .find()
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

                const tradersList = await traders
                .find()
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            return response.success(res, {
                users: usersList,
                traders: tradersList,
                pagination: {
                    page,
                    limit,
                    totalUsers,
                    totalTraders,
                    totalUserPages: Math.ceil(totalUsers / limit),
                    totalTraderPages: Math.ceil(totalTraders / limit),
                }
            });
        } catch (error) {
            console.log(error);
            return response.serverError(res, error.message);
        }
    }

    async blockOrDeleteNormalUserOrTrader(req, res) {
        const { userId, type } = req.params;
        const { role } = req.query;

        if (!userId || !type || !role) {
            return res.status(400).json({ message: 'Missing userId, type, or role.' });
        }
        try {
            const user = await traders.findById(userId);
            if (!user) {
                return res.status(404).json({ message: `${role} not found.` });
            }
            if (type === 'del') {
                await traders.findByIdAndDelete(userId);
                return res.status(200).json({ message: `${role} deleted successfully.` });
            }
            if (type === 'block') {
                if(user.block === true){
                    const updated = await traders.findByIdAndUpdate(
                    userId,
                    { block: false },
                    { new: true }
                ); 
                return res.status(200).json({ message: `${role} blocked successfully.`, data: updated });
                }else{
                     const updated = await traders.findByIdAndUpdate(
                    userId,
                    { block: true },
                    { new: true }
                ); 
                return res.status(200).json({ message: `${role} blocked successfully.`, data: updated });
                }
               
            }

            return res.status(400).json({ message: 'Invalid type. Use "del" or "block".' });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: error.message });
        }
    }

    async getWaitingTraders(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const [waitingTraders, totalCount] = await Promise.all([
                traders.find({ waiting: true }).sort({ createdAt: -1 }).limit(limit).skip(skip).lean(),
                traders.countDocuments({ waiting: true })
            ]);

            const totalPages = Math.ceil(totalCount / limit);

            return response.success(res, {
                data: waitingTraders,
                pagination: {
                    total: totalCount,
                    page,
                    limit,
                    totalPages
                }
            });
        } catch (error) {
            console.error('Error fetching waiting traders:', error);
            return response.serverError(res, error.message);
        }
    }

    async toogleWaiting(req, res) {
        const traderId = req.params.id;
        try {
            const updateWaiting = await traders.findOneAndUpdate(
                { _id: traderId },
                { waiting: false },
                { new: true }
            );
            if (!updateWaiting) {
                return response.badRequest(req, 'Failed to Update waiting');
            }
            return response.success(res, updateWaiting);
        } catch (error) {
            console.log(error);
            return response.serverError(res, error.message);
        }
    }

    async getTradersProfits(req, res) {
        try {
            const deliveredOrders = await orders.find({ status: "Delivered" });
            console.log('traders', deliveredOrders);

            const profitsMap = new Map();

            deliveredOrders.forEach(order => {
                const traderId = order.traderId?.toString();
                const profit = order.totalPrice * 0.1;

                if (profitsMap.has(traderId)) {
                    profitsMap.set(traderId, profitsMap.get(traderId) + profit);
                } else {
                    profitsMap.set(traderId, profit);
                }
            });
            const allTraders = await traders.find({}); // هنا بنجيب كل التجار
            console.log("traders.....", allTraders);
            const result = [];
            profitsMap.forEach((profit, traderId) => {
                const trader = allTraders.find(t => t._id.toString() === traderId.toString());

                if (trader) {
                    result.push({
                        traderName: `${trader.firstName ?? ""} ${trader.lastName ?? ""}`.trim(),
                        traderId: trader._id,
                        phoneNumber: trader.phoneNumber,
                        totalProfit: profit,
                    });
                } else {
                    result.push({
                        traderName: "Unknown",
                        traderId: traderId,
                        totalProfit: profit,
                    });
                }
            });
            return response.success(res, result);
        } catch (error) {
            console.error("Error:", error);
            return response.serverError(res, error.message);
        }
    }

    async getPlatformProfit(req, res) {
        try {
            const deliveredOrders = await orders.find({ status: "Delivered" });
            let totalRevenue = 0;
            deliveredOrders.forEach(order => {
                if (order.totalPrice) {
                    totalRevenue += order.totalPrice;
                }
            });
            const platformProfit = totalRevenue * 0.10;
            console.log("total : ", totalRevenue);
            console.log("profit : ", platformProfit);
            return response.success(res, { platformProfit });
        } catch (error) {
            console.error("Error calculating platform profit:", error);
            return response.serverError(res, error.message);
        }
    }

    async sendNotification(req, res){
        const { userId, type, text } = req.body;
        try{    
            const newNotification = new notificationModel({
                type,
                text,
                userId
            });
            if(!type || !text || !userId){
                return response.badRequest(res, 'All Fields Are Required');
            }
            await newNotification.save();
            return response.success(res, newNotification);
        }catch(error){
            console.log(error);
            return response.serverError(res, error.message);
        }
    }

    async deleteTraderData(req, res) {
        const { phoneNumber } = req.body;
        try {
            if (!phoneNumber) {
            return response.badRequest(res, 'phoneNumber is required');
            }

            const trader = await traders.findOne({ phoneNumber });
            if (!trader) {
            return response.notFound(res, 'Trader not found');
            }

            const isBlocked = await BlockedTraders.findOne({ phoneNumber });
            if (!isBlocked) {
            await new BlockedTraders({ phoneNumber }).save();
            }

            await traders.findOneAndDelete({ phoneNumber });

            return response.success(res, null, 'Trader deleted successfully');
        } catch (error) {
            console.log('error : ', error);
            return response.serverError(res, error.message);
        }
    }

    async getTraderData(req, res){
        const id = req.params.id;
        try{
            console.log(id);
            const traderData = await traders.findOne({ _id: id }).select("-password -otp");
            if(!traderData){
                return response.notFound(res, "Trader Not Found");
            }
            return response.success(res, traderData);
        }catch(error){
            console.log(error); 
            return response.serverError(res, error.message);
        }
    }

    async getTradersWallets(req, res){
        try{
            const tradersWallets = await traders.find().sort({ createdAt: -1 }).lean().select("wallet phoneNumber firstName lastName Iban nationalId address googleMapLink email");
            if(!tradersWallets){
                return response.notFound(res, "Traders Not Found");
            }
            return response.success(res, tradersWallets);
        }catch(error){
            console.log(error);
            return response.serverError(res, error.message);
        }
    }

    async getRequests( req, res){
        try{
            const req = await requestModel
                .find()
                .sort({ createdAt: -1 })
                .populate("userId traderId")
                .lean();
            return response.success(res, req);
        }catch(error){
            console.log(error);
            return response.serverError(res, error.message);
        }
    }

    async updateStatus(req, res){
          const { orderId, amount } = req.body;

        try {
            // 1️⃣ Update the request status
            const updatedRequest = await requestModel.findOneAndUpdate(
                { _id: orderId },
                { status: 'Delivered' },
                { new: true }
            );

            if (!updatedRequest) {
                return response.badRequest(res, "Error while updating order status");
            }

            // 2️⃣ Deduct the amount from trader’s wallet
            const { traderId } = updatedRequest;
            const trader = await traders.findById(traderId);
            if (!trader) {
                return response.badRequest(res, "Trader not found");
            }

            const newWallet = (trader.wallet || 0) - (amount || 0);
            const updatedTrader = await traders.findByIdAndUpdate(
                traderId,
                { wallet: newWallet },
                { new: true }
            );

            if (!updatedTrader) {
                return response.badRequest(res, "Error while updating trader wallet");
            }

            // 3️⃣ Return success response
            return response.success(res, {
                message: "Order delivered and trader wallet updated successfully",
                request: updatedRequest,
                trader: updatedTrader
            });

        } catch (error) {
            console.error(error);
            return response.serverError(res, error.message);
        }
    }

    async updateTraderWallet(req, res){
       const { traderId, amount } = req.body;

        try {
            // 1️⃣ Validate inputs
            if (!traderId || typeof amount !== 'number') {
                return response.badRequest(res, "traderId and amount are required and amount must be a number");
            }

            // 2️⃣ Find the trader
            const trader = await traders.findById(traderId);
            if (!trader) {
                return response.badRequest(res, "Trader not found");
            }

            // 3️⃣ Calculate new wallet balance
            const newWallet = (trader.wallet || 0) - amount;
            if (newWallet < 0) {
                return response.badRequest(res, "Insufficient wallet balance");
            }

            // 4️⃣ Update wallet
            const updatedTrader = await traders.findByIdAndUpdate(
                traderId,
                { wallet: newWallet },
                { new: true }
            );

            if (!updatedTrader) {
                return response.badRequest(res, "Failed to update wallet");
            }

            // 5️⃣ Respond success
            return response.success(res, {
                message: "Trader wallet updated successfully",
                trader: updatedTrader
            });

        } catch (error) {
            console.error(error);
            return response.serverError(res, error.message);
        }
    }

    async getBlockedProducts(req, res){
        try{
            const Products = await products.find({ verify: false });
            return response.success(res, Products);
        }catch(error){
            console.log(error);
            return response.serverError(res, error.message);
        }
    }

    async updateProductVerify(req, res){
        const { productId } = req.body;
        try{
            const updateVerify = await products.findOneAndUpdate(
                { _id: productId },
                { verify: true },
                { new: true }
            );
            if(!updateVerify){
                return response.badRequest(res, "Failed to update Verify for this product");
            }
            return response.success(res, updateVerify, "Verify updated successfullly");
        }catch(error){
            connsole.log(error);
            return response.serverError(res, error.message);
        }
    }

    async getOrders(req, res) {
        try {
            const allOrders = await orders.find().sort({ orderDate: -1 }).populate('products.traderId');
            const directOrders = await directPayemntorders.find().sort({ createdAt: -1 }).populate('traderId phoneNumber');

            return response.success(res, { allOrders, directOrders });
        } catch (error) {
            console.error(error);
            return response.serverError(res, error.message);
        }
    }

   async adminLogin(req, res) {
        const { username, password } = req.body;

        try {
            if (!username || !password) {
            return response.badRequest(res, "Username and password are required");
            }

            if (username !== "wimisa" || password !== "wimi2005@@") {
            return response.badRequest(res, "Invalid username or password");
            }

            return response.success(res, "Login successful");
        } catch (error) {
            console.error(error);
            return response.serverError(res, error.message);
        }
    }

    async updatTraderData(req, res) {
    try {
        const { data } = req.body;

        // التحقق من وجود الداتا والـ ID
        if (!data || !data._id) {
            return response.badRequest(res, "معرّف التاجر مفقود");
        }

        const traderId = data._id;

        // إنشاء نسخة نظيفة من البيانات
        const fieldsToUpdate = { ...data };

        // 🔒 منع تعديل أي حقول حسّاسة
        delete fieldsToUpdate._id;
        delete fieldsToUpdate.password;
        delete fieldsToUpdate.balance;
        delete fieldsToUpdate.role;
        delete fieldsToUpdate.createdAt;
        delete fieldsToUpdate.updatedAt;
        delete fieldsToUpdate.__v;

        // تحديث التاجر
        const updatedTrader = await trader.findByIdAndUpdate(
            traderId,
            { $set: fieldsToUpdate },
            { new: true } // يرجع النسخة الجديدة بعد التعديل
        );

        if (!updatedTrader) {
            return response.notFound(res, "التاجر غير موجود");
        }

        return response.success(res, updatedTrader, "تم تحديث بيانات التاجر بنجاح");

    } catch (error) {
        console.log(error);
        return response.serverError(res, error.message);
    }
}




}

module.exports = adminService;