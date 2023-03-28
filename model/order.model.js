const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema({
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
    paymentIntent: {
        id: String,
        method: {
            type: String,
            default: "COD",
            enum: [
                "COD",
                "Payment on delivery"
            ]
        },
        amount: Number,
        currency: {
            type: String,
            default: "usd",
            enum: [
                "usd",
                "eur",
                "vnd"
            ]
        }
    },
    orderStatus: {
        type: String,
        enum: [
            "Not processed",
            "Processing",
            "Dispatched",
            "Cancelled",
            "Delivered",
        ]
    },
    orderBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, {timestamps: true})

module.exports = mongoose.model("Order", orderSchema);