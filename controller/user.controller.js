const User = require("../model/user.model");
const { generateToken, generateRefreshToken } = require("../config/jwt.config");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const validateMongodbId = require("../util/validateMongodbId");
const sendEmail = require("../util/mailer");
const crypto = require("crypto");

// Đăng ký
const createUser = asyncHandler(async (req, res) => {
    const { email } = req.body;
    try {
        const findUser = await User.findOne({ email });
        if (!findUser) {
            const user = req.body;
            const newUser = await User.create(user);
            res.json(newUser);
        } else {
            throw new Error("User already exists");
        }
    } catch (err) {
        throw new Error(err)
    }
})

// Đăng nhập
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    try {
        const findUser = await User.findOne({ email });
        if (findUser) {
            if ((await findUser.isPasswordMatched(password))) {
                // Tạo refresh token rồi lưu vào database và cookie
                const refreshToken = generateRefreshToken(findUser.id);
                const updateUser = await User.findByIdAndUpdate(findUser.id, {
                    refreshToken: refreshToken
                }, { new: true });
                res.cookie("refreshToken", refreshToken, {
                    httpOnly: true,
                    maxAge: 72 * 60 * 60 * 1000 // 3 ngày
                })

                res.json({
                    firstName: updateUser.firstName,
                    lastName: updateUser.lastName,
                    email: updateUser.email,
                    mobile: updateUser.mobile,
                    // Trả về access token
                    token: generateToken(updateUser.id)
                })
            } else {
                throw new Error("Wrong password");
            }
        } else {
            throw new Error("User doesn't exist");
        }
    } catch (err) {
        throw new Error(err);
    }
})

// Admin đăng nhập
const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    try {
        // Kiểm tra admin
        const findAdmin = await User.findOne({ email });
        if (findAdmin.role !== "admin") {
            throw new Error("You aren't an admin");
        }

        if (await findAdmin.isPasswordMatched(password)) {
            // Tạo refresh token rồi lưu vào database và cookie
            const refreshToken = generateRefreshToken(findAdmin.id);
            const updateUser = await User.findByIdAndUpdate(findAdmin.id, {
                refreshToken: refreshToken
            }, { new: true });
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                maxAge: 72 * 60 * 60 * 1000 // 3 ngày
            })

            res.json({
                firstName: updateUser.firstName,
                lastName: updateUser.lastName,
                email: updateUser.email,
                mobile: updateUser.mobile,
                // Trả về access token
                token: generateToken(updateUser.id)
            })
        } else {
            throw new Error("Wrong password")
        }
    } catch (err) {
        throw new Error(err);
    }
})

// Đăng xuất
const logout = asyncHandler(async (req, res) => {
    // Kiểm tra refresh token trong cookie
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        throw new Error("No refresh token in cookie");
    }

    // Xóa refresh token
    try {
        const findUser = await User.findOne({ refreshToken });
        if (!findUser) {
            res.clearCookie("refreshToken", {
                httpOnly: true,
                secure: true
            })
            return res.sendStatus(204);
        }
        await User.findOneAndUpdate({ refreshToken }, {
            refreshToken: ""
        })
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: true
        })
        return res.sendStatus(204);
    } catch (err) {
        throw new Error(err);
    }
})

// Tạo access token mới
const refreshToken = asyncHandler(async (req, res) => {
    // Kiểm tra refresh token trong cookie
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        throw new Error("No refresh token in cookie");
    }

    // Kiểm tra refresh token trong DB và decode
    try {
        const findUser = await User.findOne({ refreshToken });
        if (!findUser) {
            throw new Error("Refresh token doesn't exist on DB");
        }
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);
        if (decoded.id !== findUser.id) {
            throw new Error("There are something wrong with refresh token");
        }
        const token = generateToken(findUser.id);
        res.json({ token });
    } catch (err) {
        throw new Error(err);
    }
})

// Cập nhật người dùng
const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.user;
    const { firstName, lastName, email, mobile, address } = req.body;
    try {
        validateMongodbId(id);
        const updateUser = await User.findByIdAndUpdate(id, {
            firstName,
            lastName,
            email,
            mobile,
            address
        }, { new: true });
        res.json(updateUser)
    } catch (err) {
        throw new Error(err);
    }
})

// Lấy 1 người dùng
const getAUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        validateMongodbId(id);
        const user = req.user;
        if (user.id !== id) {
            throw new Error("Cannot perform this action");
        }
        res.json(user);
    } catch (err) {
        throw new Error(err);
    }
})

