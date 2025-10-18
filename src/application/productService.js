const Product = require('../domain/models/products');
const response = require('../shared/sharedResponse');
const cloudinary = require('../confiq/cloudinaryConfiq');
const sharp = require('sharp');
const fs = require('fs/promises');
class ProductsService {
    async addProduct(req, res) {
        const traderId = req.user?.id;
        try {
            let imageUrls = [];
            if (req.files && req.files.length > 0) {
                imageUrls = await Promise.all(req.files.map(async (file) => {
                    const resizedPath = file.path.replace(/(\.[\w\d_-]+)$/i, '_resized$1');
                    await sharp(file.path)
                        .resize(800, 800, { fit: 'inside' })
                        .toFile(resizedPath);

                    const result = await cloudinary.uploader.upload(resizedPath, { folder: 'products' });

                    await fs.unlink(file.path);
                    await fs.unlink(resizedPath);

                    return result.secure_url;
                }));
            }
            const product = new Product({
                ...req.body,
                traderId,
                images: imageUrls
            });
            await product.save();
            return response.success(res, product, 'Product created', 201);
        } catch (error) {
            return response.serverError(res, error.message);
        }
    }

    async updateProduct(req, res) {
        const productId = req.params.id;
        const traderId = req.user?.id;
        try {
            const product = await Product.findById(productId);
            if (!product) return response.notFound(res, 'Product not found');
            if (product.traderId.toString() !== traderId)
                return response.unauthorized(res, 'Not authorized');

            // Handle new images if provided
            if (req.files && req.files.length > 0) {
                let imageUrls = [];
                for (const file of req.files) {
                    const resizedPath = file.path.replace(/(\.[\w\d_-]+)$/i, '_resized$1');
                    await sharp(file.path)
                        .resize(800, 800, { fit: 'inside' })
                        .toFile(resizedPath);

                    const result = await cloudinary.uploader.upload(resizedPath, { folder: 'products' });
                    imageUrls.push(result.secure_url);

                    fs.unlinkSync(file.path);
                    fs.unlinkSync(resizedPath);
                }
                req.body.images = imageUrls;
            }

            Object.assign(product, req.body);
            await product.save();
            return response.success(res, product, 'Product updated');
        } catch (error) {
            return response.serverError(res, error.message);
        }
    }

    async deleteProduct(req, res) {
        const productId = req.params.id;
        const traderId = req.user?.id;
        try {
            const product = await Product.findById(productId);
            if (!product) return response.notFound(res, 'Product not found');
            if (product.traderId.toString() !== traderId)
                return response.unauthorized(res, 'Not authorized');
            await product.deleteOne();
            return response.success(res, null, 'Product deleted');
        } catch (error) {
            return response.serverError(res, error.message);
        }
    }

    async getProductById(req, res) {
        const productId = req.params.id;
        try {
            const product = await Product.findById(productId).populate('traderId', 'name email firstName phoneNumber');
            if (!product) return response.notFound(res, 'Product not found');
            return response.success(res, product, 'Product fetched');
        }catch(error) {
            return response.serverError(res, error.message);
        }
    }
}

module.exports = new ProductsService();