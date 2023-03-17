const Product = require("../model/product.model");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const validateMongodbId = require("../util/validateMongodbId");

// Tạo sản phẩm
const createProduct = asyncHandler(async (req, res) => {
    try {
        // Tạo slug cho sản phẩm
        const { title } = req.body;
        if (title) {
            const findProduct = await Product.findOne({ title });
            if (findProduct) {
                throw new Error("Product already exist");
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
                throw new Error("This Page does not exists");
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


module.exports = {
    createProduct,
    updateProduct,
    deleteProduct,
    getAProduct,
    getManyProducts,
}