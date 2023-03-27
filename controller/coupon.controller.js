const Coupon = require("../model/coupon.model");
const asyncHandler = require("express-async-handler");
const validateMongodbId = require("../util/validateMongodbId");

// Tạo coupon
const createCoupon = asyncHandler(async (req, res) => {
    const { name } = req.body;
    try {
        const findCoupon = await Coupon.findOne({ name });
        if (findCoupon) {
            throw new Error("Coupon already exists");
        }
        const newCoupon = await Coupon.create(req.body);
        res.json(newCoupon)
    } catch (err) {
        throw new Error(err);
    }
})

// Cập nhật coupon
const updateCoupon = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        validateMongodbId(id);
        const newCoupon = await Coupon.findByIdAndUpdate(id, req.body, { new: true });
        res.json(newCoupon);
    } catch (err) {
        throw new Error(err);
    }
})

// Lấy 1 coupon
const getACoupon = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        validateMongodbId(id);
        const coupon = await Coupon.findById(id);
        res.json(coupon);
    } catch (err) {
        throw new Error(err);
    }
})

// Lấy tất cả coupon
const getAllCoupons = asyncHandler(async (req, res) => {
    try {
        const coupons = await Coupon.find();
        res.json(coupons);
    } catch (err) {
        throw new Error(err);
    }
})

//Xóa coupon
const deleteCoupon = asyncHandler(async (req, res) => {
    const {id} = req.params;
    try {
        validateMongodbId(id);
        await Coupon.findByIdAndDelete(id);
        res.json("Delete Successfully");
    } catch(err) {
    }
})

module.exports = {
    createCoupon,
    updateCoupon,
    getACoupon,
    getAllCoupons,
    deleteCoupon
}