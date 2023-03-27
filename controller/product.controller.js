const Product = require("../model/product.model");
const User = require("../model/user.model");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const validateMongodbId = require("../util/validateMongodbId");
const cloudinary = require("cloudinary").v2;

// Tạo sản phẩm
const createProduct = asyncHandler(async (req, res) => {
    const { title } = req.body;
    try {
        // Tạo slug cho sản phẩm
        if (title) {
            const findProduct = await Product.findOne({ title });
            if (findProduct) {
                throw new Error("Product already exists");
            }
            req.body.slug = slugify(title);
        }
        const newProduct = await Product.create(req.body);
        res.json(newProduct)
    } catch (err) {
        throw new Error(err);
    }
})

//Cập nhật sản phẩm
const updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        validateMongodbId(id);
        const { title } = req.body;
        if (title) {
            req.body.slug = slugify(title);
        }
        const newProduct = await Product.findByIdAndUpdate(id, req.body, { new: true });
        res.json(newProduct);
    } catch (err) {
        throw new Error(err);
    }
})

// Xóa sản phẩm
const deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        validateMongodbId(id);
        await Product.findByIdAndDelete(id);
        res.json("Delete successfully");
    } catch (err) {
        throw new Error(err);
    }
})

// Lấy 1 sản phẩm
const getAProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        validateMongodbId(id);
        const findProduct = await Product.findById(id);
        res.json(findProduct);
    } catch (err) {
        throw new Error(err);
    }
})

// Lấy nhiều sản phẩm
const getManyProducts = asyncHandler(async (req, res) => {
    // Lọc và tạo query để tìm kiếm
    let { page, sort, limit, fields, ...excludedQuery } = req.query;
    let queryStr = JSON.stringify(excludedQuery);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    try {
        let query = Product.find(JSON.parse(queryStr));

        // Sắp xếp
        if (sort) {
            const sortBy = sort.split(",").join(" ");
            query = query.sort(sortBy);
        } else {
            query = query.sort("-createdAt");
        }

        // Lọc các trường
        if (fields) {
            const filerFields = fields.split(",").join(" ");
            query = query.select(filerFields);
        } else {
            query = query.select("-__v");
        }

        // Phân trang
        if (page >= 1 && limit > 0) {
            const skip = (page - 1) * limit;
            const productCount = await Product.countDocuments();
            if (skip >= productCount) {
                throw new Error("This Page doesn't exist");
            }
            query = query.skip(skip).limit(limit);
        }

        // Thực hiện các query
        const products = await query;
        res.json(products);
    } catch (err) {
        throw new Error(err);
    }
})

// Thêm sản phẩm vào danh sách mong muốn
const addToWishlist = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { prodId } = req.body
    try {
        validateMongodbId(prodId);
        const findUser = await User.findById(userId);
        // Kiểm tra xem người dùng đã thêm sản phẩm vào wishlist chưa
        const alreadyAdded = findUser.wishlist.find(
            (id) => (id.toString() === prodId.toString())
        )

        // Thực hiện thêm và xóa sản phẩm khỏi wishlist
        if (alreadyAdded) {
            const user = await User.findByIdAndUpdate(userId, {
                $pull: { wishlist: prodId }
            }, { new: true })
            res.json(user);
        } else {
            const user = await User.findByIdAndUpdate(userId, {
                $push: { wishlist: prodId }
            }, { new: true })
            res.json(user);
        }
    } catch (err) {
        throw new Error(err);
    }
})

// Đánh giá sản phẩm
const rateProduct = asyncHandler(async (req, res) => {
    const user = req.user;
    const { prodId, star, comment } = req.body;
    try {
        validateMongodbId(prodId);
        const findProduct = await Product.findById(prodId);
        // Kiểm tra xem người dùng đã đánh giá chưa
        const alreadyRated = findProduct.ratings.find(
            (userId) => (userId.postedBy.toString() === user.id.toString())
        );
        // Thực hiện đánh giá
        if (alreadyRated) {
            await Product.findByIdAndUpdate(prodId, {
                ratings: {
                    star: star,
                    comment: comment,
                    postedBy: user.id
                }
            }, { new: true })
        } else {
            await Product.findByIdAndUpdate(prodId, {
                $push: {
                    ratings: {
                        star: star,
                        comment: comment,
                        postedBy: user.id
                    }
                }
            }, { new: true })
        }
        // Cập nhật lại điểm đánh giá trung bình
        const newProduct = await Product.findById(prodId);
        let totalRating = newProduct.ratings.length;
        let ratingSum = newProduct.ratings
            .map((item) => item.star)
            .reduce((prev, curr) => prev + curr, 0);

        let actualRating = Math.round(ratingSum / totalRating);
        let finalProduct = await Product.findByIdAndUpdate(prodId, {
            totalRating: actualRating
        }, { new: true });
        res.json(finalProduct);
    } catch (err) {
        throw new Error(err);
    }
})

// Tải ảnh lên
const uploadImages = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const fileData = req.files;
    try {
        validateMongodbId(id);
        let product = await Product.findById(id);
        if (!product) {
            throw new Error("Product doesn't exist");
        }
        if (!fileData) {
            throw new Error("No file uploaded!");
        }
        // Đẩy ảnh lên DB
        for (let i = 0; i < fileData.length; i++) {
            product.images.push({
                filename: fileData[i].filename,
                path: fileData[i].path
            })
        }
        await product.save();
        res.json(product);
    } catch (err) {
        // Xóa ảnh trên cloud nếu xảy ra lỗi
        let filenames = fileData.map((item) => item.filename);
        cloudinary.api.delete_resources(filenames);
        throw new Error(err);
    }
})

module.exports = {
    createProduct,
    updateProduct,
    deleteProduct,
    getAProduct,
    getManyProducts,
    addToWishlist,
    rateProduct,
    uploadImages
}