const mongoose = require("mongoose");

// Xác thực id của MongoDB
const validateMongodbId = (id) => {
    const isValid = mongoose.Types.ObjectId.isValid(id);
    if (!isValid) throw new Error("This id isn't valid");
}

module.exports = validateMongodbId;