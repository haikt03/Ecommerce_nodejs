const express = require("express");
const router = express.Router();
const {authMiddleware, isAdmin} = require("../middleware/authMiddleware");
const { createCoupon, updateCoupon, getACoupon, getAllCoupons, deleteCoupon } = require("../controller/coupon.controller");

router.post("/", authMiddleware, isAdmin, createCoupon);
router.put("/:id", authMiddleware, isAdmin, updateCoupon);
router.get("/:id", getACoupon);
router.get("/", getAllCoupons);
router.delete("/:id", authMiddleware, isAdmin, deleteCoupon);

module.exports = router;