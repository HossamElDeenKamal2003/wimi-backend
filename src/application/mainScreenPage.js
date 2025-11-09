const response = require("../shared/sharedResponse");
const products = require("../domain/models/products");

class MainScreenPage {
    async getMainScreenPage(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const lang = req.headers['lang'] || 'en';
            const welcomeMessage = lang === 'ar'
                ? "مرحبًا بك في منصة التداول"
                : "Welcome to the Trading Platform";

            const [productList, total] = await Promise.all([
                products.find().populate('traderId', 'firstName lastName email phoneNumber')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                products.countDocuments()
            ]);

            const mainScreenData = {
                welcomeMessage,
                products: productList,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };

            return response.success(res, mainScreenData, lang === 'ar'
                ? "تم جلب بيانات الصفحة الرئيسية بنجاح"
                : "Main screen data fetched successfully"
            );
        } catch (error) {
            return response.serverError(res, error.message);
        }
    }

    async filterByCategory(req, res){
        const { category } = req.body;
        try{
            const filteredProducts = await products.find({ category: category }).populate('traderId', 'firstName lastName email phoneNumber');
            return response.success(res, filteredProducts);
        }catch(error){
            console.log(error);
            return response.serverError(res, error.message)
        }
    }

    async searchByName(req, res) {
        const userId = req.user?.id;
        const { text } = req.body;
        const lang = req.headers['lang'] || 'en';
        const welcomeMessage = lang === 'ar'
            ? "مرحبًا بك في منصة التداول"
            : "Welcome to the Trading Platform";

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        try {
            const searchQuery = {
                $or: [
                    { title: { $regex: text, $options: 'i' } },
                    { description: { $regex: text, $options: 'i' } },
                    { category: { $regex: text, $options: 'i' } }
                ]
            };

            const [productList, total] = await Promise.all([
                products.find(searchQuery)
                    .populate('traderId', 'firstName lastName email phoneNumber')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                products.countDocuments(searchQuery)
            ]);

            const responseData = {
                welcomeMessage,
                products: productList,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };

            return response.success(res, responseData, lang === 'ar'
                ? "تم تنفيذ البحث بنجاح"
                : "Search completed successfully"
            );

        } catch (error) {
            return response.serverError(res, error.message);
        }
    }
}

module.exports = MainScreenPage;