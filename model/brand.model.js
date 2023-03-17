const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const brandSchema = new Schema({
    title: {
        type: String,
        required: true,
        unique: true,
    },
    category: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    }
}, {timestamps: true})

module.exports = mongoose.model("Brand", brandSchema);