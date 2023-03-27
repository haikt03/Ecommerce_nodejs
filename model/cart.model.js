const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cartSchema = new Schema({
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            },
            count: Number,
            price: Number
        }
    ],
    cartTotal: {
        type: Number,
        default: 0
    },
    totalAfterDiscount: {
        type: Number,
        default: 0
    },
    orderBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true })

module.exports = mongoose.model("Cart", cartSchema);