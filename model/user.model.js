const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true
    },
    address: String,
    role: {
        type: String,
        default: "user"
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    cart: {
        type: Array,
        default: []
    },
    wishlist: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
        }
    ],
    refreshToken: {
        type: String
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
}, { timestamps: true })

// Hàm thực hiện trước khi lưu người dùng
userSchema.pre("save", function (next) {
    if (!this.isModified("password")) {
        next();
    }
    // Hash mật khẩu
    const salt = bcrypt.genSaltSync(10);
    this.password = bcrypt.hashSync(this.password, salt);
    next();
})

// Kiểm tra mật khẩu có đúng không
userSchema.methods.isPasswordMatched = function (enteredPassword) {
    return bcrypt.compareSync(enteredPassword, this.password);
}

// Tạo token để đặt lại mật khẩu
userSchema.methods.generatePasswordResetToken = async function () {
    const resetToken = crypto.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.passwordResetExpires = Date.now() + 5 * 60 * 1000; // + 5 phút
    return resetToken;
}

module.exports = mongoose.model("User", userSchema);