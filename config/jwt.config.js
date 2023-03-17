const jwt = require("jsonwebtoken");

// Tạo access token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET_KEY, { expiresIn: "1h" });
}

// Tạo refresh token
const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });
}

module.exports = { generateToken, generateRefreshToken };