// Lấy tất cả người dùng
const getAllUsers = asyncHandler(async (req, res) => {
    try {
        const allUser = await User.find();
        res.json(allUser);
    } catch (err) {
        throw new Error(err);
    }
})

//Xóa tài khoản
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        validateMongodbId(id);
        // Xóa bằng quyền admin
        if (req.user.role === "admin") {
            await User.findByIdAndDelete(id);
            res.json("Delete successfully");
        } else {

            // Xóa bằng quyền người dùng cơ bản
            if (req.user.id === id) {
                await User.findByIdAndDelete(req.user.id);
                res.json("Delete successfully");
            } else {
                throw new Error("Cannot perform this action");
            }
        }
    } catch (err) {
        throw new Error(err);
    }
})

// Khóa tài khoản
const blockUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        validateMongodbId(id);
        // Khóa bằng quyền admin
        if (req.user.role === "admin") {
            await User.findByIdAndUpdate(id, {
                isBlocked: true
            });
            res.json("Block successfully");
        } else {

            // Khóa bằng quyền người dùng cơ bản
            if (req.user.id === id) {
                await User.findByIdAndUpdate(id, {
                    isBlocked: true
                });
                res.json("Block successfully");
            } else {
                throw new Error("Cannot perform this action");
            }
        }
    } catch (err) {
        throw new Error(err);
    }
})

// Mở khóa tài khoản
const unblockUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        validateMongodbId(id);
        // Mở khóa bằng quyền admin
        if (req.user.role === "admin") {
            await User.findByIdAndUpdate(id, {
                isBlocked: false
            });
            res.json("Unblock successfully");
        } else {

            // Mở khóa bằng quyền người dùng cơ bản
            if (req.user.id === id) {
                await User.findByIdAndUpdate(id, {
                    isBlocked: false
                });
                res.json("Unblock successfully");
            } else {
                throw new Error("Cannot perform this action");
            }
        }
    } catch (err) {
        throw new Error(err);
    }
})

// Thay đổi mật khẩu
const updatePassword = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        validateMongodbId(id);
        // Thay đổi bằng quyền admin
        if (req.user.role === "admin") {
            const findUser = await User.findById(id);
            findUser.password = req.body.password;
            await findUser.save();
            res.json("Change password successfully");
        } else {

            // Thay đổi bằng quyền người dùng cơ bản
            if (req.user.id === id) {
                req.user.password = req.body.password;
                req.user.save();
                res.json("Change password successfully");
            } else {
                throw new Error("Cannot perform this action");
            }
        }
    } catch (err) {
        throw new Error(err);
    }
})

// Tạo token quên mật khẩu
const forgotPasswordToken = asyncHandler(async (req, res) => {
    const { email } = req.body;
    try {
        // Kiểm tra người dùng có tồn tại không
        const findUser = await User.findOne({ email });
        if (!findUser) {
            throw new Error("User doesn't exist");
        }
        const token = await findUser.generatePasswordResetToken();
        // Lưu passwordResetToken và passwordResetExpires xuống DB
        await findUser.save();
        const resetUrl = `Hi, please follow this link to reset your password. This link is valid till 5 minutes from now. <a href='http://localhost:${process.env.PORT}/api/user/reset-password/${token}'>Click Here</>`;
        // Người nhận
        const data = {
            to: email,
            text: "Hey you",
            subject: "Forgot password link",
            html: resetUrl
        }
        sendEmail(data);
        res.json(token);
    } catch (err) {
        throw new Error(err);
    }
})

// Làm mới mật khẩu
const resetPassword = asyncHandler(async (req, res) => {
    const {password} = req.body;
    const {token} = req.params;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    try {
        const findUser = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: {$gt: Date.now()}
        });
        if (!findUser) {
            throw new Error("Token expired, please try again later");
        }
        findUser.password = password;
        findUser.passwordResetToken = undefined;
        findUser.passwordResetExpires = undefined;
        await findUser.save();
        res.json("Reset password successfully");
    } catch (err) {
        throw new Error(err);
    }
})

module.exports = {
    createUser,
    loginUser,
    loginAdmin,
    logout,
    refreshToken,
    updateUser,
    getAUser,
    getAllUsers,
    deleteUser,
    blockUser,
    unblockUser,
    updatePassword,
    forgotPasswordToken,
    resetPassword,
}