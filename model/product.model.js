const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    category: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    sold: {
        type: Number,
        default: 0
    },
    images: [
        {
            filename: String,
            path: String
        }
    ],
    tags: String,
    ratings: [
        {
            star: Number,
            comment: String,
            postedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        }
    ],
    totalRating: {
        type: String,
        default: 0
    },
}, { timestamps: true })

module.exports = mongoose.model("Product", productSchema);