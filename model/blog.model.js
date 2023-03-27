const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const blogSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    numViews: {
        type: Number,
        default: 0
    },
    isLiked: {
        type: Boolean,
        default: false
    },
    isDisliked: {
        type: Boolean,
        default: false
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    dislikes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    author: {
        type: String,
        default: "Admin"
    },
    images: [
        {
            filename: String,
            path: String
        }
    ],
}, {
    timestamps: true
})

module.exports = mongoose.model("Blog", blogSchema);