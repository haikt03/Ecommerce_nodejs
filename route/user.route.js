const express = require("express");
const router = express.Router();
const { createUser, loginUser, loginAdmin, refreshToken, logout, updateUser, getAUser, getAllUsers, deleteUser, blockUser, unblockUser, updatePassword, forgotPasswordToken, resetPassword } = require("../controller/user.controller");
const {authMiddleware, isAdmin} = require("../middleware/authMiddleware");

router.post("/register", createUser);
router.post("/login", loginUser);
router.post("/admin-login", loginAdmin);
router.post("/logout", logout);
router.post("/refresh", refreshToken);
router.put("/edit-user", authMiddleware, updateUser);
router.get("/:id", authMiddleware, getAUser);
router.get("/", authMiddleware, isAdmin, getAllUsers);
router.delete("/:id", authMiddleware, deleteUser);
router.post("/block-user/:id", authMiddleware, blockUser);
router.post("/unblock-user/:id", authMiddleware, unblockUser);
router.post("/change-password/:id", authMiddleware, updatePassword);
router.post("/forgot-password-token", forgotPasswordToken);
router.post("/reset-password/:token", resetPassword);

module.exports = router;