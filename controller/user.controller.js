const User = require("../model/user.model");
const Cart = require("../model/cart.model");
const Product = require("../model/product.model");
const Coupon = require("../model/coupon.model");
const { generateToken, generateRefreshToken } = require("../config/jwt.config");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const validateMongodbId = require("../util/validateMongodbId");
const sendEmail = require("../util/mailer");
const crypto = require("crypto");
const cloudinary = require("cloudinary").v2;

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
            if (req.user.role !== "admin") {
                throw new Error("Cannot perform this action");
            }
            const findUser = await User.findById(id);
            res.json(findUser);
        } else {
            res.json(user);
        }
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
    const { password } = req.body;
    const { token } = req.params;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    try {
        const findUser = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
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

// Lấy danh sách sản phẩm mong muốn
const getWishlist = asyncHandler(async (req, res) => {
    try {
        const findUser = await User.findById(req.user._id).populate("wishlist");
        res.json(findUser);
    } catch (err) {
        throw new Error(err);
    }
})

// Thêm vào giỏ hàng
const addToCart = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    try {
        let findCart = await Cart.findOne({ orderBy: userId });
        if (!findCart) {
            let newCart = await Cart.create({ orderBy: userId });
            findCart = newCart;
        }
        const productAdded = req.body;
        validateMongodbId(productAdded._id);
        let products = [...findCart.products];
        // Kiểm tra sản phẩm đã tồn tại trong giỏ hàng chưa rồi thêm vào
        let isExist = false;
        for (let i = 0; i < products.length; i++) {
            if (products[i].product.toString() === productAdded._id.toString()) {
                isExist = true;
                products[i].count += productAdded.count;
                break;
            }
        }
        if (isExist === false) {
            const findProduct = await Product.findById(productAdded._id);
            products.push({
                product: productAdded._id,
                count: productAdded.count,
                price: findProduct.price
            })
        }
        // Cập nhật lại tổng tiền của giỏ hàng
        let cartTotal = 0;
        for (let i = 0; i < products.length; i++) {
            cartTotal += products[i].price * products[i].count;
        }
        const updateCart = await Cart.findOneAndUpdate({ orderBy: userId }, {
            products: products,
            cartTotal: cartTotal,
            totalAfterDiscount: cartTotal
        }, { new: true })
        res.json(updateCart);
    } catch (err) {
        throw new Error(err);
    }
})

// Xóa sản phẩm khỏi giỏ hàng
const removeFromCart = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    try {
        let findCart = await Cart.findOne({ orderBy: userId });
        if (!findCart) {
            throw new Error("Cart doesn't exist");
        }
        let products = findCart.products;
        const {prodId} = req.body;
        validateMongodbId(prodId);
        // Kiểm tra sản phẩm đã tồn tại trong giỏ hàng chưa và thực hiện xóa
        let isExist = false;
        for (let i = 0; i < products.length; i++) {
            if (products[i].product.toString() === prodId) {
                isExist = true;
                const reduceAmount = products[i].price * products[i].count;
                findCart.cartTotal -= reduceAmount;
                findCart.totalAfterDiscount -= reduceAmount;
                products.splice(i, 1);
                break;
            }
        }
        if (isExist === false) {
            throw new Error("Product doesn't exist in cart");
        }
        findCart.save();
        res.json(findCart);
    } catch (err) {
        throw new Error(err);
    }
})

// Lấy thông tin giỏ hàng
const getUserCart = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    try {
        const findCart = await Cart.findOne({orderBy: userId}).populate("products.product");
        res.json(findCart);
    } catch (err) {
        throw new Error(err);
    }
})

// Làm trống giỏ hàng
const emptyCart = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    try {
        const cart = await Cart.findOneAndDelete({orderBy: userId});
        res.json(cart);
    } catch (err) {
        throw new Error(err);
    }
})

// Áp dụng mã giảm giá
const applyCoupon = asyncHandler(async (req, res) => {
    const {coupon} = req.body;
    const userId = req.user.id;
    try {
        const findCoupon = await Coupon.findOne({name: coupon});
        if (!findCoupon) {
            throw new Error("Wrong coupon");
        }
        if ((Date.now() - findCoupon.expiry) >= 0) {
            throw new Error("Invalid Coupon");
        }
        let cart = await Cart.findOne({orderBy: userId});
        cart.totalAfterDiscount = Math.round(cart.cartTotal * (100 -findCoupon.discount) / 100);
        cart.save();
        res.json(cart);
    } catch (err) {
        throw new Error(err);
    }
})

// Cập nhật avatar
const uploadAvatar = asyncHandler(async (req, res) => {
    const fileData = req.file;
    try {
        if (!fileData) {
            throw new Error("No file uploaded!");
        }
        // Đẩy ảnh lên DB
        let findUser = await User.findById(req.user.id);
        findUser.avatar = {
            filename: fileData.fieldname,
            path: fileData.path
        }
        await findUser.save();
        res.json(findUser);
    } catch (err) {
        // Xóa ảnh trên cloud khi xảy ra lỗi
        cloudinary.uploader.destroy(fileData.filename);
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
    getWishlist,
    addToCart,
    removeFromCart,
    getUserCart,
    emptyCart,
    applyCoupon,
    uploadAvatar,
}