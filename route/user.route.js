const express = require("express");
const router = express.Router();
const { createUser, loginUser, loginAdmin, refreshToken, logout, updateUser, getAUser, getAllUsers, deleteUser, blockUser, unblockUser, updatePassword, forgotPasswordToken, resetPassword, getWishlist, addToCart, removeFromCart, getUserCart, applyCoupon, uploadAvatar, emptyCart } = require("../controller/user.controller");
const {authMiddleware, isAdmin} = require("../middleware/authMiddleware");
const uploadCloud = require("../middleware/uploader");


router.post("/register", createUser);
router.post("/login", loginUser);
router.post("/admin-login", loginAdmin);
router.post("/logout", logout);
router.post("/refresh", refreshToken);
router.put("/edit-user", authMiddleware, updateUser);
router.get("/wishlist", authMiddleware, getWishlist);
router.get("/cart", authMiddleware, getUserCart);
router.get("/:id", authMiddleware, getAUser);
router.get("/", authMiddleware, isAdmin, getAllUsers);
router.delete("/empty-cart", authMiddleware, emptyCart);
router.delete("/:id", authMiddleware, deleteUser);
router.post("/block-user/:id", authMiddleware, blockUser);
router.post("/unblock-user/:id", authMiddleware, unblockUser);
router.post("/change-password/:id", authMiddleware, updatePassword);
router.post("/forgot-password-token", forgotPasswordToken);
router.post("/reset-password/:token", resetPassword);
router.post("/add-to-cart", authMiddleware, addToCart);
router.post("/remove-from-cart", authMiddleware, removeFromCart);
router.post("/coupon", authMiddleware, applyCoupon);
router.put("/avatar", authMiddleware, uploadCloud.single("image"),  uploadAvatar);

module.exports = router;