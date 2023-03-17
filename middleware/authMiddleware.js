const User = require("../model/user.model");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

// Middleware xác thực người dùng
const authMiddleware = asyncHandler(async (req, res, next) => {
    let token;
    if (req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
            const user = await User.findById(decoded.id);
            req.user = user;
            next();
        } catch (err) {
            throw new Error("Not authorized, please login again");
        }
    } else {
        throw new Error("There isn't token attached to header");
    }
})

const isAdmin = asyncHandler(async (req, res, next) => {
    const { email } = req.user;
    try {
        const findUser = await User.findOne({ email });
        if (findUser.role !== "admin") {
            throw new Error("You aren't an admin");
        }
        next();
    } catch (err) {
        throw new Error(err);
    }
})

module.exports = { authMiddleware, isAdmin };